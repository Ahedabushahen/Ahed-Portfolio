/**
 * Patches the uploaded CV file:
 *   1. Sets Content-Disposition: attachment so window.open() forces a download
 *   2. Saves the downloadUrl into Firestore site/content.about.resume
 * Run: node patch-cv-meta.mjs
 */
import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require   = createRequire(import.meta.url);

const BUCKET           = 'my-portfolio-fa015.firebasestorage.app';
const CV_FILENAME      = 'Ahed_Abu_Shahen_CV.pdf';
const SERVICE_ACCOUNT  = resolve(__dirname, 'service-account.json');
const FIREBASE_API_KEY = 'AIzaSyC5EuMcwGRwaVPLCbQaFodPzlXsLfS9yLc';
const PROJECT          = 'my-portfolio-fa015';

if (!existsSync(SERVICE_ACCOUNT)) {
  console.error('❌  service-account.json not found'); process.exit(1);
}

// ── Helper ────────────────────────────────────────────────────────────────────
function httpsReq(opts, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(opts, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString() }));
    });
    req.on('error', reject);
    if (body !== undefined) req.write(body instanceof Buffer ? body : Buffer.from(String(body)));
    req.end();
  });
}

// ── Get Firebase ID token ─────────────────────────────────────────────────────
let admin;
try { admin = (await import('firebase-admin')).default; }
catch { console.error('❌  Run: npm install --save-dev firebase-admin'); process.exit(1); }

const sa = JSON.parse(readFileSync(SERVICE_ACCOUNT, 'utf8'));
try { admin.initializeApp({ credential: admin.credential.cert(sa) }); }
catch { /* already initialized */ }

const customToken = await admin.auth().createCustomToken('cv-patcher');
const signInBody  = JSON.stringify({ token: customToken, returnSecureToken: true });
const signInResp  = await httpsReq({
  hostname: 'identitytoolkit.googleapis.com',
  path: `/v1/accounts:signInWithCustomToken?key=${FIREBASE_API_KEY}`,
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(signInBody) },
}, signInBody);

if (signInResp.status !== 200) {
  console.error('❌  Failed to get ID token:', signInResp.body); process.exit(1);
}
const { idToken } = JSON.parse(signInResp.body);
console.log('🔑  ID token obtained.');

// ── Read current Firestore to get storagePath ─────────────────────────────────
const db      = admin.firestore();
const snap    = await db.doc('site/content').get();
const resume  = snap.data()?.about?.resume;

if (!resume?.storagePath) {
  console.error('❌  No resume found in Firestore. Run upload-cv.mjs first.'); process.exit(1);
}

const { storagePath } = resume;
const encodedPath     = encodeURIComponent(storagePath);
console.log('📄  Storage path:', storagePath);

// ── Patch Content-Disposition + keep existing download token ──────────────────
// First, get current metadata to preserve the download token
const getMeta = await httpsReq({
  hostname: 'firebasestorage.googleapis.com',
  path: `/v0/b/${encodeURIComponent(BUCKET)}/o/${encodedPath}`,
  method: 'GET',
  headers: { Authorization: `Firebase ${idToken}` },
});

const currentMeta  = getMeta.status === 200 ? JSON.parse(getMeta.body) : {};
const existingToken = currentMeta.metadata?.firebaseStorageDownloadTokens;

const patchBody = JSON.stringify({
  contentDisposition: `attachment; filename="${CV_FILENAME}"`,
  contentType: 'application/pdf',
  ...(existingToken ? { metadata: { firebaseStorageDownloadTokens: existingToken } } : {}),
});

const patchResp = await httpsReq({
  hostname: 'firebasestorage.googleapis.com',
  path: `/v0/b/${encodeURIComponent(BUCKET)}/o/${encodedPath}`,
  method: 'PATCH',
  headers: {
    Authorization: `Firebase ${idToken}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(patchBody),
  },
}, patchBody);

if (patchResp.status !== 200) {
  console.error(`❌  PATCH failed (HTTP ${patchResp.status}):`, patchResp.body); process.exit(1);
}
console.log('✓   Content-Disposition set to attachment.');

// ── Build download URL and save to Firestore ──────────────────────────────────
const downloadToken = existingToken ?? JSON.parse(patchResp.body).metadata?.firebaseStorageDownloadTokens;
const downloadUrl   = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(BUCKET)}/o/${encodedPath}?alt=media&token=${downloadToken}`;

await db.doc('site/content').update({
  'about.resume.downloadUrl': downloadUrl,
});
console.log('✓   Firestore updated with downloadUrl.');

console.log('\n🎉  Done! Download URL saved. Refresh your portfolio and try the button.\n');
process.exit(0);
