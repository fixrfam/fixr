#!/usr/bin/env bash
# Deploys a Coolify application and waits for the deployment to finish.
# Usage: COOLIFY_URL=... COOLIFY_TOKEN=... coolify-deploy.sh <application uuid>
set -euo pipefail
uuid="$1"
api() { curl -fsS -H "Authorization: Bearer $COOLIFY_TOKEN" "$@"; }

deployment=$(api -X POST "$COOLIFY_URL/api/v1/deploy?uuid=$uuid" | jq -r '.deployments[0].deployment_uuid')
echo "Deployment $deployment"

# Up to 30 minutes, a build with a cold cache installs every dependency.
for _ in $(seq 1 180); do
  status=$(api "$COOLIFY_URL/api/v1/deployments/$deployment" | jq -r '.status')
  echo "Status: $status"
  case "$status" in
    finished) exit 0 ;;
    failed|cancelled*) exit 1 ;;
  esac
  sleep 10
done
echo "::error::Timed out waiting for Coolify"
exit 1
