import { ClusterAddOn, ClusterInfo } from "@aws-quickstart/eks-blueprints";
import * as cdk from "aws-cdk-lib";


export interface ParameterAddonProps {
    readonly id: string
    readonly props: cdk.CfnParameterProps
}

export class ParameterAddOn implements ClusterAddOn {
    readonly props: ParameterAddonProps

    constructor(props: ParameterAddonProps){
        this.props = props
    }

    deploy(clusterInfo: ClusterInfo): void {
      const contextDefault = clusterInfo.cluster.node.tryGetContext(this.props.id)
      new cdk.CfnParameter(cdk.Stack.of(clusterInfo.cluster), this.props.id, {
        ...this.props.props,
        default: contextDefault === undefined ? this.props.props.default : contextDefault
      });
    }

    get valueAsString(): string {
      return cdk.Fn.ref(this.props.id)
    }

    get valueAsNumber(): number {
      return cdk.Token.asNumber(this.valueAsString)
    }

    get valueAsList(): string[] {
      return cdk.Token.asList(this.valueAsString)
    }
}
