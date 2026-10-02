# Hosting Prompt IQ on AWS

This puts the website live on **S3 + CloudFront** over HTTPS. It's the first half of Phase 3
(PLAN.md §3.3): the site runs fully in the browser, and the API (exact Claude/Gemini counts and
the paid rewrite) stays off for now.

What works publicly: scoring and suggestions, token/cost/context estimates, file attachments,
exact ChatGPT counts (local tokenizer), terms, tutorial, light/dark mode. Claude and Gemini counts
show as estimates, and the rewrite button says it's unavailable. That also satisfies the hard
rule: **no public paid rewrite before accounts (Phase 2)**.

Cost at low traffic: about **$0–1/month**. CloudFront's always-free allowance covers 1 TB and
10M requests a month, and the site is a few MB in S3.

**Stays on the AWS Free plan.** Nothing here creates an AWS Organization, Control Tower or any
other step that moves a Free plan account to the paid plan (that expires Free Tier credits
immediately). In particular: **don't enable IAM Identity Center** on a Free plan account; it
creates an Organization. This guide uses a plain IAM user instead.

---

## 1. Set up your AWS account (once)

1. Sign in to the AWS console as the **root user** and turn on **MFA**
   (account menu → Security credentials → Assign MFA device).
2. Add a **budget alarm**: Billing and Cost Management → **Budgets** → Create budget →
   "Zero spend budget" (emails you the moment anything costs money) **and** a monthly cost
   budget of **$5** with email alerts. Budgets are free.
3. Create a day-to-day admin user so you don't use root:
   - **IAM** → **Users** → **Create user** → name `promptiq-admin`.
   - Tick **Provide user access to the AWS Management Console** → "I want to create an IAM user"
     → set a password.
   - Permissions: **Attach policies directly** → `AdministratorAccess` → Create.
   - Open the user → **Security credentials** → **Assign MFA device**.
   - Same tab → **Create access key** → "Command Line Interface (CLI)" → copy the Access key ID
     and Secret access key. They're shown once; never paste them into the project or commit them.

## 2. Log in from your Mac (once)

```sh
aws configure --profile promptiq
#   AWS Access Key ID:     (from step 1.3)
#   AWS Secret Access Key: (from step 1.3)
#   Default region name:   us-east-1
#   Default output format: json

export AWS_PROFILE=promptiq
aws sts get-caller-identity   # shows your account ID and promptiq-admin if it worked
```

The keys are stored in `~/.aws/credentials`, outside the project. If they ever leak, delete the
access key in IAM and create a new one.

## 3. Create the S3 bucket (private)

Bucket names are global, so add something unique:

```sh
export PG_BUCKET=promptiq-web-$(aws sts get-caller-identity --query Account --output text)

aws s3api create-bucket --bucket "$PG_BUCKET" --region us-east-1

# Keep it private (the default). No versioning: roll back by redeploying an older commit.
aws s3api put-public-access-block --bucket "$PG_BUCKET" \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

Don't turn on "static website hosting" for the bucket; CloudFront reads it privately.

## 4. Security headers

**CloudFront Free plan:** custom response headers policies need the Business plan. Pick the
managed **SecurityHeadersPolicy** on the default behavior instead (HSTS, nosniff,
X-Frame-Options, Referrer-Policy). The Content-Security-Policy below is already in the built
`index.html` as a `<meta>` tag (see `apps/web/vite.config.ts`), so nothing is lost.

On a paid plan you can create a custom policy instead:

CloudFront console → **Policies** → **Response headers** → **Create response headers policy**:

- Name: `promptiq-security`
- **Strict-Transport-Security**: on, max-age `63072000`, include subdomains, override origin.
- **X-Content-Type-Options**: on. **X-Frame-Options**: `DENY`.
- **Referrer-Policy**: `strict-origin-when-cross-origin`.
- **Content-Security-Policy**: on, override origin, value:

  ```
  default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests
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
| Pricing plan            | If offered: **Free** flat-rate plan, or pay-as-you-go (both $0 at this traffic). Not a paid flat-rate plan           |
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

## 8. Automatic deploys from GitHub (recommended)

`.github/workflows/deploy-web.yml` deploys `main` on every push (docs-only changes skipped), and
can be run by hand from the Actions tab. GitHub signs in to AWS with short-lived OIDC
credentials, so no AWS keys are stored in GitHub. All of this is free.

1. **IAM → Identity providers → Add provider** → OpenID Connect:
   - Provider URL: `https://token.actions.githubusercontent.com`
   - Audience: `sts.amazonaws.com`
2. **IAM → Roles → Create role** → Web identity:
   - Identity provider: `token.actions.githubusercontent.com`, audience `sts.amazonaws.com`
   - GitHub organization: `MohamadChehade512`, repository: `PromptIQ`, branch: `main`
   - Skip the permissions page, name it `promptiq-github-deploy`, create it.
   - Open the role → **Trust relationships → Edit trust policy**, and replace the `sub`
     condition with `"token.actions.githubusercontent.com:sub": "repo:MohamadChehade512/PromptIQ:environment:production"`
     (under `StringEquals`). The workflow deploys through the `production` environment, so
     GitHub identifies as that environment, not the branch; the console's branch condition
     fails with "Not authorized to perform sts:AssumeRoleWithWebIdentity".
   - Open the role → **Add permissions → Create inline policy → JSON**, paste (with your bucket,
     account ID and distribution ID), name it `deploy-web`:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": "s3:ListBucket",
         "Resource": "arn:aws:s3:::promptiq-web-097537979364"
       },
       {
         "Effect": "Allow",
         "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
         "Resource": "arn:aws:s3:::promptiq-web-097537979364/*"
       },
       {
         "Effect": "Allow",
         "Action": "cloudfront:CreateInvalidation",
         "Resource": "arn:aws:cloudfront::097537979364:distribution/E2FCHX4QWQP1ZA"
       }
     ]
   }
   ```

   - Copy the role's **ARN**.

3. **GitHub → repo Settings → Environments → New environment** `production` (optionally limit it
   to the `main` branch). Then **Settings → Secrets and variables → Actions → Variables** →
   add three repository variables (none of them are secret):
   - `AWS_DEPLOY_ROLE_ARN`: the role ARN
   - `PG_BUCKET`: `promptiq-web-097537979364`
   - `PG_DISTRIBUTION_ID`: `E2FCHX4QWQP1ZA`
4. Push to `main`, or **Actions → Deploy web → Run workflow**.

## 9. Updating and rolling back

- **Update:** push to `main` (or run `pnpm deploy:web` from your Mac).
- **Roll back:** `git revert` the bad commit and push, or run the workflow on an older commit.

## 10. Custom domain (optional, not free)

A domain costs about $15/year and a Route 53 hosted zone $0.50/month; the HTTPS certificate is
free. Skip this to stay at $0.

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
