#!/bin/bash

echo "🚀 Starting Vercel build process..."

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Build the Next.js app first (without database dependency)
echo "🏗️ Building Next.js application..."
npm run build

# Try to initialize database after build (optional)
echo "🔄 Initializing database (optional)..."
if [ -n "$ALUDAAI_DATABASE_URL" ]; then
  echo "✅ Database URL found, initializing database..."
  node scripts/init-db.js || echo "⚠️ Database initialization failed, but build succeeded"
else
  echo "⚠️ No database URL found, skipping database initialization"
fi

echo "✅ Build process completed!"
