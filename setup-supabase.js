#!/usr/bin/env node

/**
 * Database Setup Script for Supabase
 * This script helps you set up your database schema in Supabase
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 OptiPlatform Database Setup for Supabase');
console.log('============================================\n');

const envPath = path.join(__dirname, '.env');

// Check if .env file exists
if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found!');
    console.log('Please create a .env file based on .env.example');
    process.exit(1);
}

// Read .env file
const envContent = fs.readFileSync(envPath, 'utf8');

// Check if Supabase credentials are configured
const hasDbUrl = envContent.includes('DB_URL=') && !envContent.includes('DB_URL=postgresql://postgres:your-supabase-password@');
const hasJwtSecret = envContent.includes('JWT_SECRET=') && !envContent.includes('JWT_SECRET=your-super-secret');

console.log('📋 Configuration Check:');
console.log(`   Database URL configured: ${hasDbUrl ? '✅' : '❌'}`);
console.log(`   JWT Secret configured: ${hasJwtSecret ? '✅' : '❌'}`);

if (!hasDbUrl) {
    console.log('\n📝 To configure Supabase:');
    console.log('1. Go to https://supabase.com and create a new project');
    console.log('2. Go to Settings > Database');
    console.log('3. Copy your connection string');
    console.log('4. Update DB_URL in your .env file with:');
    console.log('   DB_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres');
    console.log('\n❗ Don\'t forget to replace [YOUR-PASSWORD] and [YOUR-PROJECT-REF]');
    process.exit(1);
}

if (!hasJwtSecret) {
    console.log('\n❌ Please set a secure JWT_SECRET in your .env file');
    process.exit(1);
}

console.log('\n✅ Configuration looks good!');
console.log('\n📚 Next steps:');
console.log('1. Make sure your Supabase database is accessible');
console.log('2. Run: cd server && npm run start:dev');
console.log('3. The application will create the necessary database tables automatically');
console.log('\n🎯 The backend will be available at: http://localhost:3001');
console.log('🎯 GraphQL Playground: http://localhost:3001/graphql');
console.log('\n💡 If you get connection errors, double-check your Supabase credentials!');