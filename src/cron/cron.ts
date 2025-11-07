
import cron from "node-cron";
import prisma from "../shared/prisma";

// Runs every 1 minute (for testing)
export const startCronJobs = () => {
  cron.schedule("*/1 * * * *", async () => {
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
