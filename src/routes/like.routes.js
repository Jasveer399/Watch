import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewere.js";
import {
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
} from "../controllers/like.controller.js";

const routes = Router();

routes.route("/commentlike").post(verifyJWT, toggleCommentLike);
routes.route("/videolike/:videoId").post(verifyJWT, toggleVideoLike);
routes.route("/tweetlike/:tweetId").patch(verifyJWT, toggleTweetLike);

export default routes;
