#!/usr/bin/env bash
set -euo pipefail

GITHUB_TOKEN="${GITHUB_TOKEN:?Missing GITHUB_TOKEN}"
ACTION="${1:?Missing action}"
ENVIRONMENT="${2:?Missing environment}"
DESCRIPTION="${3:-}"

REPO="$(git remote get-url origin | sed 's/.*github.com[:\/]//;s/\.git$//')"
SHA="$(git rev-parse HEAD)"
ID_FILE="/tmp/deploy-status-${ENVIRONMENT}.id"

mark_status() {
  local state="$1"
  local description="${2:-$state}"
  local id="${3:-}"

  if [ -z "$id" ]; then
    id="$(cat "$ID_FILE" 2>/dev/null || true)"
  fi

  if [ -z "$id" ]; then
    >&2 echo "No deployment ID for $ENVIRONMENT, cannot mark as $state"
    return 1
  fi

  curl -s -X POST \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/$REPO/deployments/$id/statuses" \
    -d "{\"state\":\"$state\",\"description\":\"$description\"}"

  if [ "$state" = "success" ] || [ "$state" = "failure" ] || [ "$state" = "inactive" ]; then
    rm -f "$ID_FILE"
  fi
}

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
    mark_status pending "${DESCRIPTION:-Deploying...}" "$ID"
    ;;

  build)
    case "$ENVIRONMENT" in
      *-server)     BUILD_CMD="bun run build:server:ci" ;;
      *-workers)    BUILD_CMD="bun run build:workers:ci" ;;
      *)            >&2 echo "Unknown environment $ENVIRONMENT, cannot determine build command"; exit 1 ;;
    esac

    echo "Running: $BUILD_CMD"
    if eval "$BUILD_CMD"; then
      echo "Build succeeded"
    else
      mark_status failure "${DESCRIPTION:-Build failed}"
      exit 1
    fi
    ;;

  success|failure)
    mark_status "$ACTION" "${DESCRIPTION:-$ACTION}"
    ;;

  *)
    >&2 echo "Usage: $0 <start|build|success|failure> <environment> [description]"
    exit 1
    ;;
esac
