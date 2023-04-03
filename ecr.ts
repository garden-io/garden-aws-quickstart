import * as cdk from "aws-cdk-lib";
import * as ecr from "aws-cdk-lib/aws-ecr";
import { Construct } from "constructs";
import * as blueprints from "@aws-quickstart/eks-blueprints";

export class ECRRepository extends cdk.NestedStack {
  readonly ecrRepos: ecr.Repository[];
  readonly ecrRepoNames: string[];
  public static builder(): blueprints.NestedStackBuilder {
    return {
      build(scope: Construct, id: string, props: cdk.NestedStackProps) {
        return new ECRRepository(scope, id, props);
      },
    };
  }
  constructor(scope: Construct, id: string, props: cdk.NestedStackProps) {
    super(scope, id, props);
    this.ecrRepos = []
    this.ecrRepoNames = ["api", "vote", "worker", "result"]
    for (var repo of this.ecrRepoNames) {
      this.ecrRepos.push(new ecr.Repository(this, repo, {
          repositoryName: `garden-demo/${repo}`,
          encryption: ecr.RepositoryEncryption.KMS,
          imageScanOnPush: true,
      }));
      this.ecrRepos.push(new ecr.Repository(this, `${repo}/cache`, {
          repositoryName: `garden-demo/${repo}/cache`,
          encryption: ecr.RepositoryEncryption.KMS,
          imageScanOnPush: true,
      }));
    }
  }
}