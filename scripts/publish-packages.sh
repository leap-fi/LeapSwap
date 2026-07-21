#!/usr/bin/env bash
# Publish @leapswap packages to npm in dependency order.
# Prerequisites: npm login, own/create the @leapswap org, packages built.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! npm whoami >/dev/null 2>&1; then
  echo "Not logged in to npm. Run: npm login"
  exit 1
fi

echo "npm user: $(npm whoami)"
echo "Building packages (topological)…"

pnpm --filter @leapswap/widget-types build
pnpm --filter @leapswap/widget-sdk build
pnpm --filter @leapswap/wallet-management build
pnpm --filter @leapswap/widget build

# Dry-run first unless --yes
DRY_RUN=(--dry-run)
if [[ "${1:-}" == "--yes" ]]; then
  DRY_RUN=()
  echo "Publishing for real…"
else
  echo "Dry-run only. Pass --yes to publish."
fi

publish_one() {
  local pkg="$1"
  local dir="$2"
  echo ""
  echo ">>> $pkg"
  if [[ -n "$dir" ]]; then
    (cd "$dir" && node ../../scripts/prerelease.js)
  fi
  pnpm --filter "$pkg" publish --access public --no-git-checks "${DRY_RUN[@]}"
  if [[ -n "$dir" ]]; then
    (cd "$dir" && node ../../scripts/postrelease.js)
  fi
}

publish_one @leapswap/widget-types ""
publish_one @leapswap/widget-sdk ""
publish_one @leapswap/wallet-management packages/wallet-management
publish_one @leapswap/widget packages/widget

echo ""
echo "Done."
