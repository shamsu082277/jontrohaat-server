import { createServer } from "node:http";
import { createApp } from "./app.js";
import { connectDatabase, closeDatabase } from "./config/db.js";
import { env } from "./config/env.js";

const app = createApp();
const server = createServer(app);

async function start() {
  try {
    await connectDatabase();
    console.log(`MongoDB connected to ${env.DB_NAME}`);
  } catch (error) {
    console.error(`MongoDB connection unavailable: ${error.message}`);
  }

  server.listen(env.PORT, () => {
    console.log(`Server listening on port ${env.PORT}`);
  });
}

async function shutdown(signal) {
  server.close(async () => {
    await closeDatabase();
    console.log(`${signal} received; server stopped`);
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

start();
