#!/usr/bin/env bash
set -euo pipefail
command -v prove >/dev/null || { echo 'The standard Perl TAP runner (prove) is required for this Docker-compatible test path.' >&2; exit 1; }
exec prove --exec 'bash scripts/test-db-file.sh' supabase/tests/*.sql
