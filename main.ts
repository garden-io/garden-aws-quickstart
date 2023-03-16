import * as cdk from 'aws-cdk-lib';
import { logger } from '@aws-quickstart/eks-blueprints/dist/utils';
import { HelmAddOn } from '@aws-quickstart/eks-blueprints';

const app = new cdk.App();
const account = "049586690729";
const region = "eu-central-1";
const env: cdk.Environment = { account: account, region: region };
HelmAddOn.validateHelmVersions = false;

import DevCluster from './cluster';
new DevCluster().buildAsync(app, 'dev-cluster').catch(() => {
    logger.info("Error setting up dev cluster");
});