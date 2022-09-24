// ENVIRONMENT

import dotenv from "dotenv";

dotenv.config();
import {
  AssertEnvironmentVariable,
  Environment,
  EnvironmentVariable,
} from "./util/environment";

console.log("\nChecking local ENV...");
for (const variable of [
  "DATABASE_URL",
  "SHADOW_DATABASE_URL",
  "PORT",
  "JWT_SECRET",
  "JWT_LIFETIME",
  "SEED_GIST_HASH",
  "GITHUB_USERNAME",
  "NODE_ENV",
] as EnvironmentVariable[])
  AssertEnvironmentVariable(variable);
console.log("...Checks complete!");

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

// RATE-LIMITING

import rateLimit from "express-rate-limit";
if (Environment.NODE_ENV !== "QA") {
  const REQUESTS_PM = 25;
  const rateLimitConfig = rateLimit({
    max: REQUESTS_PM,
  });

  app.use(rateLimitConfig);
}

// ROUTES

import CreateRoute from "./routes/v1/route";

// Auth
import { SKIP_MIDDLEWARE } from "./api";
import Authentication from "./routes/v1/auth";
CreateRoute(app, Authentication, "auth", SKIP_MIDDLEWARE);

// User
import User from "./routes/v1/user";
CreateRoute(app, User, "users");

// Quiz
import Quiz from "./routes/v1/quiz";
CreateRoute(app, Quiz, "quizzes");

// Root
import listEndpoints from "express-list-endpoints";
import Root from "./routes/v1/root";
const endpoints = listEndpoints(app).map((endpoint) => ({
  path: endpoint.path,
  methods: endpoint.methods,
}));
const root = Root("API Available Endpoints", endpoints);
CreateRoute(app, root, "", SKIP_MIDDLEWARE, false);

// Default
import CreateDefaultRoute from "./routes/v1/defaultRoute";
CreateDefaultRoute(app, "No handler is available for the provided URL");

(async () => {
  try {
    const PORT = Environment.PORT;

    app.listen(PORT, (): void => {
      console.log(`Server is listening on port ${PORT}`);
    });
  } catch (error: unknown) {
    console.error("Failed to start server!");
    console.error(error);
  }
})();

export default app;
