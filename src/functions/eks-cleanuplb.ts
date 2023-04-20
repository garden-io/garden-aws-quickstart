import AWS from 'aws-sdk';
import * as AWSCDKAsyncCustomResource from 'aws-cdk-lib/custom-resources/lib/provider-framework/types';

export const PROP_VPC_ID = "vpcID"

const elb = new AWS.ELB()

export async function handler(event: AWSCDKAsyncCustomResource.OnEventRequest): Promise<AWSCDKAsyncCustomResource.OnEventResponse> {
  const vpcID: string = event.ResourceProperties[PROP_VPC_ID]

    switch (event.RequestType) {
      case 'Create':
        return {}

      case 'Update':
        return {}

      case 'Delete':
        const lbs = await elb.describeLoadBalancers().promise()

        const matchingLBs = lbs.LoadBalancerDescriptions
          ?.filter((i) => i.VPCId === vpcID)
          // look for clues that we actually created this LB
          .filter((i) => i.LoadBalancerName?.includes("k8s") && i.LoadBalancerName?.includes("kubesys") && i.LoadBalancerName?.includes("blueprin"))


        if (!matchingLBs) {
          return {}
        }

        for (const i of matchingLBs) {
          if (i.LoadBalancerName) {
            await elb.deleteLoadBalancer({
              LoadBalancerName: i.LoadBalancerName
            }).promise()
          }
        }

        return {}
    }
  }
