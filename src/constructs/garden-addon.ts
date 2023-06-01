import { ClusterAddOn, ClusterInfo } from "@aws-quickstart/eks-blueprints";
import * as iam from "aws-cdk-lib/aws-iam";
import * as cdk from "aws-cdk-lib";
import { ECRRepositories } from "./ecr-repositories";
import { EKSCleanupLB } from "./eks-cleanuplb";
import { TrackUsage } from "./tracking";
import { GardenEKSDevCluster } from "../stacks/garden-dev-cluster";
var pjson = require("pjson");

export interface GardenAddOnProps {
  readonly accountId: string
  readonly region: string
  readonly parameters: typeof GardenEKSDevCluster.parameters
}

export class GardenAddOn implements ClusterAddOn {
  static readonly ShouldCreateIAMRoleCondition = "GardenShouldCreateIAMRoleCondition"
  static readonly FullAccessPrincipalsAccessRole = "GardenFullAccessPrincipalsAccessRole"

  readonly props: GardenAddOnProps;

  get mastersRoleARN(): string {
    return cdk.Fn.conditionIf(
      GardenAddOn.ShouldCreateIAMRoleCondition,
      // if we created an IAM role
      cdk.Fn.getAtt(GardenAddOn.FullAccessPrincipalsAccessRole, "Arn"),
      // else (customer passed the IAM role param, validated above)
      this.props.parameters.fullAccessRole
    ).toString()
  }

  constructor(props: GardenAddOnProps){
      this.props = props
  }

  deploy(clusterInfo: ClusterInfo): void {
    // ensures that in-cluster builder can push images to any ECR registries in the same account,
    // as well as that Kubernetes Nodes can pull images from ECR
    this.deployImagePullSecret(clusterInfo)
    this.addRegistryAccessPolicy(clusterInfo)

    // create ECR repositories
    this.createECRRepositories(clusterInfo)

    // manage full access IAM role (if needed)
    this.createFullAccessIAMRoleIfNeeded(clusterInfo)

    // fix cluster deletion
    this.addCleanupLBHack(clusterInfo)

    //track usage
    this.trackUsage(clusterInfo)
  }

  private addCleanupLBHack(clusterInfo: ClusterInfo) {
    new EKSCleanupLB(clusterInfo.cluster, "GardenEKSCleanupLB", {
      vpcId: clusterInfo.cluster.vpc.vpcId,
    })
  }

  private createECRRepositories(clusterInfo: ClusterInfo) {
    const cluster = clusterInfo.cluster
    const parameters = this.props.parameters

    // add custom ECR repositories
    new ECRRepositories(cluster, "GardenCustomECRRepositories", {
      names: parameters.ecrRepoNames,
      prefix: parameters.ecrPrefix
    })
  }

  private trackUsage(clusterInfo: ClusterInfo) {
    const cluster = clusterInfo.cluster
    new TrackUsage(cluster, "TrackUsage", {
      account: this.props.accountId,
      stackVersion: pjson.version,
      parameters: this.props.parameters
    })
  }

  private createFullAccessIAMRoleIfNeeded(clusterInfo: ClusterInfo) {
    const cluster = clusterInfo.cluster
    const parameters = this.props.parameters

    const shouldCreateIAMRole = new cdk.CfnCondition(
      cdk.Stack.of(cluster),
      GardenAddOn.ShouldCreateIAMRoleCondition,
      {
        expression: cdk.Fn.conditionEquals(parameters.fullAccessRole, "")
      }
    )

    const principalsAccessRole = new iam.CfnRole(cdk.Stack.of(cluster), GardenAddOn.FullAccessPrincipalsAccessRole, {
      roleName: `${GardenAddOn.FullAccessPrincipalsAccessRole}-${parameters.clusterName}`,
      description: "Role that has access to the garden dev EKS cluster. It is added to the aws-auth config map",
      maxSessionDuration: 28800, // 8 hours
      assumeRolePolicyDocument:
        {
          "Version": "2012-10-17",
          "Statement": {
            "Effect": "Allow",
            "Principal": {
                "AWS": parameters.fullAccessPrincipals
            },
            "Action": "sts:AssumeRole"
          }
      },
    })
    principalsAccessRole.cfnOptions.condition = shouldCreateIAMRole
  }

  private addRegistryAccessPolicy(clusterInfo: ClusterInfo): void {
    // This allows the nodes to push to AWS registry
    // TODO: Use IRSA once Garden in-cluster-builder supports it
    // TODO: At least limit it to the repostories that belong to this stack
    clusterInfo.nodeGroups!.at(0)!.role!.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEC2ContainerRegistryPowerUser")
    )
  }

  deployImagePullSecret(clusterInfo: ClusterInfo): void {
    const cluster = clusterInfo.cluster;
    const ecrURL = `${this.props.accountId}.dkr.ecr.${this.props.region}.amazonaws.com`
    let secretValue = {
        credHelpers: {
              [ecrURL]: "ecr-login"
        }
    }
    cluster.addManifest("ECRSecret", {
        "apiVersion": "v1",
        "kind": "Secret",
        "type": "kubernetes.io/dockerconfigjson",
        "metadata": {"name": "regcred", "namespace": "default"},
        "stringData": {".dockerconfigjson": JSON.stringify(secretValue)}
    })
  }
}
