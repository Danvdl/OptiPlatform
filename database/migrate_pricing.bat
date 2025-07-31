@echo off
REM Database Migration Script for OptiPlatform Pricing System
REM This script applies the pricing system migration to your existing database

echo 🔄 Applying OptiPlatform Pricing System Migration...

REM Check if .env file exists
if exist "..\server\.env" (
    echo 📄 Found .env file
) else (
    echo ⚠️  .env file not found in server directory
    echo Please ensure your database connection is configured
)

echo 📊 Connecting to database...

REM Try to apply migration using psql
REM You may need to adjust the connection details below
echo 🚀 Applying database changes...

REM If you have DATABASE_URL in your environment:
REM psql %DATABASE_URL% -f add_pricing_system.sql

REM If you need to specify connection details manually:
REM psql -h localhost -p 5432 -U postgres -d optiplatform -f add_pricing_system.sql

REM For this example, we'll assume you'll run the SQL manually or adjust as needed
echo 📋 To apply the migration, run one of these commands:
echo.
echo Option 1 - If you have DATABASE_URL set:
echo   psql %DATABASE_URL% -f add_pricing_system.sql
echo.
echo Option 2 - With individual parameters:
echo   psql -h YOUR_HOST -p YOUR_PORT -U YOUR_USER -d YOUR_DATABASE -f add_pricing_system.sql
echo.
echo Option 3 - Copy and paste the contents of add_pricing_system.sql into your database client
echo.

echo ✅ Migration file ready: add_pricing_system.sql
echo 📈 After applying, you'll have these new features:
echo    • Product pricing (purchase/sale prices)
echo    • Transaction cost tracking  
echo    • Price history audit trail
echo    • Inventory valuation calculations
echo.
echo 🔄 Remember to restart your server after applying the migration!

pause
