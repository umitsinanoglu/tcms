#!/bin/bash

# Determine directory script is in
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "🔄 TCMS Servisleri Yeniden Başlatılıyor (Restart)..."

# Terminate existing services on ports 3000 & 3001
./stop.sh

echo "⏳ Portların serbest kalması için 1 saniye bekleniyor..."
sleep 1

echo "🧹 Stale Next.js build ve cache temizleniyor..."
rm -rf frontend/.next

# Launch both services
./start.sh
