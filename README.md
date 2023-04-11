# Dev cluster on AWS via AWS CDK and Cloudformation

## Inputs

* domain e.g. dev.marketplace.sys.garden
* hosted zone id
```
aws route53 list-hosted-zones-by-name --dns-name dev.marketplace.sys.garden
```
* user arns or role arn to add to the aws-auth configmap