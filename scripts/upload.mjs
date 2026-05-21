#!/usr/bin/env node
/**
 * Upload one or more local images to Volcano veImageX.
 *
 * Usage:
 *   node scripts/upload.mjs <file> [<file> ...]
 *   node scripts/upload.mjs ~/path/to/photos/*.jpg
 *
 * Reads .env.local (gitignored) for:
 *   VOLC_ACCESS_KEY_ID
 *   VOLC_SECRET_ACCESS_KEY
 *   VOLC_REGION              (default: cn-north-1)
 *   VEIMAGEX_SERVICE_ID      (from veImageX console)
 *   VEIMAGEX_KEY_PREFIX      (optional folder prefix, e.g. "letters/")
 *
 * Prints, for each uploaded file:
 *   <local_path> -> <store_key>
 *
 * The store key is what you paste into the `image:` frontmatter field
 * in src/content/photos/*.md.
 */

import { readFile, stat } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import { createHash, createHmac } from 'node:crypto';

// ── env loading (zero deps) ─────────────────────────────────────────
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[m[1]]) process.env[m[1]] = v;
  }
}

const AK = required('VOLC_ACCESS_KEY_ID');
const SK = required('VOLC_SECRET_ACCESS_KEY');
const REGION = process.env.VOLC_REGION || 'cn-north-1';
const SERVICE_ID = required('VEIMAGEX_SERVICE_ID');
const KEY_PREFIX = (process.env.VEIMAGEX_KEY_PREFIX || '').replace(/^\/|\/$/g, '');

function required(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing ${name} in .env.local`);
    process.exit(1);
  }
  return v;
}

// ── Volcano Engine Signature V4 ─────────────────────────────────────
// Reference: https://www.volcengine.com/docs/6369/67269
const SERVICE = 'imagex';
const HOST = `${SERVICE}.volcengineapi.com`;

function hex(buf) {
  return Buffer.from(buf).toString('hex');
}
function sha256(s) {
  return createHash('sha256').update(s).digest();
}
function hmac(key, s) {
  return createHmac('sha256', key).update(s).digest();
}

function signRequest({ method, query, headers, body }) {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const dateStamp = amzDate.slice(0, 8);

  headers['Host'] = HOST;
  headers['X-Date'] = amzDate;
  headers['Content-Type'] = headers['Content-Type'] || 'application/json';

  const payloadHash = hex(sha256(body || ''));
  headers['X-Content-Sha256'] = payloadHash;

  const canonicalQuery = Object.keys(query)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(query[k])}`)
    .join('&');

  const signedHeaders = ['content-type', 'host', 'x-content-sha256', 'x-date'];
  const canonicalHeaders = signedHeaders.map((h) => `${h}:${headers[headerCase(h)] ?? ''}\n`).join('');
  const signedHeadersStr = signedHeaders.join(';');

  const canonicalRequest = [method, '/', canonicalQuery, canonicalHeaders, signedHeadersStr, payloadHash].join('\n');

  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/request`;
  const stringToSign = ['HMAC-SHA256', amzDate, credentialScope, hex(sha256(canonicalRequest))].join('\n');

  let kSigning = hmac(SK, dateStamp);
  kSigning = hmac(kSigning, REGION);
  kSigning = hmac(kSigning, SERVICE);
  kSigning = hmac(kSigning, 'request');
  const signature = hex(hmac(kSigning, stringToSign));

  headers['Authorization'] =
    `HMAC-SHA256 Credential=${AK}/${credentialScope}, SignedHeaders=${signedHeadersStr}, Signature=${signature}`;

  return { url: `https://${HOST}/?${canonicalQuery}`, headers };
}

function headerCase(lower) {
  return lower
    .split('-')
    .map((p) => (p === 'sha256' ? 'Sha256' : p[0].toUpperCase() + p.slice(1)))
    .join('-');
}

async function volcGet(action, params = {}) {
  const query = { Action: action, Version: '2018-08-01', ...params };
  const { url, headers } = signRequest({ method: 'GET', query, headers: {}, body: '' });
  const r = await fetch(url, { method: 'GET', headers });
  const text = await r.text();
  let json;
  try { json = JSON.parse(text); } catch { throw new Error(`Non-JSON response from ${action}: ${text.slice(0, 200)}`); }
  if (json.ResponseMetadata?.Error) throw new Error(`${action} failed: ${JSON.stringify(json.ResponseMetadata.Error)}`);
  return json.Result;
}

// ── Upload one file ─────────────────────────────────────────────────
async function uploadOne(localPath) {
  const st = await stat(localPath);
  if (!st.isFile()) throw new Error(`${localPath} is not a file`);

  const ext = extname(localPath).toLowerCase().replace(/^\./, '') || 'jpg';
  const params = {
    ServiceId: SERVICE_ID,
    UploadNum: 1,
    FileExtension: ext,
  };
  if (KEY_PREFIX) params.StoreKeys = `${KEY_PREFIX}/${slug(basename(localPath, extname(localPath)))}.${ext}`;

  // 1. Apply
  const apply = await volcGet('ApplyImageUpload', params);
  const session = apply.SessionKey;
  const storeKey = apply.StoreInfos[0].StoreUri;
  const uploadHost = apply.UploadHosts[0];
  const auth = apply.StoreInfos[0].Auth;

  // 2. PUT bytes
  const bytes = await readFile(localPath);
  const putUrl = `https://${uploadHost}/${storeKey}`;
  const putRes = await fetch(putUrl, {
    method: 'PUT',
    headers: {
      'Authorization': auth,
      'Content-CRC32': computeCrc32(bytes).toString(16),
    },
    body: bytes,
  });
  if (!putRes.ok) throw new Error(`PUT failed: ${putRes.status} ${await putRes.text()}`);

  // 3. Commit
  await volcGet('CommitImageUpload', {
    ServiceId: SERVICE_ID,
    SessionKey: session,
  });

  return storeKey;
}

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// CRC32 (no external deps)
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c >>> 0;
  }
  return t;
})();
function computeCrc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// ── main ────────────────────────────────────────────────────────────
const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('Usage: node scripts/upload.mjs <file> [<file> ...]');
  process.exit(1);
}

for (const f of files) {
  try {
    const key = await uploadOne(f);
    console.log(`${f}  ->  ${key}`);
  } catch (e) {
    console.error(`FAIL ${f}: ${e.message}`);
    process.exitCode = 1;
  }
}
