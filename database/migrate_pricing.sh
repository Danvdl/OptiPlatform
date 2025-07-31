#!/bin/bash

# Database Migration Script for OptiPlatform Pricing System
# This script applies the pricing system migration to your existing database

echo "🔄 Applying OptiPlatform Pricing System Migration..."

# Check if .env file exists and source database connection details
if [ -f "../server/.env" ]; then
    source ../server/.env
else
    echo "⚠️  .env file not found. Please ensure database connection details are available."
    echo "Expected variables: DATABASE_URL or individual DB_* variables"
fi

# Default values if not set in .env
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-optiplatform}
DB_USER=${DB_USER:-postgres}

echo "📊 Connecting to database..."
echo "   Host: $DB_HOST:$DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"

# Apply the migration
if [ -n "$DATABASE_URL" ]; then
    echo "🚀 Using DATABASE_URL connection..."
    psql "$DATABASE_URL" -f add_pricing_system.sql
else
    echo "🚀 Using individual connection parameters..."
    PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f add_pricing_system.sql
fi

if [ $? -eq 0 ]; then
    echo "✅ Pricing system migration completed successfully!"
    echo "📈 New features available:"
    echo "   • Product pricing (purchase/sale prices)"
    echo "   • Transaction cost tracking"
    echo "   • Price history audit trail"
    echo "   • Inventory valuation calculations"
    echo ""
    echo "🔄 Please restart your server to ensure all changes take effect."
else
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi
