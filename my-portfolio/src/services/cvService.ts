import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import type { ResumeMeta } from '../types';

/**
 * Reads site/content and returns the resume metadata stored under about.resume.
 * Returns null if none has been saved yet.
 */
export async function getResumeMeta(): Promise<ResumeMeta | null> {
  const snap = await getDoc(doc(db, 'site', 'content'));
  if (!snap.exists()) return null;
  const data = snap.data() as Record<string, unknown>;
  const about = data?.about as Record<string, unknown> | undefined;
  return (about?.resume as ResumeMeta) ?? null;
}

/**
 * Resolves a Firebase Storage path to a fresh download URL.
 * Call this at download-click time so the URL is always current.
 */
export async function getResumeDownloadUrl(storagePath: string): Promise<string> {
  return getDownloadURL(ref(storage, storagePath));
}

/**
 * Persists new resume metadata into site/content.about.resume.
 * Uses updateDoc with dot-notation so no other `about` fields are touched.
 * Falls back to setDoc (merge) if the document doesn't exist yet.
 */
export async function saveResumeMeta(
  meta: Omit<ResumeMeta, 'updatedAt'>
): Promise<void> {
  const payload = {
    storagePath: meta.storagePath,
    fileName: meta.fileName,
    updatedAt: serverTimestamp(),
  };

  const docRef = doc(db, 'site', 'content');

  try {
    // Fast path: document exists → update only about.resume
    await updateDoc(docRef, { 'about.resume': payload });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    // "not-found" means the document doesn't exist yet — create it
    if (code === 'not-found') {
      await setDoc(docRef, { about: { resume: payload } }, { merge: true });
    } else {
      throw err;
    }
  }
}
