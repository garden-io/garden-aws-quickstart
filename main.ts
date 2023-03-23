import * as cdk from 'aws-cdk-lib';
import { logger } from '@aws-quickstart/eks-blueprints/dist/utils';
import { HelmAddOn } from '@aws-quickstart/eks-blueprints';
import { Construct } from 'constructs';
import DevCluster from './cluster';

const app = new cdk.App();
const account = "049586690729";
const region = "eu-central-1";
const env: cdk.Environment = { account: account, region: region };
HelmAddOn.validateHelmVersions = false;


// class GardenK8s extends cdk.Stack {
//     constructor(scope: Construct, id: string, props?: cdk.StackProps) {
//         super(scope, id, props);
//         new DevCluster().buildAsync(scope, `${id}-eks`).catch(() => {
//           logger.info("Error setting up dev cluster");
//         });

//         new ECRRegistry(scope, `${id}-ecr`);
//     }
// }

// new GardenK8s(app, "dev-cluster");

new DevCluster().buildAsync(app, `garden-dev-cluster`).catch(() => {
  logger.info("Error setting up dev cluster");
});
