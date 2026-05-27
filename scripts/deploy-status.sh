#!/usr/bin/env bash
set -euo pipefail

GITHUB_TOKEN="${GITHUB_TOKEN:?Missing GITHUB_TOKEN}"
ACTION="${1:?Missing action}"
ENVIRONMENT="${2:?Missing environment}"
DESCRIPTION="${3:-}"

REPO="$(git remote get-url origin | sed 's/.*github.com[:\/]//;s/\.git$//')"
SHA="$(git rev-parse HEAD)"
ID_FILE="/tmp/deploy-status-${ENVIRONMENT}.id"

case "$ACTION" in
  start)
    ID=$(curl -s -X POST \
      -H "Authorization: Bearer $GITHUB_TOKEN" \
      -H "Accept: application/vnd.github+json" \
      "https://api.github.com/repos/$REPO/deployments" \
      -d "{\"ref\":\"$SHA\",\"environment\":\"$ENVIRONMENT\",\"auto_merge\":false,\"required_contexts\":[],\"description\":\"${DESCRIPTION:-Deploying...}\"}" \
      | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))")

    if [ -z "$ID" ]; then
      >&2 echo "Failed to create deployment for $ENVIRONMENT"
      exit 1
    fi

    echo "$ID" > "$ID_FILE"
    echo "Created deployment #$ID for $ENVIRONMENT"
    ;;

  success|failure)
    if [ ! -f "$ID_FILE" ]; then
      >&2 echo "No deployment ID found for $ENVIRONMENT (missing $ID_FILE)"
      exit 1
    fi
    ID=$(cat "$ID_FILE")
    ;;

  *)
    >&2 echo "Usage: $0 <start|success|failure> <environment> [description]"
    exit 1
    ;;
esac

curl -s -X POST \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/$REPO/deployments/$ID/statuses" \
  -d "{\"state\":\"$ACTION\",\"description\":\"${DESCRIPTION:-$ACTION}\"}"

if [ "$ACTION" = "success" ] || [ "$ACTION" = "failure" ]; then
  rm -f "$ID_FILE"
fi
