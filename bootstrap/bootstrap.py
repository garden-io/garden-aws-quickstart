"""
MIT Licensed
Copyright (c) 2021 superwerker

https://github.com/superwerker/superwerker/blob/078231a/cdk/cdk-bootstrap.py
"""
import subprocess
import os

class DeployError(Exception):
    pass

# cfn = boto3.client("cloudformation")
# s = Session()
regions = [
    "ap-northeast-1",
    "ap-northeast-2",
    "ap-south-1",
    "ap-southeast-1",
    "ap-southeast-2",
    "ca-central-1",
    "eu-central-1",
    "eu-north-1",
    "eu-west-1",
    "eu-west-2",
    "eu-west-3",
    "sa-east-1",
    "us-east-1",
    "us-east-2",
    "us-west-2"
]

def cfn_apply(region, template, stack_name, extra_args=None):
    template_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), template)
    cmd = ["aws", "cloudformation", "deploy",
             "--stack-name", stack_name,
             "--region", region,
             "--template-file", template_file,
             ]
    if extra_args:
        cmd.extend(extra_args)

    print("Deploying to region={0} with cmd={1}".format(region, cmd))
    p = subprocess.run(cmd, capture_output=True)
    if p.returncode != 0:
        raise DeployError(p.stderr)
    print(p.stdout)


# Release bucket, OIDC IAM role for release pipeline, ...
cfn_apply("eu-central-1", "global-bootstrap.yaml", "garden-marketplace-global-bootstrap", extra_args=["--capabilities", "CAPABILITY_IAM"])

# regional s3 buckets for CDK assets
for region in regions:
    cfn_apply(region, "regional-bootstrap.yaml", "garden-marketplace-assets-bootstrap")

