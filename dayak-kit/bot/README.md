# Dayak bot

## Run in 5 minutes
1. @BotFather → /newbot → copy token. Set the bot's description to the AM text from `docs/posts.md`.
2. `cp .env.example .env`, fill BOT_TOKEN. Send `/id` to the bot once it runs to get your and your sister's ids → ADMIN_CHAT_IDS.
3. `pip install -r requirements.txt && set -a && . ./.env && set +a && python main.py`
   Without Google credentials it writes to `data/parents.csv` and `data/nannies.csv`.

## Google Sheets (do this before the public posts)
1. console.cloud.google.com → new project → enable "Google Sheets API" and "Google Drive API".
2. IAM → Service accounts → create → Keys → JSON → save as `service-account.json` next to main.py.
3. Create a Google Sheet, share it (Editor) with the service account email, copy the id from the URL into GOOGLE_SHEET_ID.
4. Restart. Tabs `parents` and `nannies` are created with headers. Your sister works directly in the sheet
   (columns status / matched_nanny / fee_paid / coordinator_notes on parents; interview_date / id_photo /
   ref1_checked / ref2_checked / vetted on nannies).

## Deploy (free tier is enough for 30 days)
Any always-on host works — Fly.io, Railway, a €4 Hetzner VPS: `docker build -t dayak . && docker run --env-file .env -v $PWD/service-account.json:/app/service-account.json dayak`.
Long polling, no webhook, no public URL needed.

## Metrics to pull weekly (from the sheet)
requests, matches (status=matched), paid (fee_paid=yes), backup_importance distribution,
source distribution, nannies: interviewed vs vetted vs refused-refs.
