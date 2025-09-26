#!/bin/bash

# Production deployment script

echo "🚀 Starting production deployment..."

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production file not found!"
    echo "Please create .env.production with your production environment variables."
    exit 1
fi

echo "📦 Installing dependencies..."
npm ci

echo "🗃️  Running production database migrations..."
npm run db:migrate:production

echo "🏗️  Building application for production..."
npm run build:production

echo "✅ Production deployment complete!"
echo "Run 'npm start' to start the production server."
