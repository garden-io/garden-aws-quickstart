import * as blueprints from "@aws-quickstart/eks-blueprints";
import {
  GlobalResources,
  ImportHostedZoneProvider,
} from "@aws-quickstart/eks-blueprints";
import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ec2 from "aws-cdk-lib/aws-ec2"
import * as eks from "aws-cdk-lib/aws-eks";
import { ParameterAddOn, ParameterAddonProps } from "../constructs/parameter-addon";
import { GardenAddOn } from "../constructs/garden-addon";

// params helper
const staticAddOns: blueprints.ClusterAddOn[] = []
function staticParameter(props: ParameterAddonProps) {
  const p = new ParameterAddOn(props)
  staticAddOns.push(p)
  return p
}

export class GardenEKSDevCluster {
  static readonly parameters = {
    // IAM options
    fullAccessRole: staticParameter({
      id: "IAMEKSFullAccessRole",
      props: {
        type: "String",
        description: `
          Optional.

          The ARN of the IAM role that gets access to the EKS cluster.

          Everyone that can assume this role will have full access to the EKS cluster created
          in this stack. You are responsible for managing the trust policy of this role and allow users
          to assume it.

          Mutually exclusive with IAMEKSFullAccessPrincipals parameter. You must either supply an
          IAMEKSFullAccessRole parameter, or IAMEKSFullAccessPrincipals, but not both.
        `
      }
    }).valueAsString,
    fullAccessPrincipals: staticParameter({
      id: "IAMEKSFullAccessPrincipals",
      props: {
        type: "List<String>",
        description: `
        Optional.

        List of ARN principals, like IAM users or roles, that should be allowed to assume the role
        to get access to the EKS cluster.

        Mutually exclusive with the IAMEKSFullAccessRole parameter. You must either supply an
        IAMEKSFullAccessRole parameter, or IAMEKSFullAccessPrincipals, but not both.
      `
      }
    }).valueAsList,

    // ECR options
    ecrRepoNames: staticParameter({
      id: "ECRRepositories",
      props: {
        type: "List<String>",
        description: `
          Optional.

          The default value enables you to launch the quickstart example (https://github.com/garden-io/quickstart-example) on your Garden Development cluster.

          ECR repositories to create.
        `
      }
    }).valueAsList,
    ecrPrefix: staticParameter({
      id: "ECRPrefix",
      props: {
        type: "String",
        description: `
          Prefix of ECR repositories.
        `
      }
    }).valueAsString,

    // Ingress options
    subdomain: staticParameter({
      id: "IngressSubdomain",
      props: {
        type: "String",
        description: `
        The subdomain that can be used for ingress to the development environments, e.g. garden.mycompany.com
        Needs to be a hosted domain in Route53RecordTarget.
        `
      }
    }).valueAsString,
    hostedZoneID: staticParameter({
      id: "IngressRoute53HostedZoneId",
      props: {
        type: "AWS::Route53::HostedZone::Id",
        description: `
          The ID of the Route53 hosted zone with the domain that can be used for ingress
          to the development environments
        `
      }
    }).valueAsString,

    // EKS options
    clusterName: staticParameter({
      id: "EKSClusterName",
      props: {
        type: "String",
        description: `
          The name of the EKS cluster. Defaults to garden-dev-cluster.
        `
      }
    }).valueAsString,
    minNodeGroupSize: staticParameter({
      id: "EKSNodeGroupMinSize",
      props: {
        type: "Number",
        description: `
          The minimum number of nodes in the EKS cluster created by this stack. Defaults to 1.
        `
      }
    }).valueAsNumber,
    maxNodeGroupSize: staticParameter({
      id: "EKSNodeGroupMaxSize",
      props: {
        type: "Number",
        description: `
          The maximum number of nodes in the EKS cluster created by this stack. Defaults to 10.
        `
      }
    }).valueAsNumber,
  }

  async build(scope: Construct, props: cdk.StackProps) {
    const accountId = cdk.Fn.sub("${AWS::AccountId}")
    const region = cdk.Fn.sub("${AWS::Region}")

    const parameters = GardenEKSDevCluster.parameters

    const garden = new GardenAddOn({
      accountId: accountId,
      region: region,
      parameters,
    })

    // TODO: Document why
    blueprints.HelmAddOn.validateHelmVersions = false

    // hack to skip validation of managed node groups, as the values are only tokens during synthetisation
    blueprints.GenericClusterProvider.prototype["validateInput"] = () => {}

    const clusterProvider = new blueprints.GenericClusterProvider({
      version: eks.KubernetesVersion.V1_24,
      mastersRole: blueprints.getResource(context => {
        return iam.Role.fromRoleArn(context.scope, "mastersRole", garden.mastersRoleARN)
      }),
      managedNodeGroups: [
        {
            id: "mng1",
            amiType: eks.NodegroupAmiType.AL2_X86_64,
            instanceTypes: [new ec2.InstanceType("m5.large")],
            minSize: parameters.minNodeGroupSize,
            maxSize: parameters.maxNodeGroupSize,
        }
      ]
    })

    await blueprints.EksBlueprint.builder()
      .name(parameters.clusterName)
      .clusterProvider(clusterProvider)
      .account(accountId)
      .region(region)
      .resourceProvider(
        GlobalResources.HostedZone,
        new ImportHostedZoneProvider(parameters.hostedZoneID, parameters.subdomain)
      )
      .resourceProvider(
        GlobalResources.Certificate,
        new blueprints.CreateCertificateProvider(
          "garden-devcluster-ingress-wildcard",
          `*.${parameters.subdomain}`,
          GlobalResources.HostedZone
        )
      )
      .addOns(
        ...staticAddOns,
        garden,
        new blueprints.CoreDnsAddOn(),
        new blueprints.AwsLoadBalancerControllerAddOn(),
        new blueprints.ExternalDnsAddOn({
          hostedZoneResources: [blueprints.GlobalResources.HostedZone],
        }),
        new blueprints.NginxAddOn({
          version: "0.15.2",
          internetFacing: true,
          backendProtocol: "tcp",
          externalDnsHostname: parameters.subdomain,
          crossZoneEnabled: false,
          certificateResourceName: GlobalResources.Certificate,
        }),
        new blueprints.SecretsStoreAddOn({ rotationPollInterval: "120s" }),
        new blueprints.ClusterAutoScalerAddOn(),
        )
        .buildAsync(scope, scope.node.tryGetContext("GardenDevClusterStackID"), {
          ...props,
          description: `
            Garden EKS cluster to be used by development teams for software development and CI purposes.
          `
        });
  }
}

