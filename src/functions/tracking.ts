import * as AWSCDKAsyncCustomResource from 'aws-cdk-lib/custom-resources/lib/provider-framework/types';
import Analytics from "@segment/analytics-node";
import hasha = require("hasha");

export const PROP_SEGMENT_KEY = "segmentApiKey"
export const PROP_VERSION = "gardenDevClusterVersion"
export const PROP_ACCOUNT = "awsAccount"
export const PROP_CF_STACK_ARN = "cloudformationStackArn"
export const PROP_FULL_ACCESS_ROLE = "iamFullAccessRole"
export const PROP_FULL_ACCESS_PRINCIPALS = "iamFullAccessPrincipals"
export const PROP_ECR_REPO_NAMES = "ecrRepoNames"
export const PROP_ECR_PREFIX = "ecrPrefix"
export const PROP_SUBDOMAIN = "subdomain"
export const PROP_HOSTEDZONE_ID = "hostedzoneID"
export const PROP_CLUSTER_NAME = "clusterName"
export const PROP_MIN_NODEGROUP_SIZE = "minNodegroupSize"
export const PROP_MAX_NODEGROUP_SIZE = "maxNodegroupSize"

export async function handler(event: AWSCDKAsyncCustomResource.OnEventRequest): Promise<AWSCDKAsyncCustomResource.OnEventResponse> {
    const version: string = event.ResourceProperties[PROP_VERSION]
    const accountHash: string = hasha(event.ResourceProperties[PROP_ACCOUNT],{algorithm: "sha512"})
    const cfnStackArnHash: string = hasha(event.ResourceProperties[PROP_CF_STACK_ARN], {algorithm: 'sha512'}).slice(0,64)
    const analytics = new Analytics({writeKey: event.ResourceProperties[PROP_SEGMENT_KEY]})
    switch (event.RequestType) {
      case 'Create':
        analytics.track({
            anonymousId: cfnStackArnHash,
            event: "Installed dev-cluster",
            properties: {
                version: version,
                accountHash: accountHash,
                platform: "AWS"
            },
        })
        await analytics.closeAndFlush()
        return {}

      case 'Update':
        analytics.track({
            anonymousId: cfnStackArnHash,
            event: "Updated dev-cluster",
            properties: {
                version: version,
                accountHash: accountHash,
                platform: "AWS"
            },
        })
        await analytics.closeAndFlush()
        return {}

      case 'Delete':
        analytics.track({
            anonymousId: cfnStackArnHash,
            event: "Deleted dev-cluster",
            properties: {
                version: version,
                accountHash: accountHash,
                platform: "AWS"
            },
        })
        await analytics.closeAndFlush()
        return {}
    }
  }