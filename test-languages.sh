#!/bin/bash

echo "Starting JSON Viewer development server..."
pnpm dev &
SERVER_PID=$!

sleep 3

echo ""
echo "Testing different language launches..."
echo "=================================="

# Test Mandarin Chinese
echo "1. Opening in Mandarin Chinese (zh-CN)..."
open -na "Google Chrome" --args --lang=zh-CN --user-data-dir="/tmp/chrome-zh" http://localhost:3000

echo "   → Check if the UI shows in Chinese (中文)"
echo ""

# Test Spanish
echo "2. To test Spanish (es):"
echo "   open -na 'Google Chrome' --args --lang=es --user-data-dir='/tmp/chrome-es' http://localhost:3000"
echo ""

# Test Hindi
echo "3. To test Hindi (hi):"
echo "   open -na 'Google Chrome' --args --lang=hi --user-data-dir='/tmp/chrome-hi' http://localhost:3000"
echo ""

# Test Turkish
echo "4. To test Turkish (tr):"
echo "   open -na 'Google Chrome' --args --lang=tr --user-data-dir='/tmp/chrome-tr' http://localhost:3000"
echo ""

echo "Press Ctrl+C to stop the development server"
wait $SERVER_PID