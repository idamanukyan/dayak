#!/usr/bin/env bash
# Nightly Postgres backup → gzip → S3-compatible bucket (Cloudflare R2).
# Cron example (2:30 daily): 30 2 * * * /app/scripts/backup.sh >> /var/log/dayak-backup.log 2>&1
#
# Required env: DATABASE_URL, R2_BUCKET, and rclone configured OR AWS CLI env
# (S3_ENDPOINT/S3_ACCESS_KEY/S3_SECRET_KEY). This script uses the AWS CLI.
set -euo pipefail

TS="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="/tmp/dayak-${TS}.sql.gz"
BUCKET="${R2_BUCKET:?set R2_BUCKET}"
ENDPOINT="${S3_ENDPOINT:?set S3_ENDPOINT}"

echo "[backup] dumping database…"
pg_dump "${DATABASE_URL:?set DATABASE_URL}" | gzip > "$OUT"

echo "[backup] uploading to s3://${BUCKET}/backups/…"
AWS_ACCESS_KEY_ID="${S3_ACCESS_KEY:?}" AWS_SECRET_ACCESS_KEY="${S3_SECRET_KEY:?}" \
  aws s3 cp "$OUT" "s3://${BUCKET}/backups/dayak-${TS}.sql.gz" \
  --endpoint-url "$ENDPOINT"

rm -f "$OUT"
echo "[backup] done: dayak-${TS}.sql.gz"

# Retention: delete backups older than 30 days.
AWS_ACCESS_KEY_ID="${S3_ACCESS_KEY}" AWS_SECRET_ACCESS_KEY="${S3_SECRET_KEY}" \
  aws s3 ls "s3://${BUCKET}/backups/" --endpoint-url "$ENDPOINT" | while read -r line; do
  createDate=$(echo "$line" | awk '{print $1" "$2}')
  createTs=$(date -d "$createDate" +%s 2>/dev/null || echo 0)
  cutoff=$(date -d '30 days ago' +%s)
  if [ "$createTs" -lt "$cutoff" ] && [ "$createTs" -ne 0 ]; then
    file=$(echo "$line" | awk '{print $4}')
    AWS_ACCESS_KEY_ID="${S3_ACCESS_KEY}" AWS_SECRET_ACCESS_KEY="${S3_SECRET_KEY}" \
      aws s3 rm "s3://${BUCKET}/backups/${file}" --endpoint-url "$ENDPOINT"
    echo "[backup] pruned old backup: ${file}"
  fi
done
