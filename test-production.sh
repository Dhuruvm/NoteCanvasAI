#!/bin/bash
# Test production server for Render deployment

echo "=== Testing Production Server ==="
echo "Port: ${PORT:-5000}"
echo "Environment: ${NODE_ENV:-development}"

# Start server in background
NODE_ENV=production PORT=${PORT:-5000} node dist/index.js &
SERVER_PID=$!

echo "Server started with PID: $SERVER_PID"
sleep 3

# Test if server is responding
echo "Testing server response..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}" http://0.0.0.0:${PORT:-5000}/api/notes
echo ""

# Test frontend
echo "Testing frontend..."
curl -s http://0.0.0.0:${PORT:-5000} | head -c 100
echo "..."

# Kill server
kill $SERVER_PID 2>/dev/null
echo "Server test completed"