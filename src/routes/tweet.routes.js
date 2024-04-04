import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewere.js";
import {
  createtweet,
  deleteTweet,
  getUserTweets,
  updateTweet,
} from "../controllers/tweet.controller.js";

const router = Router();
router.use(verifyJWT);

router.route("/").post(createtweet);
router.route("/up/:tweetid").post(updateTweet);
router.route("/dl/:tweetid").post(deleteTweet);
router.route("/getusertweet/:userid").get(getUserTweets);

export default router;
