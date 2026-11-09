#!/usr/bin/env bash
set -euo pipefail
pnpm install --frozen-lockfile
if [ -f supabase/config.toml ]; then
  command -v docker >/dev/null && docker info >/dev/null 2>&1 || { echo 'This repository requires a working local Docker daemon for Supabase.' >&2; exit 1; }
  command -v supabase >/dev/null || { echo 'Supabase CLI 3.0.0 is required; see docs/architecture/database.md.' >&2; exit 1; }
  umask 077
  mkdir -p .hoplite/runtime
  if ! supabase start -x vector >.hoplite/runtime/supabase-start.log 2>&1; then
    echo 'Local Supabase did not start. Inspect ignored .hoplite/runtime/supabase-start.log locally; it can contain connection credentials.' >&2
    exit 1
  fi
  supabase migration up --local
  if [ ! -f .env.local ]; then node scripts/local-env.mjs; fi
fi
