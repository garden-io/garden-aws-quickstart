# Garden Development Cluster Solution for AWS

# Goals
- **Remote development:** Use an Amazon EKS cluster as a remote development environment for your engineering team, as well as for CI and QA environments.
- **Fast builds:** Save previous engineering time wasted waiting for container builds by using the [in-cluster-building](https://docs.garden.io/kubernetes-plugins/advanced/in-cluster-building) and [build caching](https://docs.garden.io/basics/how-garden-works#caching) features. Your container images will be stored in AWS ECR repositories.
- **Autoscaling:** Control the minimum and maximum number of nodes in the cluster, to support your Engineering team size and workload requirements
- **Access management:** Easily grant access to your development teams, so they can use [Garden sync mode](https://docs.garden.io/guides/code-synchronization) to make the remote development environment feel like running your set of services locally.
- **Batteries included:** Also takes care of Load Balancing, Ingress controller, SSL certificates and Route53 supporting any number of development environments right away. The EKS cluster comes already with all necessary IAM permissions preconfigured that Garden needs to function.

## Quick start

After completing the following steps, you will have deployed your dev environment of the [Garden quick-start example](https://github.com/garden-io/quickstart-example) to your Garden Development Cluster on AWS.

### 1. DNS Setup

To make your development environments accessible for your engineering and QA teams you need to choose a domain name that we will use for the Quickstart cluster. You need to be the owner of that domain and be able to create DNS records.

When using `gardendev.example.com`, your development and QA environments would be reachable on any of the subdomains (`*.gardendev.example.com`) once you completed the quick start steps.

If this DNS name is not already hosted on AWS Route 53, you need to [create a hosted zone](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/CreatingHostedZone.html) for it first, and also complete step 8 of that guide to make AWS Route 53 DNS servers authoritative for the chosen DNS name.

### 2. Deploy the solution

Now you can deploy the solution using AWS CloudFormation. 

<!-- x-release-please-start -->
Follow the link to the [Quick install](https://console.aws.amazon.com/cloudformation/home#/stacks/quickcreate?stackName=garden-dev-cluster&templateURL=https://garden-cfn-public-releases.s3.amazonaws.com/dev-cluster/0.4.0/garden-dev-cluster.template.yaml) template ([View Template Source](https://garden-cfn-public-releases.s3.amazonaws.com/dev-cluster/0.4.0/garden-dev-cluster.template.yaml)).
<!-- x-release-please-end -->

#### Parameters
##### ECRPrefix
Prefix of ECR repositories specified in `ECRRepositories`.

For example, for the prefix `garden-dev-cluster` and the repositories `api,worker`, then the ECR repositories named `garden-dev-cluster/api` and `garden-dev-cluster/worker` will be created.

If you want to deploy the [Garden quick-start example](https://github.com/garden-io/quickstart-example), keep the default value.

##### ECRRepositories
ECR repositories to create. 

For example, for the prefix `garden-dev-cluster` and the repositories `api,worker`, then the ECR repositories named `garden-dev-cluster/api` and `garden-dev-cluster/worker` will be created.

##### EKSClusterName
The name of the EKS cluster. You can choose any name you like.

##### EKSNodeGroupMaxSize
Maximum number of nodes in your EKS cluster. To disable auto scaling, set minimum and maximum size to the same value.

##### EKSNodeGroupMinSize
Minimum number of nodes in your EKS cluster. To disable auto scaling, set minimum and maximum size to the same value.

##### IAMEKSFullAccessPrincipals
List of ARN principals, like IAM users or roles, that should be allowed to assume the role to get access to the EKS cluster. Mutually exclusive with the IAMEKSFullAccessRole parameter. You must either supply an IAMEKSFullAccessRole parameter, or IAMEKSFullAccessPrincipals, but not both.

##### IAMEKSFullAccessRole
The ARN of the IAM role that gets access to the EKS cluster. Everyone who can assume this role will have full access to the EKS cluster created in this stack. You are responsible for managing the trust policy of this role and allow users to assume it. Mutually exclusive with IAMEKSFullAccessPrincipals parameter. You must either supply an IAMEKSFullAccessRole parameter, or IAMEKSFullAccessPrincipals, but not both.

In case you are using AWS Single Sign On (also known as AWS Identity Center) you will want to specify the `AWSReservedSSO` role that your development teams can assume in `IAMEKSFullAccessRole`.

##### IngressRoute53HostedZoneId
The ID of the Route53 hosted zone with the domain that can be used for ingress to the development environments

Use the drop down to choose the hosted zone ID that hosts the domain chosen in step 1 (DNS Setup).

##### IngressRoute53HostedZoneId
The subdomain that can be used for ingress to the development environments, e.g. garden.mycompany.com Needs to be a hosted domain in Route53RecordTarget.

Enter the domain chosen in step 1 (DNS Setup).

### 3. Deploy the quickstart-example
1. `git clone https://github.com/garden-io/quickstart-example.git`
2. `cd quickstart-example`
3. TODO: Update configuration
4. `garden dev`
5. `> deploy --sync`
