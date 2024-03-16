import {
  changeCurrentPassword,
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistoty,
  loginUser,
  logoutUser,
  refereshAccessToken,
  registerUser,
  updateUserdetails,
  updatedUserAvatar,
  updatedUserCoverImage,
} from "../controllers/user.controller.js";
import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middlewere.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refereshAccessToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/updateUserdetails").patch(verifyJWT, updateUserdetails);
router
  .route("/avatar")
  .patch(verifyJWT, upload.single("avatar"), updatedUserAvatar);
router
  .route("/coverImage")
  .patch(verifyJWT, upload.single("coverImage"), updatedUserCoverImage);
router.route("/c/:userName").get(verifyJWT, getUserChannelProfile);
router.route("/history").get(verifyJWT, getWatchHistoty);

export default router;
