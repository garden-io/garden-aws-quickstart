import * as cdk from "aws-cdk-lib";
import * as ecr from "aws-cdk-lib/aws-ecr";
import { Construct } from "constructs";
import * as blueprints from "@aws-quickstart/eks-blueprints";

export class ECRRepository extends cdk.NestedStack {
  readonly ecrRepo: ecr.Repository;
  public static builder(): blueprints.NestedStackBuilder {
    return {
      build(scope: Construct, id: string, props: cdk.NestedStackProps) {
        return new ECRRepository(scope, id, props);
      },
    };
  }
  constructor(scope: Construct, id: string, props: cdk.NestedStackProps) {
    super(scope, id, props);
    this.ecrRepo = new ecr.Repository(this, "test-repo", {
      repositoryName: "test-repo",
    });
  }
}
