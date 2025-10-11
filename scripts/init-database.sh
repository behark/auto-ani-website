#!/bin/bash

echo "🔄 Initializing database for AUTO ANI..."

# Load environment variables
if [ -f .env.production ]; then
  export $(cat .env.production | grep -v '^#' | xargs)
elif [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Run Prisma migrations
echo "📊 Running database migrations..."
npx prisma migrate deploy --schema=./prisma/schema.prisma || {
  echo "⚠️  Migration deploy failed, trying db push instead..."
  npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss
}

# Seed the database with initial data
echo "🌱 Seeding database with initial data..."
npx prisma db seed || echo "⚠️  Seeding failed or already done"

echo "✅ Database initialization complete!"