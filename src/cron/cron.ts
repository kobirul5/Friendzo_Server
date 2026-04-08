
import cron from "node-cron";
import prisma from "../shared/prisma";

//  Keep-Alive: Ping own server every 10 min to prevent Render free-tier sleep 
const SELF_URL = process.env.SERVER_URL || "http://localhost:5000/api/v1/health";
const DAY_IN_MS = 24 * 60 * 60 * 1000;

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

  // daily shift event start dates by one day
  cron.schedule("0 0 * * *", async () => {
    console.log("Running event startedAt shift cron...");

    try {
    // 1. 
    const events = await prisma.event.findMany({
      where: {
        startedAt: {
          not: null,
        },
      },
      select: {
        id: true,
        startedAt: true,
      },
    });

    if (events.length === 0) {
      console.log("No events to shift.");
      return;
    }

    // 2. 
    const updatePromises = events.map((event) => {
      if (!event.startedAt) return null; // safety check
      const nextStartedAt = new Date(event.startedAt.getTime() + DAY_IN_MS);

      return prisma.event.update({
        where: { id: event.id },
        data: { startedAt: nextStartedAt },
      });
    });

    const results = await Promise.all(updatePromises);

    const updatedCount = results.filter(Boolean).length;
    const skippedCount = events.length - updatedCount;

    console.log(
      `Successfully shifted ${updatedCount} event start dates by one day.`,
      { skippedCount }
    );
    } catch (error) {
      console.error("Event startedAt shift cron failed:", error);
    }
  });
};
