#!/bin/bash

# Determine directory script is in
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "🚀 TCMS Backend ve Frontend servisleri başlatılıyor..."

# Clear ports 3000 and 3001 if occupied
./stop.sh 2>/dev/null

if [ "$1" = "-d" ] || [ "$1" = "--daemon" ]; then
  echo "▶️ Servisler daemon (arkaplan) modunda başlatılıyor..."
  nohup bash -c "cd backend && npm run start:dev" > /dev/null 2>&1 &
  nohup bash -c "cd frontend && npm run dev" > /dev/null 2>&1 &
  sleep 3
  echo "✅ Servisler arkaplanda başlatıldı (Backend: 3001, Frontend: 3000)."
else
  echo "▶️ Backend (port 3001) ve Frontend (port 3000) çalıştırılıyor..."
  npx concurrently --kill-others -n "BACKEND,FRONTEND" -c "cyan.bold,magenta.bold" "cd backend && npm run start:dev" "cd frontend && npm run dev"
fi
