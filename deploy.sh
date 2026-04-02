#!/bin/bash
set -e

SERVER="root@159.223.121.11"
REMOTE_DIR="/root/websites/amadeus"
STAMP=$(date +%s)

echo "==> Cache-busting with timestamp: $STAMP"

# Stamp local CSS/JS references in index.html (temporary, not committed)
cp index.html index.html.bak
sed -i '' "s|\.css\"|.css?v=$STAMP\"|g" index.html
sed -i '' "s|\.js\"|.js?v=$STAMP\"|g" index.html

echo "==> Syncing files to $SERVER..."
rsync -avz --delete \
  --exclude='.git' \
  --exclude='reference' \
  --exclude='plans' \
  --exclude='deploy.sh' \
  --exclude='index.html.bak' \
  --exclude='api/.env' \
  --exclude='api/node_modules' \
  --exclude='api/data' \
  ./ "$SERVER:$REMOTE_DIR/"

# Restore original index.html
mv index.html.bak index.html

echo "==> Rebuilding container..."
ssh "$SERVER" "cd $REMOTE_DIR && docker compose up -d --build"

echo "==> Verifying..."
STATUS=$(curl -s -o /dev/null -w '%{http_code}' https://www.agentemaster.com)
REDIRECT=$(curl -s -o /dev/null -w '%{http_code}' https://agentemaster.com)
echo "    www: HTTP $STATUS (expect 200)"
echo "    non-www: HTTP $REDIRECT (expect 301)"

if [ "$STATUS" = "200" ] && [ "$REDIRECT" = "301" ]; then
  echo "==> Deploy complete! Cache busted with v=$STAMP"
else
  echo "==> WARNING: www=$STATUS, redirect=$REDIRECT"
fi
