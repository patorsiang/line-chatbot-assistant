// for accessing the db connection
import * as admin from "firebase-admin";

// for creating public url in Cloud Storage
import {v4 as uuidv4} from "uuid";

// for folder organization
import * as path from "path";
import * as os from "os";
import * as fs from "fs";

export const upload = async ({
  timestamp,
  userId,
  imageBinary,
}: {
  timestamp: string;
  userId: string;
  imageBinary: string;
}) => {
  const filename = `${timestamp}.jpg`;
  const tempLocalFile = path.join(os.tmpdir(), filename);

  await fs.writeFileSync(tempLocalFile, imageBinary);

  const uuid = uuidv4();

  const bucket = admin.storage().bucket();
  const file = await bucket.upload(tempLocalFile, {
    // กำหนด path ในการเก็บไฟล์แยกเป็นแต่ละ userId
    destination: `photos/${userId}/${filename}`,
    metadata: {
      cacheControl: "no-cache",
      metadata: {
        firebaseStorageDownloadTokens: uuid,
      },
    },
  });

  fs.unlinkSync(tempLocalFile);

  const prefix = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o`;
  const suffix = `alt=media&token=${uuid}`;
  return {
    original: `${prefix}/${encodeURIComponent(file[0].name)}?${suffix}`,
    thumb: `${prefix}/photos${encodeURIComponent(
      `/${userId}/thumbs/${timestamp}_200x200.jpg`
    )}?${suffix}`,
  };
};
