# Backend Project

This is the backend for the project, built with Express and Sequelize.

## Database Setup

The project uses PostgreSQL as the database. Make sure you have PostgreSQL installed and running on your system.

### Database Configuration

The database connection is configured in `src/database/connection.js`. By default, it connects to a PostgreSQL database named `final_project` with the following credentials:

- Username: `postgres`
- Password: `root`
- Host: `localhost`
- Port: `5432`

You may need to adjust these settings to match your local PostgreSQL configuration.

## Database Commands

The following npm scripts are available for managing the database:

- `npm run db:drop` - Drops all tables in the database
- `npm run db:create` - Creates all tables in the database (will drop existing tables)
- `npm run db:seed` - Seeds the database with fake data
- `npm run db:reset` - Combination of drop, create, and seed (full reset)

## Seeding the Database

The seed files use Faker.js to generate realistic test data. The seeding process creates:

- Users (admin and regular users)
- Categories
- Crops and crop details
- Animals and animal details
- Posts, comments, and likes
- Accounts and transactions
- Stocks, stock history, and pesticides
- Conversations and messages
- Scans with associated media
- Notifications of various types
- Backup sync records

The seeds are created in a specific order to respect foreign key constraints and dependencies between tables.

To seed the database, run:

```bash
npm run db:seed
```

Or to completely reset and seed the database:

```bash
npm run db:reset
```

## Starting the Server

To start the server, run:

```bash
npm start
```

The server will start on port 5000 by default.
