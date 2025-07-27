import express from "express";
import { userRoutes } from "../modules/User/user.route";
import { AuthRoutes } from "../modules/Auth/auth.routes";
import { memoriesRoutes } from "../modules/memories/memories.routes";
import { eventsRoutes } from "../modules/event/event.routes";

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
 
  // {
  //   path: "/reviews",
  //   route: ReviewRoutes,
  // }

];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
