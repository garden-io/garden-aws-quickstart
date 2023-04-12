import * as blueprints from "@aws-quickstart/eks-blueprints";
import {
  GlobalResources,
  ImportHostedZoneProvider,
  PlatformTeam,
} from "@aws-quickstart/eks-blueprints";
import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import { ECRRepository } from "./ecr";
import { KubernetesVersion } from "aws-cdk-lib/aws-eks";
import { DeployImagePullSecret } from "./pullsecret";
import { ArnPrincipal } from "aws-cdk-lib/aws-iam";
import { IamRoleResourceProvider } from "./iamrole";

export const PARAMETER_SUBDOMAIN = "subdomain"
export const PARAMETER_HOSTEDZONEID = "hostedZoneId"
export const PARAMETER_IAMROLE = "iamrole"
export const PARAMETER_IAMUSERS = "iamusers"
/**
 * See docs/patterns/nginx.md for mode details on the setup.
 */
export class DevClusterConstruct {
  async eksCluster(scope: Construct, id: string) {
    // TODO
    const iamRoleArnCtx = "arn:aws:iam::123456789023:role/AWSReservedSSO_PlatformEngineers_4ed12acae0543"
    const iamUsersArnsCtx = [new ArnPrincipal(iamRoleArnCtx)]
    // const iamUsers = cdk.Fn.split(",", cdk.Fn.ref(PARAMETER_IAMUSERS)).map(element =>
    //   new ArnPrincipal(element)
    // )


    blueprints.HelmAddOn.validateHelmVersions = false;

    const accountId = cdk.Fn.sub("${AWS::AccountId}")
    const region = cdk.Fn.sub("${AWS::Region}")
    //const team = new PlatformTeam({name: "platform", userRoleArn: cdk.Fn.join(":",["arn", "aws", "iam:", cdk.Fn.ref("AWS::Region"), "garden-dev-cluster-role"])})
    const team: blueprints.Team = new PlatformTeam({name: "platform", userRoleArn: "arn:aws:iam::049586690729:saml-provider/AWSSSO_2f3b4250d4c1e8f9_DO_NOT_DELETE"})

    const cluster = await blueprints.EksBlueprint.builder()
      .account(accountId)
      .region(region)
      .version(KubernetesVersion.V1_24)
      .teams(team)
      .resourceProvider("garden-dev-cluster-role", new IamRoleResourceProvider())
      .resourceProvider(
        GlobalResources.HostedZone,
        new ImportHostedZoneProvider(cdk.Fn.ref(PARAMETER_HOSTEDZONEID), cdk.Fn.ref(PARAMETER_SUBDOMAIN))
      )
      .resourceProvider(
        GlobalResources.Certificate,
        new blueprints.CreateCertificateProvider(
          "wildcard-cert",
          cdk.Fn.join(".", ["*", cdk.Fn.ref(PARAMETER_SUBDOMAIN)]),
          GlobalResources.HostedZone
        )
      )
      .addOns(
        new blueprints.VpcCniAddOn(),
        new blueprints.CoreDnsAddOn(),
        new blueprints.CertManagerAddOn(),
        new blueprints.AwsLoadBalancerControllerAddOn(),
        new blueprints.ExternalDnsAddOn({
          hostedZoneResources: [blueprints.GlobalResources.HostedZone],
        }),
        new blueprints.NginxAddOn({
          version: "0.15.2",
          internetFacing: true,
          backendProtocol: "tcp",
          externalDnsHostname: cdk.Fn.ref(PARAMETER_SUBDOMAIN),
          crossZoneEnabled: false,
          certificateResourceName: GlobalResources.Certificate,
        }),
        new blueprints.SecretsStoreAddOn({ rotationPollInterval: "120s" }),
        new blueprints.ClusterAutoScalerAddOn(),
        new DeployImagePullSecret({ accountId, region }),
        new blueprints.NestedStackAddOn({
          builder: ECRRepository.builder(),
          id: "ecr-nested-stack"
        })
      )
      .buildAsync(scope, id);

      // add parameters
      // TODO: is there a better approach to add parameters to the EKS blueprint CFN stack?

    new cdk.CfnParameter(cluster, PARAMETER_SUBDOMAIN, {
      type: "String",
      description: `
        The subdomain that can be used for ingress to the development environments, e.g. garden.mycompany.com
        Needs to be a hosted domain in Route53RecordTarget.
      `
    });

    // unfortunately we can't use this lookup for env agnostic stacks (need to specify region)
    // https://docs.aws.amazon.com/cdk/v2/guide/resources.html#resources_external
    // const domainID = route53.HostedZone.fromLookup(this, id, {domainName: subdomainName})
    new cdk.CfnParameter(cluster, PARAMETER_HOSTEDZONEID, {
      type: "AWS::Route53::HostedZone::Id",
      description: `
        The ID of the Route53 hosted zone with the domain that can be used for ingress
        to the development environments
      `
    });

    

    blueprints.HelmAddOn.validateHelmVersions = false;
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
