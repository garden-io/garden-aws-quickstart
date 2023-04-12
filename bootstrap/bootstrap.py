"""
MIT Licensed
Copyright (c) 2021 superwerker

https://github.com/superwerker/superwerker/blob/078231a/cdk/cdk-bootstrap.py
"""
import boto3
from boto3.session import Session
import subprocess
import os

class DeployError(Exception):
    pass

cfn = boto3.client("cloudformation")
s = Session()
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

template_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "bootstrap.yaml")
for region in regions:
    cmd = ["aws", "cloudformation", "deploy",
             "--stack-name", "garden-marketplace-assets-bootstrap",
             "--region", region,
             "--template-file", template_file,
             ]
    print("Deploying to region={0} with cmd={1}".format(region, cmd))
    p = subprocess.run(cmd, capture_output=True)
    if p.returncode != 0:
        raise DeployError(p.stderr)
    print(p.stdout)
