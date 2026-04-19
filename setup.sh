#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_PATH="$ROOT_DIR/.venv"

if [[ ! -d "$VENV_PATH" ]]; then
  echo "Creating virtual environment..."
  python3 -m venv "$VENV_PATH"
fi

VENV_PYTHON="$VENV_PATH/bin/python"

echo "Installing requirements..."
"$VENV_PYTHON" -m pip install --upgrade pip
"$VENV_PYTHON" -m pip install -r "$ROOT_DIR/requirements.txt"

echo "Setup complete."
