# Hosting Prompt IQ on AWS

This puts the website live on **S3 + CloudFront** over HTTPS. It's the first half of Phase 3
(PLAN.md §3.3): the site runs fully in the browser, and the API (exact Claude/Gemini counts and
the paid rewrite) stays off for now.

What works publicly: scoring and suggestions, token/cost/context estimates, file attachments,
exact ChatGPT counts (local tokenizer), terms, tutorial, light/dark mode. Claude and Gemini counts
show as estimates, and the rewrite button says it's unavailable. That also satisfies the hard
rule: **no public paid rewrite before accounts (Phase 2)**.

Cost at low traffic: about **$0–1/month** (CloudFront's free tier covers 1 TB and 10M requests a
month; S3 storage is a few cents).

---

## 1. Set up your AWS account (once)

1. Sign in to the AWS console as the **root user** and turn on **MFA**
   (account menu → Security credentials → Assign MFA device).
2. Create a day-to-day admin login so you don't use root:
   - Open **IAM Identity Center** → Enable (pick region **ca-central-1**).
   - **Users** → Add user (your email).
   - **Permission sets** → Create → Predefined → `AdministratorAccess`.
   - **AWS accounts** → select your account → Assign users → your user + that permission set.
   - Accept the email invite and set up MFA for this user too.
3. Add a **budget alarm**: Billing and Cost Management → **Budgets** → Create budget →
   Monthly cost budget → e.g. **$10** → email alerts at 80% (actual) and 100% (forecasted).

## 2. Log in from your Mac (once, then when the session expires)

The AWS CLI is already installed.

```sh
aws configure sso
#   SSO session name: promptiq
#   SSO start URL:    (the "AWS access portal URL" from IAM Identity Center → Dashboard)
#   SSO region:       ca-central-1
#   Pick your account and the AdministratorAccess role
#   Default region:   ca-central-1
#   Profile name:     promptiq

export AWS_PROFILE=promptiq
aws sso login
aws sts get-caller-identity   # shows your account ID if it worked
```

## 3. Create the S3 bucket (private)

Bucket names are global, so add something unique:

```sh
export PG_BUCKET=promptiq-web-$(aws sts get-caller-identity --query Account --output text)

aws s3api create-bucket --bucket "$PG_BUCKET" --region ca-central-1 \
  --create-bucket-configuration LocationConstraint=ca-central-1

# Keep it private (the default) and keep old versions so you can roll back.
aws s3api put-public-access-block --bucket "$PG_BUCKET" \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
aws s3api put-bucket-versioning --bucket "$PG_BUCKET" --versioning-configuration Status=Enabled
```

Don't turn on "static website hosting" for the bucket; CloudFront reads it privately.

## 4. Create the security-headers policy

CloudFront console → **Policies** → **Response headers** → **Create response headers policy**:

- Name: `promptiq-security`
- **Strict-Transport-Security**: on, max-age `63072000`, include subdomains, override origin.
- **X-Content-Type-Options**: on. **X-Frame-Options**: `DENY`.
- **Referrer-Policy**: `strict-origin-when-cross-origin`.
- **Content-Security-Policy**: on, override origin, value:

  ```
  default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests
  ```

  This exact policy was tested against the production build (terms, tutorial, PDF/Word/image
  files, the ChatGPT tokenizer): no violations. `'unsafe-inline'` is for **styles only** (React
  sets element positions and bar widths as inline styles); scripts stay locked to the site's own
  files. `worker-src 'self'` lets the PDF reader run.

## 5. Create the CloudFront distribution

CloudFront console → **Create distribution**. Settings (names vary slightly between console
versions):

| Setting                 | Value                                                                                                                |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Origin                  | Amazon S3 → your `promptiq-web-…` bucket (the bucket, **not** a website endpoint)                                    |
| Origin access           | **Origin access control** (create a new OAC, sign requests). Allow CloudFront to update the bucket policy if offered |
| Viewer protocol policy  | **Redirect HTTP to HTTPS**                                                                                           |
| Allowed methods         | GET, HEAD                                                                                                            |
| Cache policy            | `CachingOptimized`                                                                                                   |
| Response headers policy | `promptiq-security` (from step 4)                                                                                    |
| Default root object     | `index.html`                                                                                                         |
| Price class             | North America and Europe (cheapest; change later if you have users elsewhere)                                        |
| WAF                     | Off for now (about $6–10/month). Turn it on when the API or rewrite goes public                                      |

After creating it:

- If the console shows a **bucket policy to copy**, paste it into S3 → your bucket → Permissions →
  Bucket policy. (Newer consoles apply it for you; check the bucket policy mentions
  `cloudfront.amazonaws.com` and your distribution's ARN.)
- Note the **Distribution ID** (e.g. `E1ABC2DEF3GHIJ`) and the **domain name**
  (e.g. `d1abc234.cloudfront.net`).

## 6. Deploy

```sh
export AWS_PROFILE=promptiq
export PG_BUCKET=promptiq-web-123456789012      # from step 3
export PG_DISTRIBUTION_ID=E1ABC2DEF3GHIJ             # from step 5
pnpm deploy:web
```

The script runs `pnpm check`, builds, uploads, and invalidates `index.html`. It sets the one
thing S3 can get wrong: the PDF reader's `.mjs` file must be served as `text/javascript`, or
every PDF fails with "This file couldn't be read".

Hashed files in `assets/` are cached for a year (their names change every build);
`index.html` and the logos are revalidated on every visit, so new deploys show up right away.

## 7. Check the live site

Open `https://<your-distribution>.cloudfront.net` and go through:

- [ ] Loading screen → terms → tutorial.
- [ ] Type a prompt: score and colours update.
- [ ] Attach a PDF, a Word file and an image: each shows pages/size and tokens (not "couldn't be read").
- [ ] Switch to ChatGPT: the token badge says `tokenizer`.
- [ ] Light/dark toggle; phone-width layout.
- [ ] Browser console (F12): no "Content Security Policy" errors. One failed `/api/health`
      request is expected until the API is hosted.
- [ ] Response headers (F12 → Network → the document): `content-security-policy`,
      `strict-transport-security` present.

## 8. Updating and rolling back

- **Update:** commit, then `pnpm deploy:web`.
- **Roll back:** check out the previous commit and deploy it again. (Bucket versioning also keeps
  older copies of every file.)

## 9. Custom domain (when you buy one)

1. Route 53 → Registered domains → register it (about $15/year for `.com`).
2. **ACM** → switch region to **us-east-1** (CloudFront only uses certificates from there) →
   request a public certificate for `yourdomain.com` and `www.yourdomain.com` → DNS validation →
   "Create records in Route 53".
3. CloudFront → your distribution → Edit → **Alternate domain names**: both names; **Custom SSL
   certificate**: the ACM one.
4. Route 53 → your hosted zone → create **A** and **AAAA** records → Alias → your CloudFront
   distribution (for both names).

## Next: the API (Phase 3, part 2)

Exact Claude/Gemini counts need the API on AWS: API Gateway + Lambda, keys in Secrets Manager,
DynamoDB for rate limits and the $2/day spend cap, deployed with CDK from `infra/`, plus GitHub
Actions deploys. That needs code changes (a Lambda entry point and DynamoDB stores). The paid
rewrite stays behind a switch that's off until Phase 2 accounts exist.
