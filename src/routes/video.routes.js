import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middlewere.js";
import {
  deleteVideo,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
} from "../controllers/video.controller.js";

const router = Router();

router.route("/publishvideo").post(
  verifyJWT,
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishAVideo
);
router.route("/:videoId").get(getVideoById);
router
  .route("/update/:videoId")
  .patch(verifyJWT, upload.single("thumbnail"), updateVideo);
router.route("/delete/:videoId").delete(verifyJWT, deleteVideo);
router.route("/status/:videoId").patch(verifyJWT, togglePublishStatus);
export default router;
