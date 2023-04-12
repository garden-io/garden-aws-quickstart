# About boostrap

For the serverless functions and other assets, we need an S3 bucket in all regions to work around the limitation described here:
https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-lambda-function-code.html#cfn-lambda-function-code-s3bucket

This creates a public S3 bucket named `garden-cfn-public-<region>` in every region.

This only needs to be executed once.

# Bucket directory structure

- `garden-cfn-public-<region>/`
  - `dev-cluster/`: Files related to the dev-cluster CDK stack
    - `x.x.x/`: semver release directory
       - `<hash>.{json,zip}`: cdk asset created by synth

- `garden-cfn-public-releases/`
  - `dev-cluster/`: Files related to the dev-cluster CDK stack
    - `x.x.x/`: semver release directory
       - `garden-dev-cluster.template.yaml`: CloudFormation stack synthesized from CDK code

# How to create or update cfn stacks

```
# Select the AWS marketplace account
awsauth --switch

# Apply the bootstrap CloudFormation template (regional-bootstrap.yaml) in all regions, and the global-bootstrap.yaml in eu-central-1
python3 bootstrap.py
```
