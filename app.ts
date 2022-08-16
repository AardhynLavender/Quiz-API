// ENVIRONMENT

import dotenv from "dotenv";
dotenv.config();

// EXPRESS

import express, { urlencoded, json } from "express";
const app = express();

app.use(urlencoded({ extended: false }));
app.use(json());

// COMPRESSION

import compression from "compression";
app.use(compression());

// CACHING

import cacheRoute from "./middleware/cache";
app.use(cacheRoute as any);

// CROSS ORIGIN

import cors from "cors";
app.use(cors());

// HELMET

import helmet from "helmet";
app.use(helmet());

// ROUTES

import { SKIP_MIDDLEWARE } from "./api";
import CreateRoute from "./routes/v1/route";

import Authentication from "./routes/v1/auth";
import User from "./routes/v1/user";

CreateRoute(app, Authentication, "auth", SKIP_MIDDLEWARE);
CreateRoute(app, User, "users");
// CreateRoute(app, institutions, "institutions");
// CreateRoute(app, departments, "departments");

// ERROR CHECKS

import {
  AssertEnvironmentVariable,
  Environment,
  EnvironmentVariable,
} from "./util/environment";

(async () => {
  try {
    console.log("\nChecking local ENV...");
    for (const variable of [
      "DATABASE_URL",
      "SHADOW_DATABASE_URL",
      "PORT",
      "JWT_SECRET",
      "JWT_LIFETIME",
    ] as EnvironmentVariable[])
      AssertEnvironmentVariable(variable);

    const PORT = Environment.PORT;
    app.listen(PORT, (): void => {
      console.log(`Server is listening on port ${PORT}`);
    });
  } catch (error: any) {
    console.error("Failed to start server!");
    console.error(error);
  }
})();
