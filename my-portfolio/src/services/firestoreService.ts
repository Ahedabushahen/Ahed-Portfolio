import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type {
  SiteContent,
  Project,
  Certification,
  Message,
} from '../types';

// ─── Site Content ────────────────────────────────────────────────────────────

export async function getSiteContent(): Promise<Partial<SiteContent>> {
  const snap = await getDoc(doc(db, 'site', 'content'));
  if (!snap.exists()) return {};
  return snap.data() as Partial<SiteContent>;
}

export async function saveSiteContent(data: Partial<SiteContent>): Promise<void> {
  await setDoc(doc(db, 'site', 'content'), data, { merge: true });
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function getProjects(): Promise<Project[]> {
  const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Project);
}

export async function addProject(
  data: Omit<Project, 'id' | 'createdAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'projects'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateProject(
  id: string,
  data: Partial<Omit<Project, 'id' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, 'projects', id), data);
}

export async function deleteProject(id: string): Promise<void> {
  await deleteDoc(doc(db, 'projects', id));
}

// ─── Certifications ──────────────────────────────────────────────────────────

export async function getCertifications(): Promise<Certification[]> {
  const q = query(collection(db, 'certifications'), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Certification);
}

export async function addCertification(
  data: Omit<Certification, 'id'>
): Promise<void> {
  await addDoc(collection(db, 'certifications'), data);
}

export async function updateCertification(
  id: string,
  data: Partial<Omit<Certification, 'id'>>
): Promise<void> {
  await updateDoc(doc(db, 'certifications', id), data);
}

export async function deleteCertification(id: string): Promise<void> {
  await deleteDoc(doc(db, 'certifications', id));
}

// ─── Messages ────────────────────────────────────────────────────────────────

export async function getMessages(): Promise<Message[]> {
  const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Message);
}

export async function getNewMessageCount(): Promise<number> {
  const snap = await getDocs(
    query(collection(db, 'messages'), where('status', '==', 'new'))
  );
  return snap.size;
}

export async function updateMessage(
  id: string,
  data: Partial<Omit<Message, 'id'>>
): Promise<void> {
  await updateDoc(doc(db, 'messages', id), data);
}

export async function deleteMessage(id: string): Promise<void> {
  await deleteDoc(doc(db, 'messages', id));
}

// ─── Admin check ─────────────────────────────────────────────────────────────

export async function checkIsAdmin(uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'admins', uid));
  return snap.exists();
}
