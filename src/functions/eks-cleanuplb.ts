import AWS from 'aws-sdk';
import * as AWSCDKAsyncCustomResource from 'aws-cdk-lib/custom-resources/lib/provider-framework/types';

export const PROP_VPC_ID = "vpcID"

const elb = new AWS.ELBv2()

export async function handler(event: AWSCDKAsyncCustomResource.OnEventRequest): Promise<AWSCDKAsyncCustomResource.OnEventResponse> {
  console.info(`EVENT: ${JSON.stringify(event)}`)
  const vpcID: string = event.ResourceProperties[PROP_VPC_ID]

    switch (event.RequestType) {
      case 'Create':
        return {}

      case 'Update':
        return {}

      case 'Delete':
        const lbs = await elb.describeLoadBalancers().promise()

        console.info(`Found ${lbs.LoadBalancers?.length} LBs`)

        const inVPC = lbs.LoadBalancers
        ?.filter((i) => i.VpcId === vpcID)
        .map((i) => i.LoadBalancerArn)

        console.info(`In VPC: ${JSON.stringify(inVPC)}`)

        if (!inVPC) {
          return {}
        }

        for (const arn of inVPC) {
          if (arn) {
            console.info(`Deleting LB ${arn}`)
            await elb.deleteLoadBalancer({
              LoadBalancerArn: arn
            }).promise()
            console.info(`Successfully deleted LB ${arn}`)
          }
        }

        return {}
    }
  }
