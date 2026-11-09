#!/usr/bin/env bash
set -euo pipefail
mkdir -p src/types .hoplite/runtime
temporary="$(mktemp .hoplite/runtime/database-types.XXXXXX)"
trap 'rm -f "$temporary"' EXIT
supabase gen types typescript --local | sed 's/[[:blank:]]*$//' >"$temporary"
mv "$temporary" src/types/database.generated.ts
