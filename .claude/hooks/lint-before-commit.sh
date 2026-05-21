#!/bin/bash
# PreToolUse hook: run npm run lint before any git commit, block if lint fails
cmd=$(jq -r '.tool_input.command // ""')
if echo "$cmd" | grep -q 'git commit'; then
  lint_out=$(npm run lint 2>&1)
  lint_exit=$?
  if [ "$lint_exit" -ne 0 ]; then
    jq -n --arg msg "$(printf 'Lint 检查失败，请先修复后再提交:\n%s' "$lint_out")" \
      '{"continue":false,"stopReason":$msg}'
  fi
fi
