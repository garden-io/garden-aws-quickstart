import * as cdk from "aws-cdk-lib";
import { logger } from "@aws-quickstart/eks-blueprints/dist/utils";
import { HelmAddOn } from "@aws-quickstart/eks-blueprints";
import DevCluster from "./cluster";

const app = new cdk.App();
HelmAddOn.validateHelmVersions = false;

new DevCluster().eksCluster(app, `dev-cluster`, {crossRegionReferences: true}).catch(() => {
  logger.info("Error setting up dev cluster");
});
