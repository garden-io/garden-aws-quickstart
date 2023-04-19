import { ClusterAddOn, ClusterInfo } from "@aws-quickstart/eks-blueprints";


export interface ImagePullSecretAddOnProps{
    readonly accountId: string
    readonly region: string
}
export class DeployImagePullSecret implements ClusterAddOn {
    readonly imagePullSecretAddOnProps: ImagePullSecretAddOnProps;
    constructor(imagePullSecretAddOnProps: ImagePullSecretAddOnProps){
        this.imagePullSecretAddOnProps = imagePullSecretAddOnProps
    };
    deploy(clusterInfo: ClusterInfo): void {
        const cluster = clusterInfo.cluster;
        const ecrURL = `${this.imagePullSecretAddOnProps.accountId}.dkr.ecr.${this.imagePullSecretAddOnProps.region}.amazonaws.com`
        let secretValue = {
            credHelpers: {
                  [ecrURL]: "ecr-login"
            }
        }
        cluster.addManifest("ECRSecret", {
            "apiVersion": "v1",
            "kind": "Secret",
            "type": "kubernetes.io/dockerconfigjson",
            "metadata": {"name": "regcred", "namespace": "default"},
            "stringData": {".dockerconfigjson": JSON.stringify(secretValue)}
        })
    }
}
