
import cron from "node-cron";
import prisma from "../shared/prisma";

//  Keep-Alive: Ping own server every 10 min to prevent Render free-tier sleep 
const SELF_URL = process.env.SERVER_URL || "http://localhost:5000/api/v1/health";

const keepAlive = () => {
  cron.schedule("*/10 * * * *", async () => {
    try {
      const res = await fetch(SELF_URL);
      console.log(` Keep-alive ping → ${res.status} ${res.statusText}`);
    } catch (error) {
      console.warn("  Keep-alive ping failed:", error);
    }
  });
};

//  Daily: Decrement boost & priorityLikes 
export const startCronJobs = () => {
  // self-ping
  keepAlive();

  // daily decrement
  cron.schedule("0 0 * * *", async () => {
    console.log("🕐 Running boost/priorityLikes decrement cron...");

    try {
      const boost = await prisma.user.updateMany({
        where: { boosts: { gt: 0 } },
        data: { boosts: { decrement: 1 } },
      });

      const priorityLikes = await prisma.user.updateMany({
        where: { priorityLikes: { gt: 0 } },
        data: { priorityLikes: { decrement: 1 } },
      });

      console.log(
        "✅ Successfully decremented boost and priorityLikes",
        boost,
        priorityLikes
      );
    } catch (error) {
      console.error("❌ Cron job failed:", error);
    }
  });
};
