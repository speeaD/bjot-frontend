import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

// The CMS database client belongs to the sibling bjot-backend checkout.
const requireBackend = createRequire(new URL('../../bjot-backend/package.json', import.meta.url));
const { PrismaClient } = requireBackend('@prisma/client');
const prisma = new PrismaClient();
const apply = process.argv.includes('--apply');
const required = ['DATABASE_URL', 'R2_ACCOUNT_ID', 'R2_BUCKET_NAME', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_PUBLIC_URL'];
const option = (name) => process.argv.find((argument) => argument.startsWith(`${name}=`))?.slice(name.length + 1);

function isBlobUrl(value) {
  if (typeof value !== 'string' || !value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (url.hostname === 'blob.vercel-storage.com' || url.hostname.endsWith('.blob.vercel-storage.com'));
  } catch { return false; }
}

function contentTypeFor(kind, sourceName, receivedType) {
  const allowed = kind === 'video' ? ['video/mp4', 'video/webm'] : ['image/jpeg', 'image/png', 'image/webp'];
  const received = receivedType?.split(';')[0].toLowerCase();
  if (received && allowed.includes(received)) return received;
  const pathname = sourceName.toLowerCase();
  const suffixes = kind === 'video'
    ? { '.mp4': 'video/mp4', '.webm': 'video/webm' }
    : { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
  return Object.entries(suffixes).find(([suffix]) => pathname.endsWith(suffix))?.[1] ?? null;
}

async function main() {
  const records = await Promise.all([
    prisma.staffMember.findMany({ select: { id: true, name: true, imageUrl: true } }),
    prisma.testimonial.findMany({ select: { id: true, studentName: true, imageUrl: true, videoUrl: true } }),
    prisma.studyMaterial.findMany({ where: { type: 'image' }, select: { id: true, title: true, content: true } }),
  ]);
  const references = [
    ...records[0].map((record) => ({ model: 'staffMember', id: record.id, label: record.name, field: 'imageUrl', url: record.imageUrl, kind: 'image' })),
    ...records[1].flatMap((record) => [
      { model: 'testimonial', id: record.id, label: record.studentName, field: 'imageUrl', url: record.imageUrl, kind: 'image' },
      { model: 'testimonial', id: record.id, label: record.studentName, field: 'videoUrl', url: record.videoUrl, kind: 'video' },
    ]),
    ...records[2].map((record) => ({ model: 'studyMaterial', id: record.id, label: record.title, field: 'content', url: record.content, kind: 'image' })),
  ].filter((record) => isBlobUrl(record.url));
  console.log(`Found ${references.length} saved Vercel Blob URLs (${new Set(references.map((record) => record.url)).size} unique files).`);
  const exportPath = option('--export-map');
  if (exportPath) {
    const entries = references.map(({ model, id, label, field, url }) => ({ model, id, label, field, sourceUrl: url, localFile: '' }));
    await writeFile(exportPath, `${JSON.stringify(entries, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
    console.log(`Wrote local-file mapping template to ${exportPath}`);
  }
  if (process.argv.includes('--check-sources')) {
    const statusCounts = new Map();
    for (const url of new Set(references.map((record) => record.url))) {
      try {
        const response = await fetch(url, { headers: { Range: 'bytes=0-0' }, redirect: 'error', signal: AbortSignal.timeout(15000) });
        statusCounts.set(response.status, (statusCounts.get(response.status) ?? 0) + 1);
        await response.body?.cancel();
      } catch {
        statusCounts.set('network error', (statusCounts.get('network error') ?? 0) + 1);
      }
    }
    console.log(`Source download checks: ${[...statusCounts].map(([status, count]) => `${status}: ${count}`).join(', ') || 'none'}`);
  }
  if (!apply) {
    console.log('Preview only. Configure the R2 variables and rerun with --apply to copy files and update saved URLs.');
    return;
  }
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  if (!/^[a-f0-9]{32}$/i.test(process.env.R2_ACCOUNT_ID) || !/^[a-z0-9][a-z0-9.-]*$/.test(process.env.R2_BUCKET_NAME)) {
    throw new Error('R2 account ID or bucket name is invalid.');
  }
  const publicBase = new URL(process.env.R2_PUBLIC_URL);
  if (publicBase.protocol !== 'https:' || publicBase.pathname !== '/' || publicBase.search || publicBase.hash || publicBase.username || publicBase.password) {
    throw new Error('R2_PUBLIC_URL must be a public HTTPS base URL.');
  }
  const client = new S3Client({
    region: 'auto', endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    forcePathStyle: true, requestChecksumCalculation: 'WHEN_REQUIRED',
    credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
  });
  const sourceMapPath = option('--source-map');
  const sourceEntries = sourceMapPath ? JSON.parse(await readFile(sourceMapPath, 'utf8')) : [];
  if (!Array.isArray(sourceEntries)) throw new Error('Source map must be a JSON array.');
  const sourceFiles = new Map(sourceEntries.filter((entry) => entry?.sourceUrl && entry?.localFile).map((entry) => [entry.sourceUrl, resolve(dirname(sourceMapPath), entry.localFile)]));
  const migrated = new Map();
  let updated = 0;
  let failed = 0;
  try {
    for (const reference of references) {
      try {
        let newUrl = migrated.get(reference.url);
        if (!newUrl) {
          const localFile = sourceFiles.get(reference.url);
          let body;
          let contentType;
          if (localFile) {
            body = await readFile(localFile);
            contentType = contentTypeFor(reference.kind, localFile);
          } else {
            const source = await fetch(reference.url, { redirect: 'error', signal: AbortSignal.timeout(120000) });
            if (!source.ok) throw new Error(`Source download returned ${source.status}`);
            body = Buffer.from(await source.arrayBuffer());
            contentType = contentTypeFor(reference.kind, new URL(reference.url).pathname, source.headers.get('content-type'));
          }
          if (!contentType) throw new Error('Source has an unsupported media type');
          if (!body.length || body.length > 150 * 1024 * 1024) throw new Error('Source file is empty or over 150 MB');
          const basename = new URL(reference.url).pathname.split('/').pop()?.replace(/[^a-zA-Z0-9._-]/g, '-') || 'media';
          const hash = createHash('sha256').update(reference.url).digest('hex').slice(0, 20);
          const key = `cms/migrated/${reference.kind}/${hash}-${basename}`;
          await client.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key, Body: body, ContentType: contentType }));
          const head = await client.send(new HeadObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }));
          if (head.ContentLength !== body.length) throw new Error('R2 object length did not match the source');
          const base = publicBase.href.endsWith('/') ? publicBase.href : `${publicBase.href}/`;
          newUrl = new URL(key, base).href;
          const publicCheck = await fetch(newUrl, { method: 'HEAD', redirect: 'error', signal: AbortSignal.timeout(15000) });
          if (!publicCheck.ok) throw new Error(`R2 public URL returned ${publicCheck.status}`);
          migrated.set(reference.url, newUrl);
        }
        const result = await prisma[reference.model].updateMany({ where: { id: reference.id, [reference.field]: reference.url }, data: { [reference.field]: newUrl } });
        if (result.count !== 1) throw new Error('Saved URL changed during migration; no update made');
        updated++;
        console.log(`Updated ${reference.model}.${reference.field} for ${reference.id}`);
      } catch (error) {
        failed++;
        console.error(`Failed ${reference.model}.${reference.field} for ${reference.id}: ${error instanceof Error ? error.message : error}`);
      }
    }
  } finally { client.destroy(); }
  console.log(`Updated ${updated} saved URLs; ${failed} failed. Old Blob objects were not deleted.`);
  if (failed) process.exitCode = 1;
}

try { await main(); }
catch (error) { console.error(error); process.exitCode = 1; }
finally { await prisma.$disconnect(); }
