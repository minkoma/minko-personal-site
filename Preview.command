#!/bin/zsh
cd -- "${0:A:h}"
if ! curl --silent --fail http://127.0.0.1:8000/portfolio.html >/dev/null; then
  python3 -m http.server 8000 --bind 127.0.0.1 &
  preview_pid=$!
  trap 'kill "$preview_pid" 2>/dev/null' EXIT INT TERM
  sleep 1
  open http://127.0.0.1:8000/index.html
  wait "$preview_pid"
else
  open http://127.0.0.1:8000/index.html
fi
