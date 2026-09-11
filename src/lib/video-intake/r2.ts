import { S3Client } from "@aws-sdk/client-s3";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Fehlende Server-Konfiguration: ${name}`);
  return value;
}

export function getVideoR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${required("VIDEO_R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: required("VIDEO_R2_ACCESS_KEY_ID"),
      secretAccessKey: required("VIDEO_R2_SECRET_ACCESS_KEY"),
    },
  });
}

export function getVideoR2Bucket() {
  return required("VIDEO_R2_BUCKET_NAME");
}
