#!/bin/bash

# Quick deployment check script
echo "🔍 Checking deployment status..."

# Check if Next.js process is running
if pgrep -f "next start" > /dev/null; then
    echo "✅ Next.js process is running"
    echo "📊 Process details:"
    ps aux | grep "next start" | grep -v grep
else
    echo "❌ Next.js process is NOT running"
    echo "🚀 Starting Next.js..."
    
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm use 20
    
    npm start > app.log 2>&1 &
    sleep 3
    
    if pgrep -f "next start" > /dev/null; then
        echo "✅ Next.js started successfully"
    else
        echo "❌ Failed to start Next.js"
        echo "📋 Error log:"
        tail -20 app.log
    fi
fi

# Check if port 3000 is listening
if netstat -tlnp 2>/dev/null | grep :3000 > /dev/null; then
    echo "✅ Port 3000 is listening"
else
    echo "❌ Port 3000 is NOT listening"
fi

# Test local connection
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ App responds on localhost:3000"
else
    echo "❌ App does NOT respond on localhost:3000"
fi

echo ""
echo "💡 If you see 403 error, you need to configure your web server to proxy to localhost:3000"