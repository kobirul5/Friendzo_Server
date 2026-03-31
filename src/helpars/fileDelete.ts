import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import config from "../config/index";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// DigitalOcean Spaces Config
const s3 = new S3Client({
  region: "us-east-1",
  endpoint: "https://sfo3.digitaloceanspaces.com",
  // endpoint: config.digitalOcean.endpoint!,
  credentials: {
    accessKeyId: config.digitalOcean.accessKey as string,
    secretAccessKey: config.digitalOcean.secretKey as string,
  },
});

async function deleteFileFromDigitalOcean(imageUrl: string): Promise<boolean> {
  if (imageUrl.includes("res.cloudinary.com")) {
    try {
      const url = new URL(imageUrl);
      const uploadIndex = url.pathname.indexOf("/upload/");

      if (uploadIndex === -1) {
        return false;
      }

      const assetPath = url.pathname.slice(uploadIndex + "/upload/".length);
      const normalizedPath = assetPath.replace(/^v\d+\//, "");
      const publicId = normalizedPath.replace(/\.[^/.]+$/, "");

      if (!publicId) {
        return false;
      }

      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
      });

      return result.result === "ok" || result.result === "not found";
    } catch (err: any) {
      console.error("Cloudinary delete failed:", err.message || err);
      return false;
    }
  }

  try {
    const bucketName = process.env.DO_SPACE_BUCKET!;

    // Extract key (remove CDN or endpoint URL)
    const cdnBase = process.env.DO_SPACE_CDN_ENDPOINT || "";
    const originBase = process.env.DO_SPACE_ORIGIN_ENDPOINT || "";
    
    let key = imageUrl.replace(cdnBase + "/", "").replace(originBase + "/", "");

    if (!key) {
      console.warn(`Could not extract key from URL: ${imageUrl}`);
      return false;
    }

    console.log("Deleting key:", key);

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await s3.send(command);

    console.log(`Deleted: ${key}`);
    return true;

  } catch (err: any) {
    console.error(" Delete failed:", err.message || err);
    return false;
  }
}
// async function deleteFileFromDigitalOcean(imageUrl: string): Promise<boolean> {
//   try {
//     const bucketName = config.digitalOcean.bucket!;
//     const key = imageUrl.split(`${bucketName}/`)[1];

//     if (!key) {
//       console.warn(` Could not extract key from URL: ${imageUrl}`);
//       return false;
//     }

//     const command = new DeleteObjectCommand({
//       Bucket: bucketName,
//       Key: key,
//     });

//     await s3.send(command);

//     // console.log(` Deleted: ${key}`);
//     return true;
//   } catch (err: any) {
//     console.error(" Delete failed:", err.message || err);
//     return false;
//   }
// }


async function deleteMultipleFileFromDigitalOcean(
  imageUrls: string[]
): Promise<{ success: string[]; failed: string[] }> {
  const success: string[] = [];
  const failed: string[] = [];

  for (const url of imageUrls) {
    const isDeleted = await deleteFileFromDigitalOcean(url);
    if (isDeleted) {
      success.push(url);
    } else {
      failed.push(url);
    }
  }

  return { success, failed };
}


export const deleteImageAndFile = {
  deleteFileFromDigitalOcean,
  deleteMultipleFileFromDigitalOcean
};
