import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cdk from "aws-cdk-lib";
import { ECRRepositories } from '../constructs/ecr-repositories';
import { EKSBlueprintConstruct } from '../constructs/eks-blueprint';
import * as iam from "aws-cdk-lib/aws-iam";

export interface DevClusterStackProps extends StackProps {
  blueprintStackVersion: string
}

export class GardenDevClusterStack extends Stack {
  constructor(scope: Construct, id: string, props: DevClusterStackProps) {
    super(scope, id, props);

    const roleParam = new cdk.CfnParameter(this, "IAMRole", {
        type: "String",
        default: "",
        description: `
          Optional.

          The ARN of the IAM role that gets access to the EKS cluster.

          Everyone that can assume this role will have full access to the EKS cluster created
          in this stack. You are responsible for managing the trust policy of this role and allow users
          to assume it.

          Mutually exclusive with iamusers parameter. You must either supply an iamrole parameter, or iamusers, but not both.
        `
      }).valueAsString

    const principalsParam = new cdk.CfnParameter(this, "IAMPrincipals", {
        type: "List<String>",
        default: "",
        description: `
          Optional.

          List of ARN principals, like IAM users or roles, that should be allowed to assume the role to get access to the EKS cluster.

          Mutually exclusive with iamrole parameter. You must either supply an iamrole parameter, or iamusers, but not both.
        `
      }).valueAsList

      const repoNames = new cdk.CfnParameter(this, "ECRRepositories", {
        type: "List<String>",
        default: "api,result,vote,worker",
        description: `
          Optional.

          The default value enables you to launch the quickstart example (https://github.com/garden-io/quickstart-example) on your Garden Development cluster.

          ECR repositories to create.
        `
      }).valueAsList

      const repoPrefix = new cdk.CfnParameter(this, "ECRPrefix", {
        type: "String",
        default: "garden-dev",
        description: `
          Prefix of ECR repositories.
        `
      }).valueAsString

      // new cdk.CfnRule(this, "IAMUsersAndRoleValidation", {
      //   assertions: [
      //     {
      //       // (principalsParam === "") && (roleParam === "")
      //       assert: cdk.Fn.conditionAnd(
      //         cdk.Fn.conditionEquals(roleParam, ""),
      //         cdk.Fn.conditionEquals(cdk.Fn.join("", principalsParam), ""),
      //       ),
      //       assertDescription: "You must supply either an IAM role, or a list of IAM users",
      //     },
      //     {
      //       // (principalsParam !== "") && (roleParam !== "")
      //       assert: cdk.Fn.conditionAnd(
      //         cdk.Fn.conditionNot(cdk.Fn.conditionEquals(roleParam, "")),
      //         cdk.Fn.conditionNot(cdk.Fn.conditionEquals(cdk.Fn.join("", principalsParam), "")),
      //       ),
      //       assertDescription: "Only one of IAM role or IAM users may be specified.",
      //     }
      //   ],
      // })

      new ECRRepositories(this, "CustomECRRepositories", {
        names: repoNames,
        prefix: repoPrefix
      })

      const shouldCreateIAMRole = new cdk.CfnCondition(
        this,
        'ShouldCreateIAMRoleCondition',
        {
          // a condition needs an expression
          expression: cdk.Fn.conditionEquals(roleParam, "")
        }
      )

      const principalsAccessRole = new iam.CfnRole(this, "PrincipalsAccessRole", {
        roleName: "garden-dev-eks",
        description: "Role that has access to the garden dev EKS cluster. It is added to the aws-auth config map",
        maxSessionDuration: 28800, // 8 hours
        assumeRolePolicyDocument:
          {
            "Version": "2012-10-17",
            "Statement": {
              "Effect": "Allow",
              "Principal": {
                  "AWS": principalsParam
              },
              "Action": "sts:AssumeRole"
            }
        },
      })
      principalsAccessRole.cfnOptions.condition = shouldCreateIAMRole

      new EKSBlueprintConstruct(this, 'BlueprintsTemplate', {
          blueprintStackVersion: props.blueprintStackVersion,
          parameters: {
            IngressSubdomain: new cdk.CfnParameter(this, "IngressSubdomain", {
              type: "String",
              description: `
                The subdomain that can be used for ingress to the development environments, e.g. garden.mycompany.com
                Needs to be a hosted domain in Route53RecordTarget.
              `
            }).valueAsString,
            IngressRoute53HostedZoneId: new cdk.CfnParameter(this, "IngressRoute53HostedZoneID", {
              type: "AWS::Route53::HostedZone::Id",
              description: `
                The ID of the Route53 hosted zone with the domain that can be used for ingress
                to the development environments
              `
            }).valueAsString,
            IAMRole: cdk.Fn.conditionIf(
              shouldCreateIAMRole.logicalId,
              principalsAccessRole.attrArn, // if we created an IAM role
              roleParam // else (customer passed the IAM role param, validated above)
            ).toString(),
            EKSNodeGroupMinSize: new cdk.CfnParameter(this, "EKSNodeGroupMinSize", {
              type: "Number",
              description: `Min number of nodes in the EKS managed node group.`,
              default: "1"
            }).valueAsString,
            EKSNodeGroupMaxSize: new cdk.CfnParameter(this, "EKSNodeGroupMaxSize", {
              type: "Number",
              description: `Max number of nodes in the EKS managed node group.`,
              default: "1"
            }).valueAsString,
            EKSClusterName: new cdk.CfnParameter(this, "EKSClusterName", {
              type: "String",
              description: `Name of the EKS cluster. Defaults to garden-dev-cluster`,
              default: "garden-dev-cluster",
            }).valueAsString
          }
      })
  }
}
