import { KubernetesManifest } from "aws-cdk-lib/aws-eks";
import { ClusterAddOn, ClusterInfo } from "@aws-quickstart/eks-blueprints";
import * as blueprints from "@aws-quickstart/eks-blueprints";

export class DeployImagePullSecret implements ClusterAddOn {
    deploy(clusterInfo: ClusterInfo): void {
        const cluster = clusterInfo.cluster;
        const docArray = blueprints.utils.readYamlDocument(__dirname + '/imagePullSecret.yaml');
        const manifest = docArray.split("---").map(e => blueprints.utils.loadYaml(e));
        new KubernetesManifest(cluster.stack, "myproduct-manifest", {
            cluster,
            manifest,
            overwrite: true
        });
    }
}