import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';

export class ECRRegistry extends cdk.Stack {
    public readonly ecrRepo: ecr.Repository
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        
        this.ecrRepo = new ecr.Repository(this, 'backend', {
            encryption: ecr.RepositoryEncryption.KMS,
            imageScanOnPush: true,
        });
    }
}
