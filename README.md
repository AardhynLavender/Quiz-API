# Restful API Assignment

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

## Meta

### About

Due to a nation-wide lockdown, your local pub is no longer able to run their weekly quiz night onsite. Your local pub owners know you are an IT student \& ask if you want create an online quiz night application for them. For the first step, the pub owners want a **RESTful API** that provides various functions for registering, logging in, participating in various quizzes \& keeping track of scores so that they can give away prizes at the end of each quiz night.

### Objectives

- Apply design patterns & programming principles using software development best practices.
- implement full-stack applications using industry relevant programming languages.

## Local Configuration

Navigate to the projects root after cloning

```shell
cd assessment-1-node-js-restful-api-AardhynLavender
```

Install dependencies

```shell
npm i
```

Set up your `.env` file with.

```shell
./configureEnvironment
```

or manually with

```
cp template.env .env
vim .env
```

lets configure these variables:

| Variable             | Description                                                                    |
| :------------------- | :----------------------------------------------------------------------------- |
| PORT                 | change if you wish... `3000` may conflict with defaults for other apps?        |
| SHADOW_DATABASE_URL  | see `Prisma > Environment`                                                     |
| DATABASE_URL         | see `Prisma > Environment`                                                     |
| SESSION_LIFETIME     | How long your users are logged in for, measured in hours. Use a natural number |
| SEED_GIST_HASH       | If you have seeding data provide a gist hash for it here.                      |
| GITHUB_USERNAME      | Provide a username that the aforementioned gist is registered under            |
| NODE_ENV=development | I like to be specific, you can set you node environment if needed              |

####

## Prisma Configuration

### Entity Relationship Diagram

For reference, here's ERD of the current database

```

```

### Environment

Firstly, you need to setup a database. I use a PostgreSQL instance on a Heroku free tier ( at least, for now... ).

Create a `new app`, and add **two** `Heroku Postgres` addons--the free ones will do.

As you can see from the `prisma.schema` bellow, you'll need to configure a `DATABASE_URL` and `SHADOW_DATABASE_URL`

```prisma
datasource db {
  provider          = "postgresql"
  url               = env("DATABASE_URL")
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL")
}
```

You'll find these in your `Config Vars` section in the settings for your Heroku app. Use the `HEROKU_POSTGRESQL_*******` variable for your `SHADOW_DATABASE_URL`.

### Migrations

Changes to the `prisma.schema` file will require running a migration to take effect.

Format the prisma schema with `prisma:format`, this will align the columns within models so they are easier to read.

Run `prisma:migrate` to create the `sql` alterations needed to apply your changes.

> You will lose data in this process, have a look at [this article](https://www.prisma.io/docs/concepts/components/prisma-migrate/migrate-development-production#production-and-testing-environments) for production viable migrations.

Now that your changes have been applied, we need to update our ORM and TypeScript definitions, so our client in in sync with our database. Run `prisma:generate` for this.

> Note, you may need to restart your TypeScript language server to get the updated definitions. For Visual Studio, run `>TypeScript: Restart TS server` in your command palette.

And that's it!

If your in a hurry, you can run `prisma:omni` to invoke all 3 scripts in one.

### Seeding

If you want to seed collections, add a file to a Github Gist, and specify the filename as a seed pool in the `seed` section of a `Crud Interface`. You can choose what users are able to access the seed route too.

From `User`:

```typescript
  seed: [
    {
      unconditionalAccess: ["SUPER_USER"],
      pool: "admin",
    },
    {
      unconditionalAccess: ["SUPER_USER", "ADMIN_USER"],
      pool: "basic",
    },
  ],
```

use `.../<table>/seed/[:pool]`

You will need to set the hash as your `SEED_GIST_HASH` and the username as the `GITHUB_USERNAME` for the seeding to work. Otherwise, and exception will be thrown.

For reference, you can use my own Gist with the following variables

```shell
SEED_GIST_HASH=271fbf9f9d9ecd5bba6da1234eff1f79
GITHUB_USERNAME=aardhynlavender
```

## Code Linting

My codebase uses `ESLint` for linting, run `lint:check` for a a summary of errors and warnings, and run `lint:fix` to resolve them ( I do not advice this ).

## Coding Standard

### Prettier

Prettier makes my code look pretty! and it can make your additions look the same too!

For IDE's I'd advice configuring some sort of "format on save" feature. but for you command line junkies, run `prettier:check` to show any formatting problems. `prettier:write` will apply the rules, although this run when you commit staged files.

### File Headers and Function Descriptions

```

```

## Integration Testing

Run `qa:test` to run my integrated test suite.

As this will delete **all data currently in the database**. Please be careful--I'd recommend setting up a testing database for local development.

## Code Coverage

For more in-depth testing, use `qa:coverage` to run the test suite with a summative code coverage report at the end. This script will output an `html` report to the `coverage/` directory--open `index.html` to view the report if it does not open automatically at the end.

## Deployment

### Live Deployment

You can use the API right now by visiting [this site](https://laveat1-quiz-api.herokuapp.com/), or using the following url

```
https://laveat1-quiz-api.herokuapp.com/
```

### Custom Deployment ( Heroku )

Create your own deployment on Heroku by `fork`ing this repository on GitHub.

Create a `new app`, following the standard prompts.

Once created, head over to `Settings > Config Vars`, and add all the environment variables ( you _can_ leave out NODE_ENV ).

Under `Deploy > Deployment Method` use the `GitHub` option, and enter the name of your forked repository. ( if you have not already setup Heroku with GitHub, there may be some extra steps to getting this link working )

Enable automatic deploys, and thats it!

> Note, if your using a new Database for this deployed app, you might need to load it locally, and run a migration on it.

## License

Copyright 2022 Aardhyn Lavender

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
