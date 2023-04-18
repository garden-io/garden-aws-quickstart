import AWS from 'aws-sdk';
import * as AWSCDKAsyncCustomResource from 'aws-cdk-lib/custom-resources/lib/provider-framework/types';

export const PROP_REPOSITORIES = "repositoryNames"
export const PROP_PREFIX = "repositoryPrefix"

const ecr = new AWS.ECR()

export async function handler(event: AWSCDKAsyncCustomResource.OnEventRequest): Promise<AWSCDKAsyncCustomResource.OnEventResponse> {
  const prefix: string = event.ResourceProperties[PROP_PREFIX]

    switch (event.RequestType) {
      case 'Create':
        const repositories: string[] = omitEmpty(event.ResourceProperties[PROP_REPOSITORIES])

        for (const repo of repositories) {
          await createRepo(prefix, repo)
        }
        return {}

      case 'Update':
        const newRepos: string[] = omitEmpty(event.ResourceProperties[PROP_REPOSITORIES])
        const oldRepos: string[] = omitEmpty(event.OldResourceProperties![PROP_REPOSITORIES])

        // get deleted repos
        for (const repo of oldRepos.filter((r) => !newRepos.includes(r))) {
          await deleteRepo(prefix, repo)
        }

        for (const repo of newRepos.filter((r) => !oldRepos.includes(r))) {
          createRepo(prefix, repo)
        }
        return {}

      case 'Delete':
        const repos: string[] = event.ResourceProperties[PROP_REPOSITORIES]
        for (const repo of repos) {
          await deleteRepo(prefix, repo)
        }
        return {}
    }
  }

  function omitEmpty(items: string[]) {
    return items.filter((i) => i.length > 0)
  }

  async function createRepo(prefix: string, repo: string) {
    return await ecr.createRepository({
      repositoryName: `${prefix}/${repo}`,
      imageTagMutability: "MUTABLE",
      imageScanningConfiguration: {
        scanOnPush: true
      },
      encryptionConfiguration: {
        encryptionType: "KMS"
      }
    }).promise()
  }

  async function deleteRepo(prefix: string, repo: string) {
    return await ecr.deleteRepository({
      repositoryName: `${prefix}/${repo}`,
      force: false, // will fail to delete if there are still images. In that case it must be deleted manually.
    }).promise()
  }
