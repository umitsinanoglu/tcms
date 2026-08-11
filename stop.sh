#!/bin/bash

echo "🛑 TCMS servisleri durduruluyor..."

# Kill processes listening on ports 3000 (frontend) and 3001 (backend)
PID_FE=$(lsof -ti:3000 2>/dev/null)
if [ -n "$PID_FE" ]; then
  echo "  - Frontend servisi (Port 3000, PID: $PID_FE) sonlandırılıyor..."
  kill -9 $PID_FE 2>/dev/null || true
else
  echo "  - Port 3000'de çalışan frontend bulunamadı."
fi

PID_BE=$(lsof -ti:3001 2>/dev/null)
if [ -n "$PID_BE" ]; then
  echo "  - Backend servisi (Port 3001, PID: $PID_BE) sonlandırılıyor..."
  kill -9 $PID_BE 2>/dev/null || true
else
  echo "  - Port 3001'de çalışan backend bulunamadı."
fi

echo "✅ Durdurma işlemi tamamlandı."
