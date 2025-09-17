import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { follwerController } from "./follwer.controller";

const router = express.Router();

router.post("/", auth(), follwerController.createFollwer);

router.get("/count", auth(), follwerController.getMyFollowersAndFollowingCount);
router.get("/follower", auth(), follwerController.getMyAllFollwer);
router.get("/following", auth(), follwerController.getMyAllFollowing);
router.delete("/unfollow", auth(), follwerController.unfollowUser);

// 
router.post("/accept-or-reject", auth(), follwerController.acceptOrRejectFollwershipRequest);
router.get("/friends/:type", auth(), follwerController.getMyAllFriends);

export const follwerRoutes = router;
