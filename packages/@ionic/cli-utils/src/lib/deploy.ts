import { Deploy, DeployChannel, DeploySnapshot, DeploySnapshotRequest, IClient } from '../definitions';
import { isDeployChannelResponse, isDeployResponse, isDeploySnapshotRequestResponse, isDeploySnapshotResponse } from '../guards';
import { createFatalAPIFormat } from './http';
// import { s3SignedUpload } from './utils/aws';
import { ucloudSignedUpload } from './utils/ucloud';

export class DeployClient {
  constructor(protected appUserToken: string, protected client: IClient) {}

  async getChannel(uuidOrTag: string): Promise<DeployChannel> {
    const { req } = await this.client.make('GET', `/deploy/channels/${uuidOrTag}`);
    req.set('Authorization', `Bearer ${this.appUserToken}`).send();
    const res = await this.client.do(req);

    if (!isDeployChannelResponse(res)) {
      throw createFatalAPIFormat(req, res);
    }

    return res.data;
  }

  async deploy(snapshot: string, channel: string): Promise<Deploy> {
    const { req } = await this.client.make('POST', '/deploy/deploys');
    req.set('Authorization', `Bearer ${this.appUserToken}`).send({ snapshot, channel });
    const res = await this.client.do(req);

    if (!isDeployResponse(res)) {
      throw createFatalAPIFormat(req, res);
    }

    return res.data;
  }

  async getSnapshot(uuid: string, { fields = [] }: { fields?: string[] }): Promise<DeploySnapshot> {
    if (fields.indexOf('url') === -1) {
      fields.push('url');
    }

    const { req } = await this.client.make('GET', `/deploy/snapshots/${uuid}`);
    req.set('Authorization', `Bearer ${this.appUserToken}`).query({ fields }).send();
    const res = await this.client.do(req);

    if (!isDeploySnapshotResponse(res)) {
      throw createFatalAPIFormat(req, res);
    }

    return res.data;
  }

  async requestSnapshotUpload(options: { legacy_duplication?: string; note?: string; user_metadata?: Object } = {}): Promise<DeploySnapshotRequest> {
    options.legacy_duplication = '1';

    const { req } = await this.client.make('POST', '/deploy/snapshots');
    req.set('Authorization', `Bearer ${this.appUserToken}`).send(options);
    const res = await this.client.do(req);

    if (!isDeploySnapshotRequestResponse(res)) {
      throw createFatalAPIFormat(req, res);
    }

    // TODO: Remove updateMetaDataReq when POST -> deploy/snapshots accepts user_metadata
    if (options.user_metadata) {
      const { req } = await this.client.make('PATCH', `/deploy/snapshots/${res.data.uuid}`);
      req.set('Authorization', `Bearer ${this.appUserToken}`).send({ 'user_metadata': options.user_metadata });
      await this.client.do(req);
    }

    return res.data;
  }

  uploadSnapshot(snapshot: DeploySnapshotRequest, zip: NodeJS.ReadableStream, progress?: (loaded: number, total: number) => void): Promise<void> {
    // return s3SignedUpload(this.client.config, snapshot.presigned_post, zip, { progress });
    return ucloudSignedUpload(this.client.config, snapshot.presigned_post, zip, { progress });
  }
}
