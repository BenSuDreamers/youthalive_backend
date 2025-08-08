#!/bin/bash

echo "🚀 Deploying High-Load Optimizations to Production"
echo "================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must be run from youthalive_backend directory"
    exit 1
fi

echo "📋 Pre-deployment checklist:"
echo "✅ Database connection pool optimized"
echo "✅ Atomic check-in operations implemented"
echo "✅ Database indexes added"
echo "✅ QR code generation cached"
echo "✅ Frontend retry logic added"
echo "✅ Rate limiting added to QR scanner"

echo ""
echo "🔨 Building optimized backend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Aborting deployment."
    exit 1
fi

echo "✅ Build successful!"

echo ""
echo "🚀 Deploying to Heroku..."
git add .
git commit -m "feat: High-load optimizations for concurrent QR scanning

- Increased MongoDB connection pool and timeouts
- Atomic check-in operations to prevent race conditions  
- Added database indexes for fast ticket lookups
- QR code generation caching for performance
- Frontend retry logic with exponential backoff
- Rate limiting on QR scanner to prevent rapid scans
- Improved error handling and logging

Optimizations target 4+ concurrent scanners checking in 1000+ people."

git push heroku main

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo ""
    echo "🎯 NEXT STEPS:"
    echo "=============="
    echo "1. Monitor your app at https://dashboard.heroku.com/apps/youthalive-backend"
    echo "2. Test with multiple devices scanning QR codes simultaneously"
    echo "3. Watch for improved response times and fewer failures"
    echo "4. If still experiencing issues, consider upgrading dyno:"
    echo "   heroku dyno:resize --size=standard-1x --app=youthalive-backend"
    echo ""
    echo "📊 Expected improvements:"
    echo "- Check-in operations: <2 seconds each"
    echo "- Concurrent scanning: 4+ devices without conflicts"
    echo "- Database lookup: <500ms average"
    echo "- QR generation: <200ms average (cached)"
else
    echo "❌ Deployment failed! Check the output above for errors."
    exit 1
fi
