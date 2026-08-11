#!/bin/bash

# Determine directory script is in
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "🚀 TCMS Backend ve Frontend servisleri başlatılıyor..."

# Clear ports 3000 and 3001 if occupied
./stop.sh 2>/dev/null

echo "▶️ Backend (port 3001) ve Frontend (port 3000) çalıştırılıyor..."
npx concurrently -k -n "BACKEND,FRONTEND" -c "cyan.bold,magenta.bold" \
  "cd backend && npm run start:dev" \
  "cd frontend && npm run dev"
