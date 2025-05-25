#!/bin/bash

# Backend Deployment Script for Heroku

echo "🚀 Deploying Youth Alive Backend to Heroku..."

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI is not installed. Please install it first:"
    echo "   https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Get app name from user
read -p "Enter your Heroku app name (e.g., youthalive-backend): " APP_NAME

if [ -z "$APP_NAME" ]; then
    echo "❌ App name is required"
    exit 1
fi

echo "📝 Creating Heroku app: $APP_NAME"
heroku create $APP_NAME

echo "🔧 Setting up environment variables..."
echo "Please enter your environment variables:"

read -p "MongoDB URI: " MONGODB_URI
read -p "JWT Secret: " JWT_SECRET
read -p "Registration Secret: " REGISTRATION_SECRET
read -p "Jotform API Key: " JOTFORM_API_KEY
read -p "MailerSend API Key: " MAILERSEND_API_KEY
read -p "Frontend URL (will be Vercel URL): " FRONTEND_URL

echo "Setting Heroku config vars..."
heroku config:set MONGODB_URI="$MONGODB_URI" --app $APP_NAME
heroku config:set JWT_SECRET="$JWT_SECRET" --app $APP_NAME
heroku config:set REGISTRATION_SECRET="$REGISTRATION_SECRET" --app $APP_NAME
heroku config:set JOTFORM_API_KEY="$JOTFORM_API_KEY" --app $APP_NAME
heroku config:set MAILERSEND_API_KEY="$MAILERSEND_API_KEY" --app $APP_NAME
heroku config:set FROM_EMAIL="noreply@youthalivesa.org.au" --app $APP_NAME
heroku config:set FROM_NAME="Youth Alive SA" --app $APP_NAME
heroku config:set FRONTEND_URL="$FRONTEND_URL" --app $APP_NAME
heroku config:set NODE_ENV="production" --app $APP_NAME

echo "📦 Building and deploying..."
git add .
git commit -m "Deploy to Heroku"
git push heroku main

echo "✅ Deployment complete!"
echo "🌐 Your backend URL: https://$APP_NAME.herokuapp.com"
echo "📋 Webhook URL for Jotform: https://$APP_NAME.herokuapp.com/api/webhooks/jotform"
