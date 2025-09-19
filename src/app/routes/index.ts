import express from "express";
import { userRoutes } from "../modules/User/user.route";
import { AuthRoutes } from "../modules/Auth/auth.routes";
import { memoriesRoutes } from "../modules/memories/memories.routes";
import { eventsRoutes } from "../modules/event/event.routes";
import { likesRoutes } from "../modules/like/like.routes";
import { commentRoutes } from "../modules/comment/comment.routes";
import { profileRoutes } from "../modules/profile/profile.routes";
import { follwerRoutes } from "../modules/follow/follwer.routes";
import { adminRoutes } from "../modules/admin/admin.routes";
import { reportRoutes } from "../modules/report/report.routes";
import { blockRoutes } from "../modules/block/block.routes";
import { discoverByInterestRoutes } from "../modules/discoverByInterest/discoverByInterest.routes";
import { ChatRoutes } from "../modules/chatFile/chatRouter";
import { findByInterestRoutes } from "../modules/dating/findByInterest/findByInterest.routes";
import { giftCardRoutes } from "../modules/admin/giftCard/giftCard.routes";
import { coinsRoutes } from "../modules/admin/coins/coins.routes";
import { giftRoutes } from "../modules/dating/gift/gift.routes";
import path from "path";
import { datingCoinsRoutes } from "../modules/dating/coins/coins.routes";
import { paymentsRoutes } from "../modules/payments/payments.routes";

// import { ReviewRoutes } from "../modules/review/review.route";



const router = express.Router();

const moduleRoutes = [
  {
    path: "/users",
    route: userRoutes,
  },
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/memories",
    route: memoriesRoutes,
  },
  {
    path: "/events",
    route: eventsRoutes,
  },
  {
    path: "/likes",
    route: likesRoutes,
  },
  {
    path: "/comment",
    route: commentRoutes,
  },
  {
    path: "/profile",
    route: profileRoutes,
  },
  {
    path: "/follow",
    route: follwerRoutes,
  },
  {
    path: "/admin",
    route: adminRoutes,
  },
  {
    path: "/report",
    route: reportRoutes,
  },
  {
    path: "/block",
    route: blockRoutes,
  },
  {
    path: "/discoverByInterest",
    route: discoverByInterestRoutes,
  },
  {
    path: "/chat",
    route: ChatRoutes,
  },
  {
    path: "/find-by-interest",
    route: findByInterestRoutes
  },
  {
    path: "/gift-card",
    route: giftCardRoutes
  },
  {
    path:"/gift",
    route: giftRoutes
  },
  {
    path: "/coins",
    route: coinsRoutes
  },
  {
    path: "/dating-coins",
    route: datingCoinsRoutes
  },
  {
    path: "/payment",
    route: paymentsRoutes
  }
 
  // {
  //   path: "/reviews",
  //   route: ReviewRoutes,
  // }

];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
