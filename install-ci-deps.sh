#!/usr/bin/env bash
# Install the dependencies used by CI and review experiments.
set -euo pipefail

# The prepare hook builds the project; CI runs builds separately.
yarn install --ignore-scripts
if [ "${CI_QA:-0}" = 1 ]; then
  python --version
  pip install --upgrade "openwisp-utils[qa]~=1.3.0"
  sudo npm install -g prettier
fi
