# Pooti Accounting

LINE OA-based branch bookkeeping for Pooti's 5-6 stores. Branch managers submit daily
income/expense via a LIFF form opened from a LINE Rich Menu; entries are written to
Google Sheets for audit, with a Looker Studio dashboard for the owner.

Full architecture, data model, and milestones: see the plan this was built from
(`~/.claude/plans/project-about-accounting-via-encapsulated-elephant.md`).

## Status

**M1 deployed.** NestJS webhook service (signature verification + stray-text reply)
is live on Cloud Run: `https://pooti-accounting-backend-740865262642.asia-southeast1.run.app`,
running as `sheets-writer@pooti-accounting.iam.gserviceaccount.com`. LINE webhook URL
configured and verified. `SheetsService` (M2/M3) was built early and verified against
the real spreadsheet (read + write both confirmed working). Remaining before M2: Rich
Menu + LIFF app.

## Before running anything: M0 setup checklist

These are manual steps in external consoles — nothing here to code yet:

- [x] **LINE Developers console** (developers.line.biz): Provider + Messaging API
      Channel created. Channel Secret and Channel Access Token are in local `.env`
      (not committed).
- [ ] **LIFF app**: add a LIFF app under the same channel (needed for M2, can do now
      or later — endpoint URL isn't final until the Vercel form exists).
- [ ] **LINE Official Account Manager**: turn off the default greeting/auto-reply
      message, turn on "Use webhook."
- [ ] Add the OA as a friend from your own LINE account so you can test it.
- [x] **GCP project + service account** — project `pooti-accounting` created under a
      dedicated Pooti Google account (kept separate from personal), billing linked
      (Individual account type) with a budget alert, Sheets API enabled, service
      account `sheets-writer@pooti-accounting.iam.gserviceaccount.com` created.
      Local key saved as `service-account.json` (gitignored, never commit this).
- [x] **Google Sheet** created (`GOOGLE_SHEET_ID` in `.env`), `Entries` and
      `BranchManagers` tabs correctly named and headered, shared with the service
      account as Editor. Verified: the app can read and write real rows.
- [ ] `gcloud` CLI not installed yet — needed for the Cloud Run deploy step (M1).
- [ ] **Vercel account** ready for the LIFF form (M2) — you already have this from
      `twon-next-nest`.

## GCP setup (first time walkthrough)

Why a service account instead of your own Google login: the backend needs to write
to the Sheet with no human present. A service account is a non-human Google identity
you create, share the Sheet with (like sharing a Google Doc with a coworker), and the
backend authenticates as. In production (Cloud Run) it needs no downloaded key at
all — the Cloud Run service just *runs as* that identity directly, which is both
simpler and more secure than managing a key file.

1. **Create the project.** Go to console.cloud.google.com → project dropdown (top
   left) → "New Project." Name it `pooti-accounting` (the actual Project ID will get
   a random suffix if that name is taken — that's fine, note whatever ID it lands
   on).
2. **Enable billing.** APIs & Services and Cloud Run both require a billing account
   attached, even though usage here stays within the free tier. Billing → link or
   create a billing account (needs a card). Immediately set a budget alert (Billing →
   Budgets & alerts → Create budget, e.g. alert at $1) so you get emailed if anything
   unexpected happens — cheap insurance given the free-to-start constraint.
3. **Enable the Sheets API.** APIs & Services → Library → search "Google Sheets API"
   → Enable.
4. **Create the service account.** IAM & Admin → Service Accounts → "Create Service
   Account." Name it e.g. `sheets-writer`. No project-level IAM role needed — Sheets
   API access is granted per-document by sharing the sheet directly (step 6), not
   through GCP IAM roles.
5. **(Local dev only, optional) Generate a key.** If you want to test `SheetsService`
   from your laptop before deploying: open the service account → Keys → Add Key →
   JSON. Save the downloaded file as `service-account.json` in this repo's root
   (already covered by `.gitignore` — verify with `git check-ignore -v
   service-account.json` before trusting that). Set `GOOGLE_APPLICATION_CREDENTIALS`
   in `.env` to its path. **Skip this entirely if you'd rather just test after
   deploying to Cloud Run** — production won't use a key file at all (see step 7).
6. **Share the Sheet with the service account.** Copy the service account's email
   (looks like `sheets-writer@pooti-accounting-xxxxx.iam.gserviceaccount.com`) from
   its detail page, then open the Google Sheet → Share → paste that email → Editor.
7. **At deploy time (M1), attach the service account to Cloud Run** via
   `gcloud run deploy --service-account sheets-writer@...` — no JSON key involved in
   production at all.
8. **Install the gcloud CLI locally** (needed for the M1 deploy step):
   `brew install --cask google-cloud-sdk`, then `gcloud init` and `gcloud auth login`
   to connect it to this project.

Report back once the service account exists and the Sheet is shared with its email —
that unblocks M2/M3 (`SheetsService`).

## Local development

```bash
npm install
cp .env.example .env   # fill in LINE_CHANNEL_SECRET and LINE_CHANNEL_ACCESS_TOKEN
npm run start:dev
```

The webhook listens on `POST /webhook`. LINE requires a public HTTPS URL, so local
testing needs a tunnel (e.g. `ngrok http 8080`) pointed at the LINE console's webhook
URL setting during development.

## Deploying to Cloud Run

```bash
gcloud auth login                          # pick the Pooti Google account
gcloud config set project pooti-accounting

gcloud run deploy pooti-accounting-backend \
  --source . \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --service-account sheets-writer@pooti-accounting.iam.gserviceaccount.com \
  --env-vars-file .env-vars-deploy.yaml   # LINE_CHANNEL_SECRET / LINE_CHANNEL_ACCESS_TOKEN / GOOGLE_SHEET_ID
                                            # (gitignored, delete after deploy — never commit it)
```

Note: `--service-account` is what lets Cloud Run write to the Sheet with no key file
— it runs *as* `sheets-writer@...` directly, using Application Default Credentials,
same code path as local dev but no JSON key involved in production.

**First-time-project snag**: on a brand-new GCP project, `--source` deploys can fail
with `PERMISSION_DENIED... default service account is missing required IAM
permissions` — Google no longer auto-grants this. Fix once per project:
```bash
gcloud projects add-iam-policy-binding pooti-accounting \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.builder"
```
(`PROJECT_NUMBER` is shown on the GCP project dashboard, or via `gcloud projects
describe pooti-accounting`.)

Once secrets grow (Phase 2), move them from the env-vars file into GCP Secret
Manager and reference with `--set-secrets` instead. Use the resulting `*.run.app`
URL + `/webhook` as the LINE Messaging API webhook URL (Developers Console →
channel → Messaging API tab → Webhook URL + "Use webhook" toggle + Verify).

**Current deployment**: `https://pooti-accounting-backend-740865262642.asia-southeast1.run.app`
