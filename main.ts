import * as cdk from "aws-cdk-lib";
import { logger } from "@aws-quickstart/eks-blueprints/dist/utils";
import { HelmAddOn } from "@aws-quickstart/eks-blueprints";
import DevCluster from "./cluster";

const app = new cdk.App({
  defaultStackSynthesizer: new cdk.CliCredentialsStackSynthesizer({
    fileAssetsBucketName: 'cdk-hnb659fds-assets-049586690729-${AWS::Region}',
    bucketPrefix: `steffen-dev-02/`,
  }),
});
HelmAddOn.validateHelmVersions = false;

new DevCluster().eksCluster(app, `steffen-dev-02-dev-cluster`).catch(() => {
  logger.info("Error setting up dev cluster");
});
