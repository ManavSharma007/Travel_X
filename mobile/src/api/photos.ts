import { api } from "./client";
import * as FileSystem from "expo-file-system/legacy";

// Uploads one image to a visit. Uses expo-file-system's uploadAsync, which
// reliably PUTs a local file:// URI's bytes in React Native (plain fetch+blob
// on a file:// URI does not work consistently in Expo, which is why photos
// silently failed before).

export interface LocalAsset {
  uri: string;
  width?: number;
  height?: number;
  mimeType?: string;
}

function contentTypeFor(asset: LocalAsset): string {
  const m = asset.mimeType?.toLowerCase();
  if (m === "image/png") return "image/png";
  if (m === "image/webp") return "image/webp";
  if (m === "image/heic") return "image/heic";
  return "image/jpeg";
}

export async function uploadVisitPhoto(
  visitId: string,
  asset: LocalAsset
): Promise<{ id: string; url: string }> {
  const contentType = contentTypeFor(asset);

  // 1. presign — get the upload URL + storage key from the backend
  const presignRes = await api.post("/visits/photos/presign", {
    visitId,
    contentType,
  });
  const { uploadUrl, storageKey } = presignRes.data as {
    uploadUrl: string;
    storageKey: string;
  };

  // 2. PUT the raw file bytes to the upload URL using expo-file-system.
  const uploadResult = await FileSystem.uploadAsync(uploadUrl, asset.uri, {
    httpMethod: "PUT",
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: { "Content-Type": contentType },
  });

  if (uploadResult.status < 200 || uploadResult.status >= 300) {
    throw new Error(`Upload failed (${uploadResult.status})`);
  }

  // 3. attach — record the photo against the visit
  const attachRes = await api.post(`/visits/${visitId}/photos`, {
    storageKey,
    width: asset.width,
    height: asset.height,
  });
  return attachRes.data.photo;
}
