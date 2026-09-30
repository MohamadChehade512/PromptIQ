#!/usr/bin/env bash
# Build the web app and publish it to S3 + CloudFront (see docs/deploy-aws.md).
#
#   PG_BUCKET=promptiq-web-xyz PG_DISTRIBUTION_ID=E123ABC ./scripts/deploy-web.sh
#
# Uses your current AWS credentials (e.g. AWS_PROFILE=promptiq after `aws sso login`).
set -euo pipefail

: "${PG_BUCKET:?Set PG_BUCKET to the S3 bucket name}"
: "${PG_DISTRIBUTION_ID:?Set PG_DISTRIBUTION_ID to the CloudFront distribution ID}"

cd "$(dirname "$0")/.."
DIST=apps/web/dist
IMMUTABLE="public,max-age=31536000,immutable"

echo "→ Checking and building"
pnpm check
pnpm --filter @promptgenius/web build

echo "→ Uploading hashed assets (cached for a year)"
aws s3 sync "$DIST/assets" "s3://$PG_BUCKET/assets" \
  --exclude "*.mjs" --cache-control "$IMMUTABLE"
# Browsers only run module scripts served as JavaScript; S3 can't be trusted to guess .mjs.
aws s3 sync "$DIST/assets" "s3://$PG_BUCKET/assets" \
  --exclude "*" --include "*.mjs" --content-type "text/javascript" --cache-control "$IMMUTABLE"

echo "→ Uploading index.html and root files (always revalidated)"
aws s3 sync "$DIST" "s3://$PG_BUCKET" \
  --exclude "assets/*" --cache-control "no-cache" --delete

echo "→ Removing assets from older builds"
aws s3 sync "$DIST/assets" "s3://$PG_BUCKET/assets" --delete --exclude "*.mjs"

echo "→ Telling CloudFront to fetch the new index.html"
aws cloudfront create-invalidation --distribution-id "$PG_DISTRIBUTION_ID" \
  --paths "/index.html" "/favicon.svg" "/logo.svg" "/logo-mark.svg" \
  --query 'Invalidation.Id' --output text

echo "✓ Deployed. It can take a minute or two to show up everywhere."
