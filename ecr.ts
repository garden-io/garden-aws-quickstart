import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as s3 from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints';


// export class ECRRepository implements blueprints.ResourceProvider<ecr.IRepository> {
//     provide(context: blueprints.ResourceContext): ecr.IRepository {
//         return new ecr.Repository(context.scope, "vote-test");
//     }
export class ECRRepository extends cdk.NestedStack {
    // public readonly ecrRepos: ecr.Repository[]
    repoNames: string[]
    constructor(repoNames: string[], scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        this.repoNames = repoNames
        // this.ecrRepos = []
        // for (var repo of repoNames) {
        //   this.ecrRepos.push(new ecr.Repository(this, repo, {
        //       repositoryName: repo,
        //       encryption: ecr.RepositoryEncryption.KMS,
        //       imageScanOnPush: true,
        //   }));
        //   this.ecrRepos.push(new ecr.Repository(this, `${repo}/cache`, {
        //       repositoryName: `${repo}/cache`,
        //       encryption: ecr.RepositoryEncryption.KMS,
        //       imageScanOnPush: true,
        //   }));
        // }
        for (const repo of repoNames) {
           new ecr.Repository(this, repo, {
                repositoryName: repo,
                encryption: ecr.RepositoryEncryption.KMS,
                imageScanOnPush: true,
            });
            new ecr.Repository(this, `${repo}/cache`, {
                repositoryName: `${repo}/cache`,
                encryption: ecr.RepositoryEncryption.KMS,
                imageScanOnPush: true,
            });
          }
    }
}