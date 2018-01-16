import { IConfig } from '../../definitions';

import { createRequest } from '../http';

export async function ucloudSignedUpload(
  config: IConfig,
  presignedPostParams: { url: string, fields: Object },
  zip: NodeJS.ReadableStream,
  { progress }: {  progress?: (loaded: number, total: number) => void }
): Promise<void> {
  const { req } = await createRequest(config, 'post', `${presignedPostParams.url}/${(<any>presignedPostParams.fields).file_name}`);
  return new Promise<void>((resolve, reject) => {
    zip.on('error', (err: any) => {
      reject(err);
    });

    let bufs: Buffer[] = [];
    zip.on('data', (buf: Buffer) => {
      bufs.push(buf);
    });
    zip.on('end', () => {
      req
        .buffer()
        .field('FileName', (<any>presignedPostParams.fields).file_name)
        .field('Authorization', (<any>presignedPostParams.fields).signature)
        // .field('Content-Type', 'application/zip')
        .attach('file', Buffer.concat(bufs), {
          contentType: 'application/zip',
          filename: `${(<any>presignedPostParams.fields).file_name}`
        })
        .on('progress', (event) => {
          if (progress) {
            progress(event.loaded, event.total);
          }
        })
        .end((err, res) => {
          if (err) {
            return reject(err);
          }
          if (res.status !== 200) {
            // TODO: log body for debug purposes?
            return reject(new Error(`Unexpected status code from UCloud: ${res.status}`));
          }
          resolve();
        });
    });
  });
}
