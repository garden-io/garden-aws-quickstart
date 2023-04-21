import * as cdk from "aws-cdk-lib";
import { GardenEKSDevCluster } from "./stacks/garden-dev-cluster";
import { logger } from "@aws-quickstart/eks-blueprints/dist/utils";

const app = new cdk.App();

new GardenEKSDevCluster().build(app, {
  synthesizer: getSynthesizer("dev-cluster"),
}).catch((e) => {
  logger.error(e)
})

function getSynthesizer(stackName: string): cdk.CliCredentialsStackSynthesizer | undefined {
  const releaseVersion = process.env["CDK_RELEASE_VERSION"]
  if (releaseVersion) {
    return new cdk.CliCredentialsStackSynthesizer({
      // see also boostrap/README.md for more information about the nature of these S3 buckets
      fileAssetsBucketName: 'garden-cfn-public-${AWS::Region}',
      bucketPrefix: `${stackName}/${releaseVersion}/`,
    })
  }

  return undefined
}
