#!/bin/bash

echo "🚀 Starting Vercel build process..."

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Build the Next.js app first (without database dependency)
echo "🏗️ Building Next.js application..."
npm run build

# Run migrations after build (optional)
echo "🔄 Running database migrations (optional)..."
if [ -n "$ALUDAAI_DATABASE_URL" ] || [ -n "$DATABASE_URL" ]; then
  echo "✅ Database URL found, deploying migrations..."
  node scripts/deploy-db.js || echo "⚠️ Migration deploy failed, but build succeeded"
else
  echo "⚠️ No database URL found, skipping migration deploy"
fi

echo "✅ Build process completed!"
