#!/bin/bash
# ставит зависимости при старте облачной сессии Claude Code, чтобы `pnpm check`/`pnpm build` работали сразу
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"
pnpm install --frozen-lockfile
