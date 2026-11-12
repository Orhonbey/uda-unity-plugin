#!/usr/bin/env bash
# Links this repository into Claude Code's config folder, so there is one place to edit.
#
#   scripts/bootstrap.sh              create or repair the links
#   scripts/bootstrap.sh --uninstall  remove the links that point into this repository
#
# Links made (CLAUDE_DIR is $CLAUDE_CONFIG_DIR, or ~/.claude):
#   CLAUDE_DIR/uda                 -> this repository (rules and scripts are read from here)
#   CLAUDE_DIR/agents/<file>.md    -> agents/<file>.md
#   CLAUDE_DIR/skills/<name>       -> skills/<name>
#   CLAUDE_DIR/commands/<file>.md  -> commands/<file>.md
#
# A file or folder that is not a symlink is never replaced: it is reported and the script exits 1.
# CLAUDE_DIR/CLAUDE.md is never touched.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
conflicts=0

points_into_repo() { # $1 = symlink path
  local target
  target="$(readlink "$1")"
  [[ "$target" == "$REPO" || "$target" == "$REPO/"* ]]
}

link() { # $1 = source inside the repo, $2 = link path
  local src="$1" dst="$2"
  if [[ -L "$dst" ]]; then
    if [[ "$(readlink "$dst")" == "$src" ]]; then
      echo "ok      $dst"
      return
    fi
    ln -sfn "$src" "$dst"
    echo "updated $dst -> $src"
  elif [[ -e "$dst" ]]; then
    echo "SKIPPED $dst exists and is not a symlink; move it away and run again" >&2
    conflicts=$((conflicts + 1))
  else
    ln -s "$src" "$dst"
    echo "linked  $dst -> $src"
  fi
}

# Remove links in a folder that point into this repo but whose target is gone
prune() { # $1 = folder
  local entry
  [[ -d "$1" ]] || return 0
  for entry in "$1"/*; do
    if [[ -L "$entry" ]] && points_into_repo "$entry" && [[ ! -e "$entry" ]]; then
      rm "$entry"
      echo "removed $entry (no longer in the repository)"
    fi
  done
}

uninstall() {
  local dir entry
  for dir in agents skills commands; do
    [[ -d "$CLAUDE_DIR/$dir" ]] || continue
    for entry in "$CLAUDE_DIR/$dir"/*; do
      if [[ -L "$entry" ]] && points_into_repo "$entry"; then
        rm "$entry"
        echo "removed $entry"
      fi
    done
  done
  if [[ -L "$CLAUDE_DIR/uda" ]] && points_into_repo "$CLAUDE_DIR/uda"; then
    rm "$CLAUDE_DIR/uda"
    echo "removed $CLAUDE_DIR/uda"
  fi
}

if [[ "${1:-}" == "--uninstall" ]]; then
  uninstall
  exit 0
elif [[ $# -gt 0 ]]; then
  echo "usage: $0 [--uninstall]" >&2
  exit 1
fi

mkdir -p "$CLAUDE_DIR/agents" "$CLAUDE_DIR/skills" "$CLAUDE_DIR/commands"
link "$REPO" "$CLAUDE_DIR/uda"

for f in "$REPO"/agents/*.md; do link "$f" "$CLAUDE_DIR/agents/$(basename "$f")"; done
for d in "$REPO"/skills/*/; do d="${d%/}"; link "$d" "$CLAUDE_DIR/skills/$(basename "$d")"; done
for f in "$REPO"/commands/*.md; do link "$f" "$CLAUDE_DIR/commands/$(basename "$f")"; done

prune "$CLAUDE_DIR/agents"
prune "$CLAUDE_DIR/skills"
prune "$CLAUDE_DIR/commands"

if [[ $conflicts -gt 0 ]]; then
  echo "$conflicts conflict(s); nothing was replaced for them" >&2
  exit 1
fi
echo "Done. In a Unity project, run /uda-new-project in Claude Code."
