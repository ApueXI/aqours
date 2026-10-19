#!/usr/bin/env sh
# Pause API writers first so attachment files and database metadata form one snapshot.
set -eu
cd "$(dirname "$0")/.."
: "${DATABASE_URL:?Set DATABASE_URL privately before running backup}"
: "${ATTACHMENT_DIR:?Set the project-local attachment storage directory}"
: "${AQOURS_BACKUP_DIR:?Set a new project-local backup directory}"
task_project_root="$PWD"
task_files_path="$(realpath "$ATTACHMENT_DIR")"
task_backup_parent="$(realpath "$(dirname "$AQOURS_BACKUP_DIR")")"
case "$task_files_path/" in "$task_project_root/"*) ;; *) echo 'Attachment directory must stay in project' >&2; exit 1;; esac
case "$task_backup_parent/" in "$task_project_root/"*) ;; *) echo 'Backup directory must stay in project' >&2; exit 1;; esac
if [ -e "$AQOURS_BACKUP_DIR" ]; then echo 'Backup destination already exists; choose a new directory' >&2; exit 1; fi
umask 077
mkdir "$AQOURS_BACKUP_DIR"
pg_dump --no-owner --format=custom --file="$AQOURS_BACKUP_DIR/database.dump" "$DATABASE_URL"
tar -C "$task_files_path" -cf "$AQOURS_BACKUP_DIR/attachments.tar" .
cp -R aqours-api/prisma "$AQOURS_BACKUP_DIR/prisma"
cp aqours-api/prisma.config.ts "$AQOURS_BACKUP_DIR/"
cp -R aqours-api/migrations "$AQOURS_BACKUP_DIR/legacy-migrations"
echo 'Backup saved. Keep it private; verify restoration into an isolated database.'
