import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { followerController } from "./follower.controller";

const router = express.Router();

router.post("/", auth(), followerController.createFollower);

router.get("/count", auth(), followerController.getMyFollowersAndFollowingCount);
router.get("/follower", auth(), followerController.getMyAllFollower);
router.get("/following", auth(), followerController.getMyAllFollowing);
router.delete("/unfollow", auth(), followerController.unfollowUser);
router.delete("/unfollow-user", auth(), followerController.unfollowUserBYUserId);
router.delete("/unfollow-dating", auth(), followerController.unfollowDatingUser);

//
router.put("/accept-request-notification", auth(), followerController.acceptFollowerRequestNotification);
router.put("/accept-or-decline", auth(), followerController.acceptOrDeclineFollowerRequestByUserId);

router.post("/accept-or-reject", auth(), followerController.acceptOrRejectFollowershipRequest);
router.get("/friends/:type", auth(), followerController.getMyAllFriends);
router.get("/follower-request/:type", auth(), followerController.getMyAllFollowerRequest);
router.get("/following-request/:type", auth(), followerController.getMyAllFollowingRequest);
router.get("/suggested-user/:type", auth(), followerController.getAllSuggestedUsers);
router.put("/unfriend", auth(), followerController.unfriendUser);
router.get("/see-follower/:id", auth(), followerController.getSeeFollower);
router.get("/see-following/:id", auth(), followerController.getSeeFollowing);


export const followerRoutes = router;
