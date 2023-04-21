import * as path from 'path';
import { CustomResource, Stack } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as cr from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import { PROP_REPOSITORIES, PROP_PREFIX } from '../functions/ecr-repositories';

interface ECRRepositoriesProps {
  /**
   * List of ECR repository names.
   *
   * Each name will be prefixed, e.g. testservice will become garden-dev/testservice if prefix is garden-dev.
   */
  readonly names: string[];

  /**
   * Prefix for ECR repository names (e.g. garden-dev)
   */
  readonly prefix: string;
}

export class ECRRepositories extends Construct {
  constructor(scope: Construct, id: string, props: ECRRepositoriesProps) {
    super(scope, id);

    new CustomResource(this, 'Resource', {
      serviceToken: ECRRepositoriesProvider.getOrCreate(this),
      resourceType: 'Custom::ECRRepositories',
      properties: {
        [PROP_REPOSITORIES]: props.names,
        [PROP_PREFIX]: props.prefix,
      },
    });
  }
}

class ECRRepositoriesProvider extends Construct {

  /**
   * Returns the singleton provider.
   */
  public static getOrCreate(scope: Construct) {
    const stack = Stack.of(scope);
    const id = 'garden.custom-ecr-repositories-provider';
    const x = stack.node.tryFindChild(id) as ECRRepositoriesProvider || new ECRRepositoriesProvider(stack, id);
    return x.provider.serviceToken;
  }

  private readonly provider: cr.Provider;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.provider = new cr.Provider(this, 'ecr-repositories-provider', {
      onEventHandler: new lambdaNodejs.NodejsFunction(this, 'ecr-repositories-on-event', {
        runtime: lambda.Runtime.NODEJS_18_X ,
        entry: path.join(__dirname, '..', 'functions', 'ecr-repositories.ts'),
        initialPolicy: [
          new iam.PolicyStatement({
            resources: ['*'],
            actions: [
              'ecr:CreateRepository',
              'ecr:DeleteRepository',
              'kms:RetireGrant', // for delete
              'ecr:SetRepositoryPolicy',
              'ecr:PutLifecyclePolicy',
            ],
          }),
        ],
      }),
    });
  }
}
