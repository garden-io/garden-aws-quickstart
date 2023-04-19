import * as blueprints from "@aws-quickstart/eks-blueprints";
import {
  GlobalResources,
  ImportHostedZoneProvider,
} from "@aws-quickstart/eks-blueprints";
import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ec2 from "aws-cdk-lib/aws-ec2"
import { KubernetesVersion, NodegroupAmiType } from "aws-cdk-lib/aws-eks";
import { DeployImagePullSecret } from "../constructs/pullsecret";
import { ParameterAddOn } from "../constructs/parameter-addon";
export const PARAMETER_INGRESS_SUBDOMAIN = "IngressSubdomain"
export const PARAMETER_INGRESS_ROUTE53_HOSTEDZONEID = "IngressRoute53HostedZoneId"
export const PARAMETER_IAM_ROLE = "IAMRole"
export const PARAMETER_EKS_NODEGROUP_MIN_SIZE = "EKSNodeGroupMinSize"
export const PARAMETER_EKS_NODEGROUP_MAX_SIZE = "EKSNodeGroupMaxSize"
export const PARAMETER_EKS_CLUSTER_NAME = "EKSClusterName"
/**
 * See docs/patterns/nginx.md for mode details on the setup.
 */
export class EKSBlueprintStackBuilder {
  async build(scope: Construct, id: string, props: cdk.StackProps) {
    const iamroleParam = new ParameterAddOn({
      id: PARAMETER_IAM_ROLE,
      properties: {
        type: "String",
        description: `
          The IAM role ARN that should be added to the aws-auth configmap in the EKS cluster.
          Everyone that can assume this role will have full access to the EKS cluster created
          in this stack.
        `
      }
    })

    const subdomainParam = new ParameterAddOn({
      id: PARAMETER_INGRESS_SUBDOMAIN,
      properties: {
        type: "String",
        description: `
          The subdomain that can be used for ingress to the development environments, e.g. garden.mycompany.com
          Needs to be a hosted domain in Route53RecordTarget.
        `
      }
    });

    const hostedzoneIdParam = new ParameterAddOn({
      id: PARAMETER_INGRESS_ROUTE53_HOSTEDZONEID,
      properties: {
        type: "AWS::Route53::HostedZone::Id",
        description: `
          The ID of the Route53 hosted zone with the domain that can be used for ingress
          to the development environments
        `
      }
    });

    const minNodeGroupSizeParam = new ParameterAddOn({
      id: PARAMETER_EKS_NODEGROUP_MIN_SIZE,
      properties:{
        type: "Number",
        default: 1,
        description: `
          The minimum number of nodes in the EKS cluster created by this stack. Defaults to 1.
        `
      }
    });

    const maxNodeGroupSizeParam = new ParameterAddOn({
      id: PARAMETER_EKS_NODEGROUP_MAX_SIZE,
      properties:{
        type: "Number",
        default: 10,
        description: `
          The maximum number of nodes in the EKS cluster created by this stack. Defaults to 10.
        `
      }
    });

    const clusterName = new ParameterAddOn({
      id: PARAMETER_EKS_CLUSTER_NAME,
      properties:{
        type: "String",
        default: "garden-dev-cluster",
        description: `
          The name of the EKS cluster. Defaults to garden-dev-cluster.
        `
      }
    });

    blueprints.HelmAddOn.validateHelmVersions = false;

    const accountId = cdk.Fn.sub("${AWS::AccountId}")
    const region = cdk.Fn.sub("${AWS::Region}")

    // hack to skip validation of managed node groups, as the values are only tokens during synthetisation
    blueprints.GenericClusterProvider.prototype["validateInput"] = () => {}

    const clusterProvider = new blueprints.GenericClusterProvider({
      version: KubernetesVersion.V1_24,
      mastersRole: blueprints.getResource(context => {
        return iam.Role.fromRoleArn(context.scope, "masterRoleArn", iamroleParam.valueAsString);
      }),
      managedNodeGroups: [
        {
            id: "mng1",
            amiType: NodegroupAmiType.AL2_X86_64,
            instanceTypes: [new ec2.InstanceType('m5.large')],
            minSize: minNodeGroupSizeParam.valueAsNumber,
            maxSize: maxNodeGroupSizeParam.valueAsNumber,
        }
      ]
    })

    const cluster = await blueprints.EksBlueprint.builder()
      .name(clusterName.valueAsString)
      .clusterProvider(clusterProvider)
      .account(accountId)
      .region(region)
      // TODO: Parametrize K8s version?
      .resourceProvider(
        GlobalResources.HostedZone,
        new ImportHostedZoneProvider(hostedzoneIdParam.valueAsString, subdomainParam.valueAsString)
      )
      .resourceProvider(
        GlobalResources.Certificate,
        new blueprints.CreateCertificateProvider(
          "wildcard-cert",
          cdk.Fn.join(".", ["*", subdomainParam.valueAsString]),
          GlobalResources.HostedZone
        )
      )
      .addOns(
        iamroleParam,
        subdomainParam,
        hostedzoneIdParam,
        minNodeGroupSizeParam,
        maxNodeGroupSizeParam,
        clusterName,

        new blueprints.CoreDnsAddOn(),
        new blueprints.AwsLoadBalancerControllerAddOn(),
        new blueprints.ExternalDnsAddOn({
          hostedZoneResources: [blueprints.GlobalResources.HostedZone],
        }),
        new blueprints.NginxAddOn({
          version: "0.15.2",
          internetFacing: true,
          backendProtocol: "tcp",
          externalDnsHostname: cdk.Fn.ref(PARAMETER_INGRESS_SUBDOMAIN),
          crossZoneEnabled: false,
          certificateResourceName: GlobalResources.Certificate,
        }),
        new blueprints.SecretsStoreAddOn({ rotationPollInterval: "120s" }),
        new blueprints.ClusterAutoScalerAddOn(),
        new DeployImagePullSecret({ accountId, region }),
      )
      .buildAsync(scope, id, props);

    // This allows the nodes to push to AWS registry
    // TODO: Use IRSA once Garden in-cluster-builder supports it
    // TODO: At least limit it to the repostories that belong to this stack
    cluster
      .getClusterInfo()
      .nodeGroups?.at(0)
      ?.role?.addManagedPolicy(
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AmazonEC2ContainerRegistryPowerUser"
        )
      );
  }
}
