import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID || "9bf4a19ef41f16fe8dabef08cb0648a0";
const accessKeyId = process.env.R2_ACCESS_KEY_ID || "362e1a9e65700ab0bbcb1d71d1a3edcd";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "7d0a8fe9930ff99425507c5fd850d04a16e7f3281fdf31510aca3ea3c88a3f1a";
export const R2_BUCKET = process.env.R2_BUCKET_NAME || "restopulse-images";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string = "image/webp"
) {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  return await r2Client.send(command);
}

export async function deleteFromR2(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  });

  return await r2Client.send(command);
}

export async function getFromR2(key: string) {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  });

  return await r2Client.send(command);
}

export async function headR2Object(key: string) {
  try {
    const command = new HeadObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    });
    return await r2Client.send(command);
  } catch (err: any) {
    if (err?.name === "NotFound" || err?.$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw err;
  }
}
