import { Server } from "http";
import os from "os";
import config from "./config";
import prisma from "./shared/prisma";
import app from "./app";
import { setupWebSocket } from "./helpars/websocket";
import { initiateSuperAdmin } from "./app/db/db";
import { startCronJobs } from "./cron/cron";

let server: Server;
let isShuttingDown = false;

function getLocalIp() {
  const interfaces = os.networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] ?? []) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }

  return "127.0.0.1";
}

async function startServer() {
  try {
    const localIp = getLocalIp();

    console.log("Connecting to database...");
    await prisma.$connect();
    console.log("Prisma connected successfully!");

    // await initiateSuperAdmin();

    server = app.listen(config.port, () => {
      console.log(
        `Server is listening on http://localhost:${config.port}/api/v1`
      );
      console.log(
        `Server is listening on http://${localIp}:${config.port}/api/v1`
      );
    });

    setupWebSocket(server);
    startCronJobs();
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
}

async function shutdownServer() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log("Shutting down gracefully...");

  try {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          console.info("Server closed!");
          resolve();
        });
      });
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error("Error during shutdown:", error);
  } finally {
    isShuttingDown = false;
  }

  process.exit(0);
}

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  void shutdownServer();
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection:", error);
  void shutdownServer();
});

process.on("SIGTERM", () => {
  console.log("SIGTERM signal received.");
  void shutdownServer();
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received.");
  void shutdownServer();
});

void startServer();