#!/bin/bash

echo "🛑 TCMS servisleri durduruluyor..."

# Kill processes listening on ports 3000 (frontend) and 3001 (backend)
for PORT in 3000 3001; do
  PIDS=$(lsof -i tcp:$PORT -t 2>/dev/null)
  if [ -n "$PIDS" ]; then
    echo "  - Port $PORT üzerindeki süreçler ($PIDS) sonlandırılıyor..."
    kill -9 $PIDS 2>/dev/null || true
  fi
done

pkill -f "nest start" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
pkill -f "next-server" 2>/dev/null || true

echo "✅ Durdurma işlemi tamamlandı."

