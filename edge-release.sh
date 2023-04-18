#!/bin/bash

# This script is meant to be used for end-to-end testing, so we can test the whole thing without actually releasing it on github.

set -e -o pipefail

export CDK_RELEASE_VERSION=edge

cd $(dirname $0)

npm install
npm run synth
npm run rain
npm run upload-assets
npm run upload-templates

echo
echo "Quick start: https://console.aws.amazon.com/cloudformation/home#/stacks/quickcreate?stackName=garden-dev-cluster&templateURL=https://garden-cfn-public-releases.s3.amazonaws.com/dev-cluster/$CDK_RELEASE_VERSION/garden-dev-cluster.template.yaml"
echo "Template URL: https://garden-cfn-public-releases.s3.amazonaws.com/dev-cluster/$CDK_RELEASE_VERSION/garden-dev-cluster.template.yaml"
