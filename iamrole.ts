import { ResourceContext, ResourceProvider } from "@aws-quickstart/eks-blueprints";
import * as iam from "aws-cdk-lib/aws-iam";
import * as cdk from "aws-cdk-lib";
import { PARAMETER_IAMROLE, PARAMETER_IAMUSERS } from "./cluster";
import { IConstruct } from "constructs";

export class IamRoleResourceProvider implements ResourceProvider<iam.IRole> {
    provide(context: ResourceContext): iam.IRole {
        const roleParam = new cdk.CfnParameter(context.scope, PARAMETER_IAMROLE, {
            type: "AWS::IAM::Role",
            description: `
              The IAM role that should be added to the aws-auth configmap in the EKS cluster.
              Everyone that can assume this role will have full access to the EKS cluster created
              in this stack.
            `
          }).valueAsString
      
        const usersParam = new cdk.CfnParameter(context.scope, PARAMETER_IAMUSERS, {
            type: "List<AWS::IAM::User>",
            description: `
              The IAM user that should be added to the aws-auth configmap in the EKS cluster.
              Everyone that can assume this role will have full access to the EKS cluster created
              in this stack.
            `
          })
          const assumePolicyDoc = {}
          const policyDoc = {}
          const role = new iam.CfnRole(context.scope, 'garden-dev-cluster-role', {
            assumeRolePolicyDocument: policyDoc,
          
            // the properties below are optional
            description: 'description',
            managedPolicyArns: ['managedPolicyArns'],
            maxSessionDuration: 123,
            path: 'path',
            permissionsBoundary: 'permissionsBoundary',
            policies: [{
              policyDocument: policyDoc,
              policyName: 'policyName',
            }],
            roleName: 'garden-dev-cluster-role',
            tags: [{
              key: 'key',
              value: 'value',
            }],
          }); 
        return iam.Role.fromRoleArn(context.scope, "garden-dev-cluster-role", role.attrArn)
        
    }
}