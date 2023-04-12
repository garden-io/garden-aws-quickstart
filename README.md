# Dev cluster on AWS via AWS CDK and Cloudformation

## Quick start

<!-- x-release-please-start-version -->
- [Quick install](https://console.aws.amazon.com/cloudformation/home#/stacks/quickcreate?stackName=garden-dev-cluster&templateURL=https://garden-cfn-public-releases.s3.amazonaws.com/dev-cluster/0.1.0/garden-dev-cluster.template.yaml)
- [View template](https://garden-cfn-public-releases.s3.amazonaws.com/dev-cluster/0.1.0/garden-dev-cluster.template.yaml)
<!-- x-release-please-end -->

## Inputs

* domain e.g. dev.marketplace.sys.garden
* hosted zone id
```
aws route53 list-hosted-zones-by-name --dns-name dev.marketplace.sys.garden
```
* user arns or role arn to add to the aws-auth configmap


