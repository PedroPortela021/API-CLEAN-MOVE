#!/usr/bin/env bash

set -uo pipefail

app_pid=""
cleanup_ran=0
compose_started=0

cleanup() {
  if [ "$cleanup_ran" -eq 1 ]; then
    return
  fi

  cleanup_ran=1

  if [ -n "$app_pid" ] && kill -0 "$app_pid" 2>/dev/null; then
    kill -TERM "$app_pid" 2>/dev/null || true
    wait "$app_pid" 2>/dev/null || true
  fi

  if [ "$compose_started" -eq 1 ]; then
    docker compose stop
  fi
}

handle_signal() {
  local signal="$1"

  if [ -n "$app_pid" ] && kill -0 "$app_pid" 2>/dev/null; then
    kill "-$signal" "$app_pid" 2>/dev/null || true
    wait "$app_pid" 2>/dev/null || true
  fi

  exit 130
}

trap cleanup EXIT
trap 'handle_signal INT' INT
trap 'handle_signal TERM' TERM

docker compose up -d
compose_started=1

npm run start:dev &
app_pid=$!

wait "$app_pid"
exit_code=$?

exit "$exit_code"
