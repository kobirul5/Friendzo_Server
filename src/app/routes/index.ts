import express from "express";
import { userRoutes } from "../modules/User/user.route";
import { AuthRoutes } from "../modules/Auth/auth.routes";
import { memoriesRoutes } from "../modules/memories/memories.routes";
import { eventsRoutes } from "../modules/event/event.routes";
import { likesRoutes } from "../modules/like/like.routes";
import { commentRoutes } from "../modules/comment/comment.routes";
import { profileRoutes } from "../modules/profile/profile.routes";

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
 
  // {
  //   path: "/reviews",
  //   route: ReviewRoutes,
  // }

];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
