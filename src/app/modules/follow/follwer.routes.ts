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
router.delete("/unfollow-dating", auth(), follwerController.unfollowDatingUser);

// 
router.post("/accept-or-reject", auth(), follwerController.acceptOrRejectFollwershipRequest);
router.get("/friends/:type", auth(), follwerController.getMyAllFriends);
router.get("/follwer-request/:type", auth(), follwerController.getMyAllFollwerRequest);
router.get("/follwing-request/:type", auth(), follwerController.getMyAllFollwingRequest);
router.get("/suggested-user/:type", auth(), follwerController.getAllSuggestedUsers);

export const follwerRoutes = router;
