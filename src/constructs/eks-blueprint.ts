import { Construct } from "constructs";
import { PARAMETER_EKS_NODEGROUP_MAX_SIZE, PARAMETER_EKS_NODEGROUP_MIN_SIZE, PARAMETER_INGRESS_ROUTE53_HOSTEDZONEID, PARAMETER_IAM_ROLE, PARAMETER_INGRESS_SUBDOMAIN, PARAMETER_EKS_CLUSTER_NAME } from "../stacks/eks-blueprint";
import { CfnStack } from "aws-cdk-lib";

interface EKSBlueprintConstructProps {
  blueprintStackVersion: string
  parameters: {
    [PARAMETER_INGRESS_SUBDOMAIN]: string,
    [PARAMETER_INGRESS_ROUTE53_HOSTEDZONEID]: string,
    [PARAMETER_IAM_ROLE]: string
    [PARAMETER_EKS_NODEGROUP_MIN_SIZE]: string
    [PARAMETER_EKS_NODEGROUP_MAX_SIZE]: string
    [PARAMETER_EKS_CLUSTER_NAME]: string
  }
}

export class EKSBlueprintConstruct extends Construct {
  constructor(scope: Construct, id: string, props: EKSBlueprintConstructProps) {
    super(scope, id);

    new CfnStack(this, 'BlueprintsTemplate', {
      templateUrl: `https://garden-cfn-public-releases.s3.amazonaws.com/eks-blueprint/${props.blueprintStackVersion}/eks-blueprint.template.yaml`,
      parameters: props.parameters
    });
  }
}
