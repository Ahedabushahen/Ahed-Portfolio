/**
 * One-time CORS setup script for Firebase Storage.
 * Prerequisites:
 *   1. gcloud auth application-default login   (run this first in a terminal)
 *   2. node set-cors.mjs
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

let Storage;
try {
  ({ Storage } = require('@google-cloud/storage'));
} catch {
  console.error('Missing dependency. Run: npm install --save-dev @google-cloud/storage');
  process.exit(1);
}

const BUCKET   = 'my-portfolio-fa015.firebasestorage.app';
const PROJECT  = 'my-portfolio-fa015';

const CORS = [
  {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'https://my-portfolio-fa015.web.app',
      'https://my-portfolio-fa015.firebaseapp.com',
    ],
    method: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
    maxAgeSeconds: 3600,
    responseHeader: [
      'Content-Type',
      'Authorization',
      'Content-Length',
      'User-Agent',
      'x-goog-resumable',
      'x-goog-meta-firebaseStorageDownloadTokens',
    ],
  },
];

const storage = new Storage({ projectId: PROJECT });
const bucket  = storage.bucket(BUCKET);

console.log(`Applying CORS to gs://${BUCKET} ...`);

bucket.setCorsConfiguration(CORS)
  .then(() => {
    console.log('\n✓  CORS applied successfully!');
    console.log('   Allowed origins:', CORS[0].origin.join(', '));
    console.log('\nRefresh your browser and try the upload again.');
  })
  .catch((err) => {
    console.error('\n✗  Failed:', err.message);
    if (err.code === 403) {
      console.error('\n   Your account lacks Storage Admin permission.');
      console.error('   Grant it at: https://console.cloud.google.com/iam-admin/iam?project=' + PROJECT);
      console.error('   Then run this script again.');
    } else if (err.code === 401) {
      console.error('\n   Not authenticated. Run first:');
      console.error('   gcloud auth application-default login');
    }
  });
