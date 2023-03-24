import * as cdk from "aws-cdk-lib";
import * as ecr from "aws-cdk-lib/aws-ecr";
import { Construct } from "constructs";
import * as blueprints from "@aws-quickstart/eks-blueprints";

interface ecrNestedStackProps extends cdk.NestedStackProps {
    readonly ecrRepoNames: string;
}
export class ECRRepository extends cdk.NestedStack {
  readonly ecrRepos: ecr.Repository[];
  public static builder(): blueprints.NestedStackBuilder {
    return {
      build(scope: Construct, id: string, props: ecrNestedStackProps) {
        return new ECRRepository(scope, id, props);
      },
    };
  }
  constructor(scope: Construct, id: string, props: ecrNestedStackProps) {
    super(scope, id, props);
    this.ecrRepos = []
    for (var repo of props.ecrRepoNames.split(/\s*,\s*/)) {
      this.ecrRepos.push(new ecr.Repository(this, repo, {
          repositoryName: repo,
          encryption: ecr.RepositoryEncryption.KMS,
          imageScanOnPush: true,
      }));
      this.ecrRepos.push(new ecr.Repository(this, `${repo}/cache`, {
          repositoryName: `${repo}/cache`,
          encryption: ecr.RepositoryEncryption.KMS,
          imageScanOnPush: true,
      }));
    }
  }
}
