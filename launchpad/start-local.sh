#!/bin/bash
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
cd "$SCRIPT_DIR"
export SQL_USER=${SQL_USER:-postgres}
export SQL_PASSWORD=${SQL_PASSWORD:-postgres123}
export SQL_DB_NAME=${SQL_DB_NAME:-mail_agenda}
export SQL_HOST=${SQL_HOST:-localhost}
export SQL_PORT=${SQL_PORT:-5432}
docker compose up -d
[ ! -d "dist" ] && npm run build
npm run start
