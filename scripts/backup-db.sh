#!/usr/bin/env sh
set -eu

umask 077
backup_dir=${BACKUP_DIR:-./backups}
mkdir -p "$backup_dir"
stamp=$(date -u +%Y%m%dT%H%M%SZ)
target="$backup_dir/rentcar-postgres-$stamp.dump"
temporary="$target.tmp"
trap 'rm -f "$temporary"' EXIT HUP INT TERM

docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$temporary"
test -s "$temporary"
mv "$temporary" "$target"
trap - EXIT HUP INT TERM
printf 'Database backup created: %s\n' "$target"
