import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiRespons.js";
import { asyncHandler } from "../utils/ayncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid object ID");
  }
  let likedvideo = await Like.findOne({
    video: videoId,
    likedBy: req.user?._id,
  });
  if (likedvideo) {
    await Like.findByIdAndDelete(likedvideo?._id);
    return res
      .status(200)
      .json(new ApiResponse(200, "Success", { isliked: false }));
  }
  await Like.create({
    video: videoId,
    likedBy: req.user?._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Success", { isliked: true }));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid ObjectID");
  }
  const likeAllready = await Like.findOne({
    comment: commentId,
    likedBy: req.user?._id,
  });
  if (likeAllready) {
    await Like.findByIdAndDelete(likeAllready?._id);
    return res
      .status(200)
      .json(new ApiResponse(200, "Success", { isliked: false }));
  }
  await Like.create({
    comment: commentId,
    likedBy: req.user?._id,
  });
  return res.status(200).json(
    new ApiResponse(200, "Comment liked by" + req.user?.userName, {
      isLiked: true,
    })
  );
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(404, "Invalid tweetid");
  }
  const likedtweet = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user?._id,
  });
  if (likedtweet) {
    await Like.findByIdAndDelete(likedtweet?._id);
    return res
    .status(200)
    .json(
      new ApiResponse(200, "Tweet is not liked",{
        isliked: false,
      })
    );
  }
  await Like.create({
    tweet: tweetId,
    likedBy: req.user?._id,
  });
  return res
    .status(200)
    .json(
      new ApiResponse(200, "Tweet Liked by " + req.user?.userName, {
        isliked: true,
      })
    );
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
