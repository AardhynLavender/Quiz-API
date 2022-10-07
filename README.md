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
| PORT                 | Port to listen on                                                              |
| SHADOW_DATABASE_URL  | See `Prisma > Environment`                                                     |
| DATABASE_URL         | See `Prisma > Environment`                                                     |
| SESSION_LIFETIME     | How long your users are logged in for, measured in hours. Use a natural number |
| SEED_GIST_HASH       | See `Seeding > API`                                                            |
| GITHUB_USERNAME      | See `Seeding > API`                                                            |
| IMPLICIT_SEEDING     | Specify if the program should seed constants from **Open Trivia DB**           |
| NODE_ENV=development | Where is Node?... I like to be specific                                        |

####

## Prisma Configuration

### Entity Relationship Diagram

For reference, here's an ERD of the current database

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

### Studio

Prisma has a useful CRUD Application that runs in your browser. Great for visualizing your models, relationships, and performing quick modifications and deletions.

After you've run your a migration, check it out with the `prisma:studio` script.

### Seeding

If you want to seed collections, add a file to a Github Gist, and specify the filename as a seed pool in the `seed` section of a `Crud Interface`. You can choose what users are able to access the seed route too.

#### API

You can seed data into the database via API request. optionally specifying the `pool` to seed from.

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

Seed using

```
/<table>/seed/[:pool]
```

You will need to set the hash as your `SEED_GIST_HASH` and the username as the `GITHUB_USERNAME` for the seeding to work. Otherwise, and exception will be thrown.

For reference, you can use my own Gist with the following variables

```shell
SEED_GIST_HASH=271fbf9f9d9ecd5bba6da1234eff1f79
GITHUB_USERNAME=aardhynlavender
```

use `/users/seed/admin` to seed `ADMIN_USERS`. You will need at least one of these to create any quizzes or modify data.

Of course, this route is only accessible to `SUPER_USER` sessions...

#### Super Users

As `SUPER_USER`s are quite powerful, you can only seed them manually from the command line.

Use the `create_seeds` script and specify a `number` of users to create.

```
cd ./seeding
./create_seeds.sh 3
```

This will create the templates you need to create some super user seeds.

Use the `seed:super_users` npm script to load them into your database.

#### Implicit Seeding

The `Types`, `Categories`, and `Difficulties` models are checked and, if necessary, repopulated each time you run your API.

You can all so run this manually, by using the `seed:implicit` script, and setting `IMPLICIT_SEEDING` to `false`.

> Note, If you get any `foreign key constraint` errors on any of the aforementioned tables, running this script should resolve the relationships.

## Code Linting

My codebase uses **ESLint** for linting, run `lint:check` for a a summary of errors and warnings, and run `lint:fix` to resolve them ( I do not advice this ).

## Coding Standard

### Prettier

**Prettier** makes my code look pretty! and it can make your additions look the same too!

For IDE's and fancy Text Editors I'd advice configuring some sort of "format on save" feature. but for you 'command line crusaders', run `prettier:check` to show any formatting problems. `prettier:write` will apply the rules, although this run automatically when you commit staged files.

### File Headers and Function Descriptions

```

```

## Integration Testing

Run `qa:test` to run my integrated test suite.

As this will delete **all data currently in the database**, please be careful -- I'd recommend setting up a testing database for local development.

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

Once created, head over to `Settings > Config Vars`, and add all the environment variables ( you _can_ leave out `NODE_ENV` ).

Under `Deploy > Deployment Method` use the `GitHub` option, and enter the name of your forked repository. ( if you have not already setup Heroku with GitHub, there may be some extra steps to getting this link working )

Enable automatic deploys, and thats it!

> Note, if your using a new Database for this deployed app, you will need to load it locally, and run a migration on it.

## License

Copyright 2022 Aardhyn Lavender

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
