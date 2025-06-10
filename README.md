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

To create a production package of the desktop application:

```bash
npm run build
npm run tauri build
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

## Environment Variables

Copy `.env.example` to `.env` and adjust the values for your setup. Important keys include:

- `JWT_SECRET` – secret used to sign JWT tokens
- Database configuration: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `HASURA_ADMIN_SECRET` and `HASURA_GRAPHQL_JWT_SECRET`
- OAuth credentials: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- Firebase client keys: `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`, `VAPID_PUBLIC_KEY`
- `GOOGLE_APPLICATION_CREDENTIALS` pointing to a Firebase service account JSON

## Troubleshooting

- **Rust toolchain missing** – install it from [rust-lang.org](https://www.rust-lang.org/tools/install).
- **Node version errors** – use Node 18 or newer.
- **`tauri` build failures** – ensure dependencies are installed with `npm install` and Rust targets are up to date.
- **Authentication errors** – verify values in your `.env` file match those in `docker-compose.yml`.
- **No FCM notifications** – confirm `GOOGLE_APPLICATION_CREDENTIALS` points to a valid service account file.
