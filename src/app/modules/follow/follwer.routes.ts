import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { followerController } from "./follwer.controller";

const router = express.Router();

router.post("/", auth(), followerController.createFollwer);

router.get("/count", auth(), followerController.getMyFollowersAndFollowingCount);
router.get("/follower", auth(), followerController.getMyAllFollwer);
router.get("/following", auth(), followerController.getMyAllFollowing);
router.delete("/unfollow", auth(), followerController.unfollowUser);
router.delete("/unfollow-dating", auth(), followerController.unfollowDatingUser);

// 
router.put("/accept-request-notification", auth(), followerController.acceptFollowerRequestNotification);
router.put("/accept-or-decline", auth(), followerController.acceptOrDeclineFollwerRequestByUserId);

router.post("/accept-or-reject", auth(), followerController.acceptOrRejectFollwershipRequest);
router.get("/friends/:type", auth(), followerController.getMyAllFriends);
router.get("/follwer-request/:type", auth(), followerController.getMyAllFollwerRequest);
router.get("/follwing-request/:type", auth(), followerController.getMyAllFollwingRequest);
router.get("/suggested-user/:type", auth(), followerController.getAllSuggestedUsers);
router.put("/unfriend/:type", auth(), followerController.unfriendUser);

export const follwerRoutes = router;
