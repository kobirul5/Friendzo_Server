import { Server } from "http";
import config from "./config";
import prisma from "./shared/prisma";
import app from "./app";
import { setupWebSocket } from "./helpars/websocket";
import { initiateSuperAdmin } from "./app/db/db";
import { startCronJobs } from "./cron/cron";

let server: Server;

async function startServer() {
  try {
    console.log("🔌 Connecting to database...");
    await prisma.$connect();
    console.log("✅ Prisma connected successfully!");

    server = app.listen(config.port, () => {
      console.log(`🚀 Server is listening on port ${config.port}`);
    });

    setupWebSocket(server);
    startCronJobs();

    const gracefulShutdown = async () => {
      console.log("⚠️ Shutting down gracefully...");
      if (server) server.close();
      await prisma.$disconnect();
      process.exit(0);
    };

    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);
    process.on("beforeExit", gracefulShutdown);
  } catch (error) {
    console.error("❌ Server startup failed:", error);
    process.exit(1);
  }
}

startServer();
