#!/usr/bin/env sh
# Target must be a newly created, empty, isolated database. Never overwrite live data.
set -eu
cd "$(dirname "$0")/.."
: "${AQOURS_RESTORE_DATABASE_URL:?Set an isolated empty restore database privately}"
: "${ATTACHMENT_DIR:?Set a new project-local restored-attachment directory}"
: "${AQOURS_BACKUP_DIR:?Set an existing project-local backup directory}"
task_project_root="$PWD"
task_backup_path="$(realpath "$AQOURS_BACKUP_DIR")"
task_files_parent="$(realpath "$(dirname "$ATTACHMENT_DIR")")"
case "$task_backup_path/" in "$task_project_root/"*) ;; *) echo 'Backup directory must stay in project' >&2; exit 1;; esac
case "$task_files_parent/" in "$task_project_root/"*) ;; *) echo 'Restored files must stay in project' >&2; exit 1;; esac
if [ -e "$ATTACHMENT_DIR" ]; then echo 'Restored attachment destination must be new' >&2; exit 1; fi
# No --clean: existing tables make restoration fail safely.
pg_restore --exit-on-error --no-owner --dbname="$AQOURS_RESTORE_DATABASE_URL" "$task_backup_path/database.dump"
umask 077
mkdir "$ATTACHMENT_DIR"
tar --no-same-owner -C "$ATTACHMENT_DIR" -xf "$task_backup_path/attachments.tar"
echo 'Restored. Verify record counts, sessions/ownership and representative gated images before use.'
