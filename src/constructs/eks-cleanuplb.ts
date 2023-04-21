import * as path from 'path';
import { CustomResource, Stack } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as cr from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import { PROP_VPC_ID } from '../functions/eks-cleanuplb';

interface EKSCleanupLBProps {
  vpcId: string
}

export class EKSCleanupLB extends Construct {
  constructor(scope: Construct, id: string, props: EKSCleanupLBProps) {
    super(scope, id)

    new CustomResource(scope, 'CustomResource', {
      serviceToken: EKSCleanupLBProvider.getOrCreate(scope),
      resourceType: 'Custom::EKSCleanupLB',
      properties: {
        [PROP_VPC_ID]: props.vpcId,
      },
    });
  }
}

class EKSCleanupLBProvider extends Construct {

  /**
   * Returns the singleton provider.
   */
  public static getOrCreate(scope: Construct) {
    const stack = Stack.of(scope);
    const id = 'garden.custom-eks-cleanup-lb-provider';
    const x = stack.node.tryFindChild(id) as EKSCleanupLBProvider || new EKSCleanupLBProvider(stack, id);
    return x.provider.serviceToken;
  }

  private readonly provider: cr.Provider;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.provider = new cr.Provider(this, 'eks-cleanup-lb-provider', {
      onEventHandler: new lambdaNodejs.NodejsFunction(this, 'eks-cleanup-lb-provider-on-event', {
        runtime: lambda.Runtime.NODEJS_18_X ,
        entry: path.join(__dirname, '..', 'functions', 'eks-cleanuplb.ts'),
        initialPolicy: [
          new iam.PolicyStatement({
            resources: ['*'],
            actions: [
              'elasticloadbalancing:DescribeLoadBalancers',
              'elasticloadbalancing:DeleteLoadBalancer',
              'elasticloadbalancing:DeleteLoadBalancerListeners',
              'elasticloadbalancing:DeleteLoadBalancerPolicy',
            ],
          }),
        ],
      }),
    });
  }
}
