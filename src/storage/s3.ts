import {
  S3Client,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { config } from "../config";

export const s3 = new S3Client({
  endpoint: config.s3.endpoint,
  region: "us-east-1",
  credentials: {
    accessKeyId: config.s3.accessKeyId,
    secretAccessKey: config.s3.secretAccessKey,
  },
  forcePathStyle: true,
});

export async function uploadToS3(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export function getPublicUrl(key: string): string {
  return `${config.s3.endpoint}/${config.s3.bucket}/${key}`;
}
