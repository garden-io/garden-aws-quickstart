import { KubernetesManifest } from "aws-cdk-lib/aws-eks";
import { ClusterAddOn, ClusterInfo } from "@aws-quickstart/eks-blueprints";
import * as blueprints from "@aws-quickstart/eks-blueprints";

export class DeployImagePullSecret implements ClusterAddOn {
    deploy(clusterInfo: ClusterInfo): void {
        const accountID = process.env.CDK_DEFAULT_ACCOUNT!;
        const cluster = clusterInfo.cluster;
        const region = "eu-central-1"
        const ecrURL = `${accountID}.dkr.ecr.${region}.amazonaws.com`
        let secretValue = {
            credHelpers: {
                  [ecrURL]: "ecr-login"
            }
        }
        const secret = cluster.addManifest("ECRSecret", {
            "apiVersion": "v1",
            "kind": "Secret",
            "type": "kubernetes.io/dockerconfigjson",
            "metadata": {"name": "regcred", "namespace": "default"},
            "stringData": {".dockerconfigjson": JSON.stringify(secretValue)}
        })
    }
}