import * as cdk from "aws-cdk-lib";
import { logger } from "@aws-quickstart/eks-blueprints/dist/utils";
import { HelmAddOn } from "@aws-quickstart/eks-blueprints";
import { DevClusterConstruct } from "./cluster";

const releaseVersion = process.env["CDK_RELEASE_VERSION"]

let defaultStackSynthesizer: cdk.IReusableStackSynthesizer | undefined

// if this is being synthesized during the release process, we want to use our public S3 buckets.
// otherwise (by default) you can just use the CDK deploy command to test the stack, e.g. for testing
if (releaseVersion) {
  defaultStackSynthesizer = new cdk.CliCredentialsStackSynthesizer({
    // see also boostrap/README.md for more information about the nature of these S3 buckets
    fileAssetsBucketName: 'garden-cfn-public-${AWS::Region}',
    bucketPrefix: `dev-cluster/${releaseVersion}`,
  })
}

const app = new cdk.App({ defaultStackSynthesizer });

HelmAddOn.validateHelmVersions = false;

// main stack based on AWS EKS blueprints
new DevClusterConstruct().eksCluster(app, `garden-dev-cluster`).catch(() => {
  logger.info("Error setting up dev cluster");
});
