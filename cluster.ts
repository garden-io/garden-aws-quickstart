import * as blueprints from '@aws-quickstart/eks-blueprints';
import { GlobalResources, utils, ImportHostedZoneProvider} from '@aws-quickstart/eks-blueprints';
import { Construct } from 'constructs';
//import * as team from '../teams';

const burnhamManifestDir = './lib/teams/team-burnham/'
const rikerManifestDir = './lib/teams/team-riker/'
//const teamManifestDirList = [burnhamManifestDir, rikerManifestDir]

const accountID = process.env.CDK_DEFAULT_ACCOUNT!;
const gitUrl = 'https://github.com/aws-samples/eks-blueprints-workloads.git';


/**
 * See docs/patterns/nginx.md for mode details on the setup.
 */
export default class DevCluster {

    async buildAsync(scope: Construct, id: string) {
        /*
        const teams: Array<blueprints.Team> = [
            new team.TeamPlatform(accountID),
            new team.TeamTroiSetup,
            new team.TeamRikerSetup(scope, teamManifestDirList[1]),
            new team.TeamBurnhamSetup(scope, teamManifestDirList[0])
        ];
        */

        const subdomain: string = utils.valueFromContext(scope, "dev.marketplace", "sys.garden");

        blueprints.HelmAddOn.validateHelmVersions = false;

        await blueprints.EksBlueprint.builder()
            .account("049586690729")
            .region("eu-central-1")
            //.teams(...teams)
            .resourceProvider(GlobalResources.HostedZone ,new ImportHostedZoneProvider('Z028702323WOQ31QJAJJP', subdomain))
            .resourceProvider(GlobalResources.Certificate, new blueprints.CreateCertificateProvider('wildcard-cert', `*.${subdomain}`, "dev.marketplace.sys.garden"))
            .addOns(
                new blueprints.VpcCniAddOn(),
                new blueprints.CoreDnsAddOn(),
                new blueprints.CertManagerAddOn,
                new blueprints.AwsLoadBalancerControllerAddOn,
                new blueprints.ExternalDnsAddOn({
                    hostedZoneResources: [blueprints.GlobalResources.HostedZone] // you can add more if you register resource providers
                }),
                new blueprints.NginxAddOn({
                    internetFacing: true,
                    backendProtocol: "tcp",
                    externalDnsHostname: subdomain,
                    crossZoneEnabled: false,
                    certificateResourceName: GlobalResources.Certificate
                }),
                new blueprints.SecretsStoreAddOn({ rotationPollInterval: "120s" }),
                new blueprints.ClusterAutoScalerAddOn)
            .buildAsync(scope, `${id}-blueprint`);

            blueprints.HelmAddOn.validateHelmVersions = false;
    }
}


