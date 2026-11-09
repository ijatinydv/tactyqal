#!/usr/bin/env bash
set -euo pipefail
container="${SUPABASE_DB_CONTAINER:-supabase_db_tactyqal}"
{
  printf 'CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;\nSET search_path = public, extensions;\n'
  cat "$1"
} | docker exec -i "$container" psql -U postgres -d postgres -X -q -A -t -v ON_ERROR_STOP=1
