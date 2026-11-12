#!/usr/bin/env bash
# Copies the UDA rules into the Unity project in the current folder, under .claude/uda/.
# Claude Code loads a project's CLAUDE.md imports only from files inside the project,
# so the rules are copied, not linked. Run it again to update the copy.
#
#   copy-rules.sh                keep the profile the project already has (or none)
#   copy-rules.sh <profile>      select that profile
#   copy-rules.sh none           no profile
#
# Prints the selected profile on the last line: "profile: <name>" or "profile: none".
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
DEST=".claude/uda"

if [[ ! -f ProjectSettings/ProjectVersion.txt ]]; then
  echo "error: run this at the root of a Unity project (ProjectSettings/ProjectVersion.txt not found)" >&2
  exit 1
fi
if [[ $# -gt 1 ]]; then
  echo "usage: $0 [profile|none]" >&2
  exit 1
fi

available() { local f; for f in "$REPO"/rules/profiles/*.md; do basename "$f" .md; done; }

profile="${1:-}"
if [[ -z "$profile" ]]; then
  # Keep the current one: the single profile file in the existing copy
  current=()
  if [[ -d "$DEST/rules/profiles" ]]; then
    for f in "$DEST"/rules/profiles/*.md; do [[ -e "$f" ]] && current+=("$(basename "$f" .md)"); done
  fi
  if [[ ${#current[@]} -gt 1 ]]; then
    echo "error: the copy has more than one profile (${current[*]}); name the one to keep" >&2
    exit 1
  fi
  profile="${current[0]:-none}"
fi
if [[ "$profile" != "none" && ! -f "$REPO/rules/profiles/$profile.md" ]]; then
  echo "error: no profile named \"$profile\". Available: $(available | tr '\n' ' ')none" >&2
  exit 1
fi

rm -rf "$DEST/rules"
mkdir -p "$DEST/rules/libraries" "$DEST/rules/profiles"
cp "$REPO/rules/core.md" "$DEST/rules/core.md"
cp "$REPO"/rules/libraries/*.md "$DEST/rules/libraries/"
[[ "$profile" != "none" ]] && cp "$REPO/rules/profiles/$profile.md" "$DEST/rules/profiles/"

version="$(git -C "$REPO" rev-parse --short HEAD 2>/dev/null || echo unknown)"
if [[ -n "$(git -C "$REPO" status --porcelain -- rules 2>/dev/null)" ]]; then version="$version+uncommitted"; fi
cat > "$DEST/README.md" <<EOF
# UDA rules (copy)

Copied from the uda-unity-plugin repository at $version on $(date +%Y-%m-%d).
Do not edit these files here: change them in the repository, then run /uda-new-project
(or ~/.claude/uda/scripts/copy-rules.sh) in this project to update the copy.
EOF

echo "copied rules to $DEST/rules ($version)"
echo "profile: $profile"
