import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { unlink } from "fs/promises";
import path from "path";

type SpacesConfig = {
  accessKey: string;
  secretKey: string;
  bucket: string;
  region: string;
  endpoint: string;
  cdnUrl: string;
  folder: string;
};

function getSpacesConfig(): SpacesConfig {
  const accessKey = process.env.DO_SPACES_KEY;
  const secretKey = process.env.DO_SPACES_SECRET;
  const bucket = process.env.DO_SPACES_BUCKET;
  const region = process.env.DO_SPACES_REGION;
  const endpoint = process.env.DO_SPACES_ENDPOINT;
  const cdnUrl = process.env.DO_SPACES_CDN_URL;
  const folder = process.env.DO_SPACES_FOLDER ?? "assetify";

  if (!accessKey || !secretKey || !bucket || !region || !endpoint || !cdnUrl) {
    throw new Error("DigitalOcean Spaces is not configured.");
  }

  return { accessKey, secretKey, bucket, region, endpoint, cdnUrl, folder };
}

let spacesClient: S3Client | null = null;

function getSpacesClient(): S3Client {
  if (spacesClient) return spacesClient;
  const config = getSpacesConfig();
  spacesClient = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey,
    },
    forcePathStyle: false,
  });
  return spacesClient;
}

export function buildSpacesPublicUrl(objectKey: string): string {
  const { cdnUrl } = getSpacesConfig();
  return `${cdnUrl.replace(/\/$/, "")}/${objectKey}`;
}

export function resolveSpacesObjectKey(fileUrl: string): string | null {
  if (!fileUrl.startsWith("http")) return null;

  const { cdnUrl, bucket, folder } = getSpacesConfig();
  const cdnBase = cdnUrl.replace(/\/$/, "");
  if (fileUrl.startsWith(cdnBase)) {
    return fileUrl.slice(cdnBase.length + 1);
  }

  try {
    const url = new URL(fileUrl);
    const pathKey = url.pathname.replace(/^\//, "");
    if (pathKey.startsWith(`${folder}/`)) return pathKey;
    if (pathKey.startsWith(`${bucket}/`)) return pathKey.slice(bucket.length + 1);
    return pathKey;
  } catch {
    return null;
  }
}

export async function uploadAssetFileToSpaces(
  assetId: string,
  file: File,
  folder: "photos" | "documents",
): Promise<{ fileName: string; publicUrl: string }> {
  const config = getSpacesConfig();
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = path.extname(file.name) || ".bin";
  const fileName = `${Date.now()}-${randomUUID()}${ext}`;
  const objectKey = `${config.folder}/assets/${assetId}/${folder}/${fileName}`;

  await getSpacesClient().send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: objectKey,
      Body: buffer,
      ContentType: file.type || "application/octet-stream",
      ACL: "public-read",
    }),
  );

  return {
    fileName,
    publicUrl: buildSpacesPublicUrl(objectKey),
  };
}

export async function deleteStoredFile(fileUrl: string): Promise<void> {
  if (fileUrl.startsWith("/")) {
    try {
      await unlink(path.join(process.cwd(), "public", fileUrl.replace(/^\//, "")));
    } catch {
      // ignore missing legacy local files
    }
    return;
  }

  const objectKey = resolveSpacesObjectKey(fileUrl);
  if (!objectKey) return;

  const { bucket } = getSpacesConfig();
  await getSpacesClient().send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: objectKey,
    }),
  );
}
