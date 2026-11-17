#!/usr/bin/env bash
# Rebuilds a local test database and runs the full suite. LOCAL ONLY.
set -euo pipefail
cd "$(dirname "$0")/.."
P="psql -h ${PGHOST:-/tmp} -p ${PGPORT:-54329} -U postgres -v ON_ERROR_STOP=1 -q"
$P -c "drop database if exists pdpa" -c "create database pdpa" >/dev/null 2>&1
$P -d pdpa -f tests/00_local_supabase_stub.sql >/dev/null
for f in migrations/*.sql; do $P -d pdpa -f "$f" >/dev/null; done
$P -d pdpa -f tests/01_fixtures.sql >/dev/null
$P -d pdpa -f tests/02_attack_suite.sql
