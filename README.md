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
