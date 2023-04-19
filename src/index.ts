import * as cdk from "aws-cdk-lib";
import { logger } from "@aws-quickstart/eks-blueprints/dist/utils";
import { EKSBlueprintStackBuilder } from "./stacks/eks-blueprint";
import { GardenDevClusterStack } from "./stacks/garden-dev-cluster";

const releaseVersion = process.env["CDK_RELEASE_VERSION"]

const app = new cdk.App();

// EKS blueprint

new EKSBlueprintStackBuilder().build(app, `eks-blueprint`, {
  synthesizer: getSynthesizer("eks-blueprint")
}).catch((e) => {
  logger.error(e)
});

// Garden Dev cluster

new GardenDevClusterStack(app, `garden-dev-cluster`, {
  synthesizer: getSynthesizer("dev-cluster"),
  blueprintStackVersion: releaseVersion || "0.0.0-DEVELOPMENT"
})

function getSynthesizer(stackName: string): cdk.CliCredentialsStackSynthesizer | undefined {
  if (releaseVersion) {
    return new cdk.CliCredentialsStackSynthesizer({
      // see also boostrap/README.md for more information about the nature of these S3 buckets
      fileAssetsBucketName: 'garden-cfn-public-${AWS::Region}',
      bucketPrefix: `${stackName}/${releaseVersion}/`,
    })
  }

  return undefined
}
