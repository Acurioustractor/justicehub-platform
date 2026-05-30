#!/bin/bash
# Run once per clone to activate the repo's secret-guard pre-commit hook.
set -euo pipefail
cd "$(dirname "$0")/.."
git config core.hooksPath .githooks
chmod +x .githooks/* 2>/dev/null || true
echo "Activated .githooks (core.hooksPath). Secret guard is now live for this clone."
echo "CI secret scan: gitleaks detect --config .gitleaks.toml"
