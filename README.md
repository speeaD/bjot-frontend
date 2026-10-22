This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## CMS media uploads

The staff and testimonial editors at `/cms` and Study Hub image editor upload public media to Cloudflare R2. Configure a bucket with a public custom domain (for example `https://media.example.com`) and create an R2 API token with **Object Read & Write** access scoped to that bucket. Set these server-only environment variables in the frontend's Vercel project and in `.env.local` for local development:

```text
R2_ACCOUNT_ID=<Cloudflare account ID>
R2_BUCKET_NAME=<bucket name>
R2_ACCESS_KEY_ID=<R2 API token access key ID>
R2_SECRET_ACCESS_KEY=<R2 API token secret access key>
R2_PUBLIC_URL=https://media.example.com
R2_JURISDICTION=us
```

Set `R2_JURISDICTION` to `us`, `eu`, or `fedramp` for a jurisdictional bucket; omit it for a default bucket. This bucket uses `us`. Do not give the keys a `NEXT_PUBLIC_` prefix. Set the variables for each Vercel environment that needs uploads, then redeploy. `R2_PUBLIC_URL` must be the root HTTPS address serving the bucket contents; the `r2.dev` development URL is not intended for production traffic.

An upload response of `403 AccessDenied` means R2 rejected the write. Check that the access key and secret belong to an R2 **Object Read & Write** token scoped to this bucket, and that `R2_JURISDICTION` matches the bucket. Generate the R2 S3 access key pair from the R2 API Tokens page; a general Cloudflare API token is not an S3 secret access key.

Videos upload directly from the browser to R2. Allow the admin site's exact origins in the R2 bucket CORS settings for video uploads. Replace the example origin with your actual admin domain (and add your local origin if developing locally):

```json
[
  {
    "AllowedOrigins": ["https://admin.example.com", "http://localhost:3000"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

The upload endpoints verify the signed-in admin with the backend. Staff and student photos and Study Hub images accept JPG, PNG, or WebP up to 4 MB and upload through the frontend server to R2, so image uploads do not depend on browser CORS. Testimonial videos accept MP4 or WebM up to 100 MB and upload directly from the browser with a five-minute signed R2 URL. Save the CMS record after uploading to publish its new URL. Existing hosted media URLs can still be entered directly. All uploaded media is public, so do not use this feature for private student data.

In Study Materials, a text or passage item can include an optional uploaded diagram and a required description. Apply the backend `20261022000000_add_study_material_diagrams` Prisma migration before deploying the updated backend and student site.

To migrate existing Vercel Blob URLs in staff, testimonials, and Study Hub images, run the migration script from this frontend checkout with the sibling `bjot-backend` checkout present. It reads `DATABASE_URL` from the backend environment and the R2 variables above. Run without `--apply` to count references, then run with `--apply` to copy each file, verify its R2 object and public URL, and update the matching database field:

```bash
node --env-file=../bjot-backend/.env scripts/migrate-blob-media.mjs
node --env-file=../bjot-backend/.env --env-file=.env.local scripts/migrate-blob-media.mjs --apply
```

Put the R2 variables in `.env.local` before the apply command, or supply them through your shell environment. The script never deletes old Blob objects and can be rerun after failures. If the Blob transfer cap prevents downloading an old file, that record keeps its old URL until the source becomes available or you provide a local original.

If Blob returns 403, create a mapping template, fill each `localFile` with the path to the matching original photo or video, then apply using the map. Leave `localFile` empty for any asset you cannot recover yet:

```bash
node --env-file=../bjot-backend/.env scripts/migrate-blob-media.mjs --export-map=/private/tmp/bjot-media-map.json
node --env-file=../bjot-backend/.env --env-file=.env.local scripts/migrate-blob-media.mjs --source-map=/private/tmp/bjot-media-map.json --apply
```

## Topic test links

Admins create topic tests from a subject's Topics screen by selecting questions. Set `NEXT_PUBLIC_STUDENT_SITE_URL` to the student site's origin to prefill the link field, or enter the origin in the topic test dialog. The browser remembers a manually entered origin. Apply the backend `add_topic_tests` Prisma migration before using this feature.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
