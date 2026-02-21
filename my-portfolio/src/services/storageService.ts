import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from '../firebase/config';

export async function uploadProjectImage(
  file: File,
  projectId: string
): Promise<string> {
  const path = `projects/${projectId}/${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function deleteProjectImage(imageUrl: string): Promise<void> {
  try {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
  } catch {
    // ignore if file doesn't exist or URL is external
  }
}

export interface CVUploadResult {
  storagePath: string;
  downloadUrl: string;
}

/**
 * Uploads a CV PDF to a unique path (cv/<timestamp>-cv.pdf) so every upload
 * is a distinct object — no browser or CDN cache issues.
 * If oldStoragePath is supplied the previous file is deleted after a successful upload.
 */
export function uploadCVWithProgress(
  file: File,
  onProgress: (pct: number) => void,
  oldStoragePath?: string
): Promise<CVUploadResult> {
  const storagePath = `cv/${Date.now()}-cv.pdf`;

  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, storagePath);
    const task = uploadBytesResumable(storageRef, file);

    task.on(
      'state_changed',
      (snapshot) => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        onProgress(pct);
      },
      (error) => reject(error),
      async () => {
        try {
          const downloadUrl = await getDownloadURL(task.snapshot.ref);

          // Delete old file after new one is confirmed uploaded
          if (oldStoragePath) {
            try {
              await deleteObject(ref(storage, oldStoragePath));
            } catch {
              // Non-fatal: old file may already be gone
            }
          }

          resolve({ storagePath, downloadUrl });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}
