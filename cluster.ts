import * as blueprints from "@aws-quickstart/eks-blueprints";
import {
  GlobalResources,
  ImportHostedZoneProvider,
} from "@aws-quickstart/eks-blueprints";
import { Construct } from "constructs";
import { TeamPlatform } from "./teams";
import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import { ECRRepository } from "./ecr";
import { KubernetesVersion } from "aws-cdk-lib/aws-eks";
import { DeployImagePullSecret } from "./pullsecret";
import { ArnPrincipal } from "aws-cdk-lib/aws-iam";
import { StackProps } from "aws-cdk-lib";

const accountID = process.env.CDK_DEFAULT_ACCOUNT!;
const gitUrl = "https://github.com/aws-samples/eks-blueprints-workloads.git";

/**
 * See docs/patterns/nginx.md for mode details on the setup.
 */
export default class DevCluster extends cdk.Stack {
  async eksCluster(scope: Construct, id: string, props: StackProps) {
    const accountId = cdk.Stack.of(this).account
    const region = cdk.Stack.of(this).region


    const subdomainName = new cdk.CfnParameter(this, "subdomain", {
      type: "String",
      description: "The subdomain that can be used for ingress to the development environments\
       e.g. garden.mycompany.com. \
       Needs to be a hosted domain in Route53RecordTarget."}).valueAsString;

    //unfortunately we can't use this lookup for env agnostic stacks (need to specify region)
    // https://docs.aws.amazon.com/cdk/v2/guide/resources.html#resources_external
    // const domainID = route53.HostedZone.fromLookup(this, id, {domainName: subdomainName})

    const hostedZoneId = new cdk.CfnParameter(this, "hostedZoneId", {
      type: "AWS::Route53::HostedZone::Id",
      description: "The ID of the Route53 hosted zone with the domain that can be used for ingress\
       to the development environments"}).valueAsString;

    const iamUsers = new cdk.CfnParameter(this, "iamUsers", {
      type: "CommaDelimitedList",
      default: "",
      description: "Comma delimited list of IAM users principal ARNs that should get access to the dev cluster\
       e.g. \"arn:aws:iam::123456789012:user/JohnDoe,arn:aws:iam::123456789012:user/Alice\""}).valueAsList;

    const iamRole = new cdk.CfnParameter(this, "iamRole", {
      type: "String",
      default: "arn:aws:sts::049586690729:assumed-role/AWSReservedSSO_AdministratorAccess_b3c1cae6dc09120a",
      description: "A role that should get access to the dev cluster e.g.\
       \"arn:aws:iam::123456789023:role/AWSReservedSSO_PlatformEngineers_4ed12acae0543\""}).valueAsString;

    // use context variables for now because we cannot use CfnParameters
    // for these values since we are manipulating the values in the code
    const iamUsersArnsCtx = this.node.tryGetContext('iamUsers').split(",").map((item: string) => new ArnPrincipal(item))
    const iamRoleArnCtx = this.node.tryGetContext('iamRole')
    const subdomainNameCtx = this.node.tryGetContext('subdomainName')
    const hostedZoneIdCtx = this.node.tryGetContext('hostedZoneId')
    const teams: Array<blueprints.Team> = [new TeamPlatform({userRoleArn: iamRoleArnCtx, users: iamUsersArnsCtx})];

    blueprints.HelmAddOn.validateHelmVersions = false;
    const cluster = await blueprints.EksBlueprint.builder()
      .account(accountId)
      .region(region)
      .version(KubernetesVersion.V1_24)
      .teams(...teams)
      .resourceProvider(
        GlobalResources.HostedZone,
        new ImportHostedZoneProvider(hostedZoneIdCtx, subdomainNameCtx)
      )
      .resourceProvider(
        GlobalResources.Certificate,
        new blueprints.CreateCertificateProvider(
          "wildcard-cert",
          `*${subdomainNameCtx}`,
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
          externalDnsHostname: subdomainNameCtx,
          crossZoneEnabled: false,
          certificateResourceName: GlobalResources.Certificate,
        }),
        new blueprints.SecretsStoreAddOn({ rotationPollInterval: "120s" }),
        new blueprints.ClusterAutoScalerAddOn(),
        new DeployImagePullSecret({accountId: accountId, region: region}),
        new blueprints.NestedStackAddOn({
          builder: ECRRepository.builder(),
          id: "ecr-nested-stack"
        })
      )
      .buildAsync(scope, `${id}`);

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
