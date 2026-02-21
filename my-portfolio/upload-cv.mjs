/**
 * CV upload — gets a Firebase ID token via custom token exchange,
 * then uploads directly to Firebase Storage REST API (bypasses browser CORS).
 * Run: node upload-cv.mjs
 */
import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import https from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require   = createRequire(import.meta.url);

const BUCKET           = 'my-portfolio-fa015.firebasestorage.app';
const CV_FILENAME      = 'Ahed_Abu_Shahen_CV.pdf';
const LOCAL_PDF        = resolve(__dirname, 'public/assets/cv.pdf');
const SERVICE_ACCOUNT  = resolve(__dirname, 'service-account.json');
const FIREBASE_API_KEY = 'AIzaSyC5EuMcwGRwaVPLCbQaFodPzlXsLfS9yLc';
const PROJECT          = 'my-portfolio-fa015';

// ── Validate ──────────────────────────────────────────────────────────────────
if (!existsSync(SERVICE_ACCOUNT)) { console.error('❌  service-account.json not found'); process.exit(1); }
if (!existsSync(LOCAL_PDF))        { console.error('❌  CV not found:', LOCAL_PDF);        process.exit(1); }
const fileBytes = readFileSync(LOCAL_PDF);
console.log(`📄  CV: ${(fileBytes.length / 1024).toFixed(0)} KB`);

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

// ── Step 1: Get Firebase ID token via custom token exchange ───────────────────
console.log('🔑  Getting Firebase ID token...');

// Init firebase-admin to create a custom token
let admin;
try { admin = (await import('firebase-admin')).default; }
catch { console.error('❌  Run: npm install --save-dev firebase-admin'); process.exit(1); }

const sa = JSON.parse(readFileSync(SERVICE_ACCOUNT, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(sa),
});

// Create a custom token (signed JWT using service account key)
const customToken = await admin.auth().createCustomToken('cv-uploader');

// Exchange custom token for Firebase ID token via REST
const signInBody = JSON.stringify({ token: customToken, returnSecureToken: true });
const signInResp = await httpsReq({
  hostname: 'identitytoolkit.googleapis.com',
  path: `/v1/accounts:signInWithCustomToken?key=${FIREBASE_API_KEY}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(signInBody),
  },
}, signInBody);

if (signInResp.status !== 200) {
  console.error('❌  Failed to get ID token:', signInResp.body);
  process.exit(1);
}
const { idToken } = JSON.parse(signInResp.body);
console.log('✓   Firebase ID token obtained.\n');

// ── Step 2: Upload via Firebase Storage REST API ──────────────────────────────
const storagePath   = `cv/${Date.now()}-cv.pdf`;
const encodedPath   = encodeURIComponent(storagePath);
const downloadToken = randomUUID();

console.log(`⬆️   Uploading → gs://${BUCKET}/${storagePath}`);

const uploadResp = await httpsReq({
  hostname: 'firebasestorage.googleapis.com',
  path: `/v0/b/${encodeURIComponent(BUCKET)}/o?name=${encodedPath}&uploadType=media`,
  method: 'POST',
  headers: {
    Authorization: `Firebase ${idToken}`,
    'Content-Type': 'application/pdf',
    'Content-Length': fileBytes.length,
  },
}, fileBytes);

if (uploadResp.status !== 200) {
  console.error(`❌  Upload failed (HTTP ${uploadResp.status}):\n${uploadResp.body}`);
  process.exit(1);
}
const uploaded = JSON.parse(uploadResp.body);
console.log('✓   Uploaded:', uploaded.name);

// ── Step 3: Patch download token ──────────────────────────────────────────────
const patchBody = JSON.stringify({ metadata: { firebaseStorageDownloadTokens: downloadToken } });
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

const finalToken  = patchResp.status === 200
  ? downloadToken
  : (uploaded.metadata?.firebaseStorageDownloadTokens ?? downloadToken);
const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(BUCKET)}/o/${encodedPath}?alt=media&token=${finalToken}`;
console.log('✓   Download token set.');

// ── Step 4: Update Firestore via firebase-admin ───────────────────────────────
console.log('📝  Updating Firestore...');

const db     = admin.firestore();
const docRef = db.doc('site/content');
const snap   = await docRef.get();

const resumeMeta = {
  storagePath,
  fileName:  CV_FILENAME,
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
};

if (snap.exists) {
  await docRef.update({ 'about.resume': resumeMeta });
} else {
  await docRef.set({ about: { resume: resumeMeta } }, { merge: true });
}

console.log('✓   Firestore updated.\n');
console.log('🎉  Done! Your portfolio now serves the CV from Firebase Storage.');
console.log('    Storage path:', storagePath);
console.log('    File name   :', CV_FILENAME);
console.log('\n⚠️   Delete service-account.json after you are done.\n');
process.exit(0);
