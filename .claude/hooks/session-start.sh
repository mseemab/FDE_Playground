#!/bin/bash
# SessionStart hook for Claude Code on the web: gets a fresh cloud VM ready to run
# `pnpm check`, Playwright and local Supabase. Idempotent; does nothing on local machines.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(pwd)}"
NODE_MAJOR="$(tr -d '[:space:]v' < .nvmrc)"

# 1. Node from .nvmrc. The VM ships another Node first on PATH, so install via `n`
#    (to /usr/local) and put /usr/local/bin first for the rest of the session.
if ! /usr/local/bin/node --version 2>/dev/null | grep -q "^v${NODE_MAJOR}\."; then
  npm install -g n >/dev/null 2>&1
  n "${NODE_MAJOR}" >/dev/null
fi
export PATH="/usr/local/bin:${PATH}"

# 2. pnpm at the version pinned in package.json#packageManager.
if ! command -v corepack >/dev/null 2>&1 || ! corepack --version >/dev/null 2>&1; then
  npm install -g corepack@latest >/dev/null 2>&1
fi
corepack enable pnpm >/dev/null 2>&1 || true

# 3. Docker daemon for local Supabase (not running by default in the VM).
if command -v dockerd >/dev/null 2>&1 && ! docker info >/dev/null 2>&1; then
  (dockerd >/var/log/dockerd.log 2>&1 &)
  for _ in $(seq 1 30); do docker info >/dev/null 2>&1 && break; sleep 1; done
fi

# 4. Session env: Node first on PATH; Supabase CLI pulls images from Docker Hub
#    (the default ECR registry's download host is blocked by this environment's network policy).
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  {
    echo 'export PATH="/usr/local/bin:$PATH"'
    echo 'export SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io'
    echo 'export TURBO_TELEMETRY_DISABLED=1'
  } >> "$CLAUDE_ENV_FILE"
fi

# 5. Workspace dependencies.
pnpm install --prefer-offline
