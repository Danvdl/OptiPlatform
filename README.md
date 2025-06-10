# OptiPlatform

This repository contains a basic Tauri + React application scaffolded with Vite and TypeScript.

## Backend

The `server` directory holds a NestJS API with GraphQL, PostgreSQL via TypeORM
and simple JWT authentication.

### Authentication

All GraphQL mutations and queries require a valid JWT issued by the `login`
mutation or one of the OAuth flows. Include the token in the `Authorization`
header when communicating with the backend.

Install dependencies and run the server:

```bash
cd server
npm install

npm run start:dev
```

Run backend tests:

```bash
cd server
npm test
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


Hasura exposes a GraphQL API at `http://localhost:8080` and uses the same JWT secret as the NestJS backend (`JWT_SECRET`).

## Environment Variables

Copy `.env.example` to `.env` and fill in the values for your environment. Important keys include:

- `JWT_SECRET` – secret used to sign JWT tokens
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` – PostgreSQL connection settings
- `HASURA_ADMIN_SECRET` and `HASURA_GRAPHQL_JWT_SECRET`
- OAuth credentials: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- `GOOGLE_APPLICATION_CREDENTIALS` pointing to a Firebase service account JSON
- `VITE_HASURA_URL` and `VITE_HASURA_ADMIN_SECRET`
- Firebase client keys: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_PUBLIC_VAPID_KEY`
- `VITE_BACKEND_URL` – base URL for the NestJS backend used by the frontend
- `VITE_POUCHDB_REMOTE` – remote CouchDB URL for syncing
- `SERVER_URL` – public URL of the backend used for OAuth callbacks

Hasura exposes a GraphQL API at `http://localhost:8080` and uses the same JWT secret as the NestJS backend (`JWT_SECRET`).


## User Creation

Clients can create accounts using the `register` GraphQL mutation exposed by the NestJS server. Example mutation:

```graphql
mutation {
  register(data: { username: "myuser", password: "secret" })
}
```

The mutation returns a JWT which can be used for authenticated requests.


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


## Troubleshooting

- **Rust toolchain missing** – install it from [rust-lang.org](https://www.rust-lang.org/tools/install).
- **Node version errors** – use Node 18 or newer.
- **`tauri` build failures** – ensure dependencies are installed with `npm install` and Rust targets are up to date.
- **Authentication errors** – verify values in your `.env` file match those in `docker-compose.yml`.
- **No FCM notifications** – confirm `GOOGLE_APPLICATION_CREDENTIALS` points to a valid service account file.

## License

This project is licensed under the [MIT License](LICENSE).





