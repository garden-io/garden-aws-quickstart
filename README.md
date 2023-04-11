# Dev cluster on AWS via AWS CDK and Cloudformation

## Steps to build and publish

```
rm -rf cdk.out
rm -rf cdk.out
npx cdk synth
AWS_REGION=eu-central-1 npx cdk-assets publish -p cdk.out/steffen-dev-02-dev-cluster.assets.json
rain fmt cdk.out/steffen-dev-02-dev-cluster.template.json > test.yaml
```


## Inputs

* domain e.g. dev.marketplace.sys.garden
* hosted zone id
```
aws route53 list-hosted-zones-by-name --dns-name dev.marketplace.sys.garden
```
* user arns or role arn to add to the aws-auth configmap


