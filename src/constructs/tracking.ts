import * as path from 'path';
import { CustomResource, Stack } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as cr from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import * as cdk from "aws-cdk-lib";
import { PROP_ACCOUNT, PROP_SEGMENT_KEY, PROP_CF_STACK_ARN, PROP_VERSION, PROP_FULL_ACCESS_ROLE, PROP_FULL_ACCESS_PRINCIPALS, PROP_CLUSTER_NAME, PROP_ECR_PREFIX, PROP_ECR_REPO_NAMES, PROP_HOSTEDZONE_ID, PROP_MAX_NODEGROUP_SIZE, PROP_MIN_NODEGROUP_SIZE, PROP_SUBDOMAIN} from '../functions/tracking';
import { GardenEKSDevCluster} from '../stacks/garden-dev-cluster';


export const cdkEnvironment: string = process.env.CDK_ENVIRONMENT || 'dev';
interface TrackUsageProps {
    stackVersion: string;
    account: string;
    parameters: typeof GardenEKSDevCluster.parameters;
}

export class TrackUsage extends Construct {
  constructor(scope: Construct, id: string, props: TrackUsageProps) {
    super(scope, id);

    new CustomResource(this, 'Resource', {
      serviceToken: TrackUsageProvider.getOrCreate(this),
      resourceType: 'Custom::TrackUsage',
      properties: {
        [PROP_SEGMENT_KEY]: this.node.tryGetContext(cdkEnvironment).SegmentAPIWriteKey,
        [PROP_VERSION]: props.stackVersion,
        [PROP_ACCOUNT]: props.account,
        [PROP_CF_STACK_ARN]: cdk.Stack.of(scope).stackId,
        [PROP_FULL_ACCESS_ROLE]: props.parameters.fullAccessRole,
        [PROP_FULL_ACCESS_PRINCIPALS]: props.parameters.fullAccessPrincipals,
        [PROP_ECR_REPO_NAMES]: props.parameters.ecrRepoNames,
        [PROP_ECR_PREFIX]: props.parameters.ecrPrefix,
        [PROP_SUBDOMAIN]: props.parameters.subdomain,
        [PROP_HOSTEDZONE_ID]: props.parameters.hostedZoneID,
        [PROP_CLUSTER_NAME]: props.parameters.clusterName,
        [PROP_MIN_NODEGROUP_SIZE]: props.parameters.minNodeGroupSize,
        [PROP_MAX_NODEGROUP_SIZE]: props.parameters.maxNodeGroupSize
      },
    });
  }
}

class TrackUsageProvider extends Construct {

  /**
   * Returns the singleton provider.
   */
  public static getOrCreate(scope: Construct) {
    const stack = Stack.of(scope);
    const id = 'garden.custom-track-usage-provider';
    const x = stack.node.tryFindChild(id) as TrackUsageProvider || new TrackUsageProvider(stack, id);
    return x.provider.serviceToken;
  }

  private readonly provider: cr.Provider;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.provider = new cr.Provider(this, 'track-usage-provider', {
      onEventHandler: new lambdaNodejs.NodejsFunction(this, 'tracking-on-event', {
        runtime: lambda.Runtime.NODEJS_18_X ,
        entry: path.join(__dirname, '..', 'functions', 'tracking.ts'),
      }),
    });
  }
}
