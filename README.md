# 🚀 OptiPlatform

**Modern Inventory Management System** - A comprehensive platform built with NestJS GraphQL backend, React frontend, and Tauri desktop application capabilities.

## ✨ Features

### ✅ **Core Inventory Management**
- **Product Management** - Full CRUD operations with categories and locations
- **Inventory Tracking** - Real-time stock levels and transaction history
- **Location Management** - Multi-location inventory support
- **User Authentication** - JWT + OAuth (Google/GitHub)
- **Push Notifications** - Firebase Cloud Messaging integration

### ✅ **Pricing & Cost Management**
- **Product Pricing** - Purchase and sale price tracking
- **Cost Analysis** - Unit costs and total cost calculations
- **Price History** - Complete audit trail of price changes
- **Currency Support** - Multi-currency pricing system

### ✅ **Advanced Reporting & Analytics**
- **📊 Inventory Turnover Reports** - Analyze sales velocity and efficiency
- **📈 Stock Movement Analytics** - Track inventory flow patterns
- **⚠️ Low Stock Trend Analysis** - Predict stockouts and reorder points
- **📋 Category Performance** - Compare performance across categories
- ** Dashboard Metrics** - Real-time KPI overview
- **📥 Export Functionality** - PDF, CSV, Excel export capabilities
- **Scheduled Reports** - Automated report generation and delivery
- **Advanced Filtering** - Enhanced search and filter capabilities
- **Mobile App** - React Native mobile application
- **Real-time Updates** - WebSocket-based live inventory updates

---

## 🏗️ Architecture

- **Backend:** NestJS with GraphQL API + REST endpoints
- **Frontend:** React with TypeScript and Vite
- **Desktop:** Tauri application wrapper
- **Database:** PostgreSQL with TypeORM
- **Authentication:** JWT with OAuth providers
- **Notifications:** Firebase Cloud Messaging

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ 
- **PostgreSQL** database (local or Supabase)
- **Rust toolchain** (for Tauri desktop app)

### 1. Clone & Install
```bash
git clone <repository-url>
cd OptiPlatform

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Database Setup

This project uses **Supabase** as the PostgreSQL database. The database connection is already configured in the `.env` files.

> **✅ Database is pre-configured** - The Supabase connection details are set in your environment files. No additional database setup is required!

### 3. Environment Configuration

The project uses multiple environment files to manage different deployment scenarios:

#### 📁 Environment Files

| File | Purpose | Used When |
|------|---------|-----------|
| `.env.example` | Template with all available variables | Reference for setup |
| `.env` | Main configuration file | Shared/committed config (without secrets) |
| `.env.local` | **Local development** | Running `npm run dev` |
| `.env.production` | **Production builds** | Running `npm run build` |

#### 🔧 Setup Instructions

```bash
# 1. Copy the example template
cp .env.example .env

# 2. Create local development config
cp .env.example .env.local

# 3. Create production config
cp .env.example .env.production
```

#### ⚙️ Configuration for Different Environments

**For Local Development (`.env.local`):**
```bash
VITE_BACKEND_URL=http://localhost:3001
SERVER_URL=http://localhost:3001
# ... other local settings
```

**For Production (`.env.production`):**
```bash
VITE_BACKEND_URL=https://optiplatform-backend.onrender.com
SERVER_URL=https://optiplatform-backend.onrender.com
# ... other production settings
```

> **💡 Pro Tip:** Vite automatically loads the correct file based on the command:
> - `npm run dev` → Uses `.env.local` (falls back to `.env`)
> - `npm run build` → Uses `.env.production` (falls back to `.env`)

> **⚠️ Security:** Never commit `.env.local` or `.env.production` with real secrets! Add them to `.gitignore`.

### 4. Start Development Servers

#### Backend Server
```bash
cd server
npm run start:dev
# Server runs on http://localhost:3001
# GraphQL Playground: http://localhost:3001/graphql
```

#### Frontend Development
```bash
# In project root
npm run dev
# Frontend runs on http://localhost:5173
```

#### Tauri Desktop App
```bash
npm run tauri dev
```

---

## 🗄️ Database Configuration

### Required Environment Variables
```bash
# Database Connection
DB_HOST=your-supabase-host.supabase.co
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your-password
DB_NAME=postgres

# Authentication
JWT_SECRET=your-jwt-secret-key

# OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Firebase (Optional)
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_PUBLIC_VAPID_KEY=your-vapid-key

# Backend URL
VITE_BACKEND_URL=http://localhost:3001
SERVER_URL=http://localhost:3001

# Notifications & Thresholds
# Optional: threshold (in currency units) above which a waste/damage event triggers a push notification
WASTE_ALERT_THRESHOLD=100
```

---

## 📊 API Documentation

### GraphQL Playground
Access the interactive GraphQL playground at `http://localhost:3001/graphql`

### Authentication
All GraphQL operations require JWT authentication:
```bash
# Headers
{
  "Authorization": "Bearer your-jwt-token"
}
```

### Sample Queries

#### User Registration
```graphql
mutation {
  register(data: { 
    username: "myuser", 
    password: "secret123" 
  })
}
```

#### Get Dashboard Metrics
```graphql
query {
  dashboardMetrics(period: 30)
}
```

#### Inventory Turnover Report
```graphql
query {
  inventoryTurnoverReport(
    startDate: "2025-01-01"
    endDate: "2025-01-31"
  )
}
```

### REST Export Endpoints
```bash
# Export inventory turnover as CSV
GET /reports/export/inventory-turnover?format=csv&startDate=2025-01-01&endDate=2025-01-31

# Export dashboard as PDF
GET /reports/export/dashboard?format=pdf&period=30

# Export cost analysis as Excel
GET /reports/export/cost-analysis?format=excel&startDate=2025-01-01&endDate=2025-01-31
```

---

## 🏃‍♂️ Development

### Backend Development
```bash
cd server

# Development mode with hot reload
npm run start:dev

# Run tests
npm test

# Build for production
npm run build
npm run start:prod
```

### Frontend Development
```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Desktop Application
```bash
# Development mode
npm run tauri dev

# Build production app
npm run build
npm run tauri build
```

---

## 📋 Project Structure

```
OptiPlatform/
├── 📁 src/                          # React frontend
│   ├── components/                  # Reusable UI components
│   ├── layout/                      # Layout components
│   ├── pages/                       # Page components
│   └── utils/                       # Utilities and stores
├── 📁 server/                       # NestJS backend
│   ├── src/
│   │   ├── auth/                    # Authentication module
│   │   ├── inventory/               # Inventory management
│   │   ├── location/                # Location management
│   │   ├── user/                    # User management
│   │   ├── notifications/           # Push notifications
│   │   └── reports/                 # 📊 Reporting & analytics
│   └── test/                        # Backend tests
├── 📁 src-tauri/                    # Tauri desktop app
├── 📁 database/                     # Database schemas
│   ├── schema.sql                   # Core database schema
│   └── add_pricing_system.sql       # Pricing system migration
├── 📄 docker-compose.yml            # Local development database
└── 📄 REPORTS_DOCUMENTATION.md      # Reporting system docs
```

---

## 🧪 Testing

### Backend Tests
```bash
cd server
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov
```

### Frontend Tests
```bash
# Run frontend tests (when implemented)
npm run test
```

---

## 🚀 Production Deployment

### Deploying to Render (Backend)

#### 1. Backend Deployment Settings

| Setting | Value |
|---------|-------|
| **Root Directory** | `server` |
| **Build Command** | `npm install; npm run build` |
| **Start Command** | `npm run start` |
| **Region** | Choose closest to your users |

#### 2. Environment Variables on Render

Add all variables from `.env.production` to your Render service:

```bash
# Required Variables
NODE_ENV=production
JWT_SECRET=your-secret-key
DB_HOST=your-database-host
DB_PORT=6543
DB_USERNAME=your-db-username
DB_PASSWORD=your-db-password
DB_NAME=postgres
DB_URL=postgresql://username:password@host:port/database

# Backend & Frontend URLs
SERVER_URL=https://optiplatform-backend.onrender.com
FRONTEND_URL=https://your-frontend-url.com  # Set to your actual frontend URL

# Optional: OAuth & Firebase
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
# ... other optional variables
```

#### 3. CORS Configuration

The backend automatically configures CORS based on `NODE_ENV`:
- **Production:** Uses `FRONTEND_URL` environment variable
- **Development:** Allows `localhost` origins

#### 4. Frontend Deployment

**Option A: Deploy frontend separately (Vercel/Netlify)**
```bash
# Build with production backend URL
npm run build

# Deploy the 'dist' folder
```

**Option B: Serve frontend from backend**
- Build frontend and serve static files from NestJS
- Single deployment, no CORS issues

### Local Production Testing
```bash
# Backend
cd server
npm run build
npm run start:prod

# Frontend
npm run build
npm run preview
```

### Environment Variables for Production
- Set `NODE_ENV=production`
- Use secure JWT secret
- Configure production database
- Set up proper CORS origins
- Configure SSL certificates

### Desktop App Distribution
```bash
npm run build
npm run tauri build
# Generated installers in src-tauri/target/release/bundle/
```

---

## 📚 Documentation

- **📊 [Reporting System Documentation](./REPORTS_DOCUMENTATION.md)** - Complete guide to analytics and reporting features
- **🔧 [API Documentation](http://localhost:3001/graphql)** - Interactive GraphQL playground
- **🎯 [Business Intelligence Guide](./REPORTS_DOCUMENTATION.md#-key-metrics-explained)** - Understanding metrics and KPIs

---

## 🛠️ Troubleshooting

### Common Issues

**🔌 Backend Connection Issues**
```bash
# Check if server is running
curl http://localhost:3001/graphql

# Verify database connection
# Check DB credentials in .env
```

**📱 Frontend Not Loading**
```bash
# Verify backend URL in .env
VITE_BACKEND_URL=http://localhost:3001

# Clear browser cache and restart dev server
```

**🦀 Tauri Build Failures**
```bash
# Update Rust toolchain
rustup update

# Clear Tauri cache
npm run tauri build -- --debug
```

**📊 Reports Not Working**
1. Ensure database migration is applied: `add_pricing_system.sql`
2. Restart backend server after migration
3. Check GraphQL playground for report queries

### System Requirements
- **Node.js:** 18+
- **Rust:** Latest stable (for Tauri)
- **RAM:** 4GB minimum, 8GB recommended
- **PostgreSQL:** 12+

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 🚀 What's Next?

- 🎨 **Interactive Dashboard** - Charts and visualizations for reports
- 📧 **Email Reports** - Scheduled report delivery
- 📱 **Mobile App** - React Native mobile application
- 🔄 **Real-time Updates** - WebSocket integration
- 🌐 **Multi-tenant** - Support for multiple organizations
- 🤖 **AI Insights** - Machine learning-powered inventory predictions






