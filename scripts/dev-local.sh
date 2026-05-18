#!/usr/bin/env bash
# Legacy alias — use: bash scripts/start.sh  (or ./start.sh from repo root)
exec "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/start.sh" "$@"
