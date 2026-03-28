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
  ./ "$SERVER:$REMOTE_DIR/"

# Restore original index.html
mv index.html.bak index.html

echo "==> Rebuilding container..."
ssh "$SERVER" "cd $REMOTE_DIR && docker compose up -d --build"

echo "==> Verifying..."
STATUS=$(curl -s -o /dev/null -w '%{http_code}' https://amadeus.alfredo.re)
echo "    HTTP $STATUS"

if [ "$STATUS" = "200" ]; then
  echo "==> Deploy complete! Cache busted with v=$STAMP"
else
  echo "==> WARNING: Got HTTP $STATUS"
fi
