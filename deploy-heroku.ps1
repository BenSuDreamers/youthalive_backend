# Backend Deployment Script for Heroku (PowerShell)

Write-Host "🚀 Deploying Youth Alive Backend to Heroku..." -ForegroundColor Green

# Check if Heroku CLI is installed
try {
    heroku --version | Out-Null
} catch {
    Write-Host "❌ Heroku CLI is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "   https://devcenter.heroku.com/articles/heroku-cli" -ForegroundColor Yellow
    exit 1
}

# Get app name from user
$APP_NAME = Read-Host "Enter your Heroku app name (e.g., youthalive-backend)"

if ([string]::IsNullOrEmpty($APP_NAME)) {
    Write-Host "❌ App name is required" -ForegroundColor Red
    exit 1
}

Write-Host "📝 Creating Heroku app: $APP_NAME" -ForegroundColor Blue
heroku create $APP_NAME

Write-Host "🔧 Setting up environment variables..." -ForegroundColor Blue
Write-Host "Please enter your environment variables:" -ForegroundColor Yellow

$MONGODB_URI = Read-Host "MongoDB URI"
$JWT_SECRET = Read-Host "JWT Secret"
$REGISTRATION_SECRET = Read-Host "Registration Secret"
$JOTFORM_API_KEY = Read-Host "Jotform API Key"
$MAILERSEND_API_KEY = Read-Host "MailerSend API Key"
$FRONTEND_URL = Read-Host "Frontend URL (will be Vercel URL)"

Write-Host "Setting Heroku config vars..." -ForegroundColor Blue
heroku config:set MONGODB_URI="$MONGODB_URI" --app $APP_NAME
heroku config:set JWT_SECRET="$JWT_SECRET" --app $APP_NAME
heroku config:set REGISTRATION_SECRET="$REGISTRATION_SECRET" --app $APP_NAME
heroku config:set JOTFORM_API_KEY="$JOTFORM_API_KEY" --app $APP_NAME
heroku config:set MAILERSEND_API_KEY="$MAILERSEND_API_KEY" --app $APP_NAME
heroku config:set FROM_EMAIL="noreply@youthalivesa.org.au" --app $APP_NAME
heroku config:set FROM_NAME="Youth Alive SA" --app $APP_NAME
heroku config:set FRONTEND_URL="$FRONTEND_URL" --app $APP_NAME
heroku config:set NODE_ENV="production" --app $APP_NAME

Write-Host "📦 Building and deploying..." -ForegroundColor Blue
git add .
git commit -m "Deploy to Heroku"
git push heroku main

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🌐 Your backend URL: https://$APP_NAME.herokuapp.com" -ForegroundColor Cyan
Write-Host "📋 Webhook URL for Jotform: https://$APP_NAME.herokuapp.com/api/webhooks/jotform" -ForegroundColor Cyan
