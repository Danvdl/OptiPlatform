# OptiPlatform

This repository contains a basic Tauri + React application scaffolded with Vite and TypeScript.

## Backend

The `server` directory holds a NestJS API with GraphQL, PostgreSQL via TypeORM
and simple JWT authentication.

Install dependencies and run the server:

```bash
cd server
npm install

npm run start:dev
```

## Development

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

To run the Tauri application (requires Rust toolchain):

```bash
npm run tauri dev
```

## Project Structure

- `src-tauri/` - Tauri backend source code and configuration
- `src/` - React frontend source code
- `server/` - NestJS GraphQL API

The React application features a simple sidebar layout and a dashboard page using React Router.

## Database and Hasura

A `docker-compose.yml` configuration is included to launch PostgreSQL along with Hasura. The schema for the inventory system resides in `database/schema.sql` and defines tables for `users`, `products`, `locations` and `inventory_transactions`.

Start both services with:

```bash
docker-compose up -d
```

Hasura exposes a GraphQL API at `http://localhost:8080` and uses the same JWT secret as the NestJS backend (`secretKey`).

## Firebase Notifications

The backend can send push notifications using Firebase Cloud Messaging. A service
account JSON file is required for the Firebase Admin SDK. Create a new service
account key from the Firebase console and download the JSON credentials. Supply
the file path or JSON contents when starting the server:

```bash
# Path to JSON file
FIREBASE_SERVICE_ACCOUNT_PATH=path/to/service-account.json npm run start:dev

# Alternatively provide the JSON directly
FIREBASE_SERVICE_ACCOUNT='{"project_id":"..."}' npm run start:dev
```

If neither variable is provided, the server falls back to Google application
default credentials.
