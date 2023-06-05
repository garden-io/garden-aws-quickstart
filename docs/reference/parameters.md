# CloudFormation stack parameters

This is a reference for all parameters supported by the Garden Development Cluster Solution for AWS.

## `ECRPrefix`
Prefix of ECR repositories specified in `ECRRepositories`.

For example, for the prefix `garden-dev-cluster` and the repositories `api,worker`, then the ECR repositories named `garden-dev-cluster/api` and `garden-dev-cluster/worker` will be created.

## `ECRRepositories`
ECR repositories to create. 

For example, for the prefix `garden-dev-cluster` and the repositories `api,worker`, then the ECR repositories named `garden-dev-cluster/api` and `garden-dev-cluster/worker` will be created.

You will need to add all the names of all your actions of `kind: Build` and `type: container`. AWS ECR requires to create the ECR repositories before it is possible to push and tag the container image from Garden.

## `EKSClusterName`
The name of the EKS cluster.

## `EKSNodeGroupMaxSize`
Maximum number of nodes in your EKS cluster. To disable auto scaling, set minimum and maximum size to the same value.

## `EKSNodeGroupMinSize`
Minimum number of nodes in your EKS cluster. To disable auto scaling, set minimum and maximum size to the same value.

## `IAMEKSFullAccessPrincipals`
List of ARN principals, like IAM users or roles, that should be allowed to assume the role to get access to the EKS cluster. Mutually exclusive with the `IAMEKSFullAccessRole` parameter. You must either supply an `IAMEKSFullAccessRole` parameter, or `IAMEKSFullAccessPrincipals`, but not both.

Example: `arn:aws:iam::001122334455:user/anna,arn:aws:iam::001122334455:user/steffen,arn:aws:iam::001122334455:user/srihas`

## `IAMEKSFullAccessRole`
The ARN of the IAM role that gets access to the EKS cluster. Everyone who can assume this role will have full access to the EKS cluster created in this stack. You are responsible for managing the trust policy of this role and allow users to assume it. Mutually exclusive with `IAMEKSFullAccessPrincipals` parameter. You must either supply an `IAMEKSFullAccessRole` parameter, or `IAMEKSFullAccessPrincipals`, but not both.

In case you are using AWS Single Sign On (also known as AWS Identity Center) you will want to specify the `AWSReservedSSO` role that your development teams can assume in `IAMEKSFullAccessRole`.

Example: `arn:aws:iam::001122334455:role/AWSReservedSSO_DeveloperAccess_xxxxxxxx`

## `IngressRoute53HostedZoneId`
The ID of the Route53 hosted zone with the domain that can be used for ingress to the development environments

## `IngressRoute53HostedZoneId`
The subdomain that can be used for ingress to the development environments, e.g. `garden.mycompany.com`. Needs to be a hosted domain in `Route53RecordTarget`.
