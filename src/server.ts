// import { Server } from "http";
// import config from "./config";

// import prisma from "./shared/prisma";
// import app from "./app";
// import { setupWebSocket } from "./helpars/websocket";
// import { initiateSuperAdmin } from "./app/db/db";

// let server: Server;

// async function startServer() {
//   server = app.listen(config.port, () => {
//     console.log("Server is listiening on port ", config.port);
//   });
//   setupWebSocket(server);
//   await initiateSuperAdmin();
// }

// async function main() {
//   await startServer();
//   const exitHandler = () => {
//     if (server) {
//       server.close(() => {
//         console.info("Server closed!");
//         restartServer();
//       });
//     } else {
//       process.exit(1);
//     }
//   };

//   const restartServer = () => {
//     console.info("Restarting server...");
//     main();
//   };

//   process.on("uncaughtException", (error) => {
//     console.log("Uncaught Exception: ", error);
//     exitHandler();
//   });

//   process.on("unhandledRejection", (error) => {
//     console.log("Unhandled Rejection: ", error);
//     exitHandler();
//   });

//   // Handling the server shutdown with SIGTERM and SIGINT
//   process.on("SIGTERM", () => {
//     console.log("SIGTERM signal received. Shutting down gracefully...");
//     exitHandler();
//   });

//   process.on("SIGINT", () => {
//     console.log("SIGINT signal received. Shutting down gracefully...");
//     exitHandler();
//   });
// }

// main();



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

    // ✅ WebSocket setup
    setupWebSocket(server);
    // ✅ Start cron jobs
    startCronJobs();  // <-- start your cron jobs here

    // // ✅ Initialize super admin asynchronously (non-blocking)
    // initiateSuperAdmin()
    //   .then(() => console.log("👑 Super admin initialized"))
    //   .catch((err) => console.error("Super admin init failed:", err));

    // ✅ Graceful shutdown handling
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
