import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiRespons.js";
import { asyncHandler } from "../utils/ayncHandler.js";

const createtweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "content is required");
  }
  const tweet = await Tweet.create({ content: content, owner: req.user?._id });

  if (!tweet) {
    throw new ApiError(500, "Server Error: Couldn't create tweet");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, "Tweet created successfully", tweet));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { tweetid } = req.params;

  if (!content) {
    throw new ApiError(400, "content is required");
  }
  if (!tweetid) {
    throw new ApiError(404, "Tweet id not found");
  }
  let tweet = await Tweet.findById(tweetid);
  if (!tweet) {
    throw new ApiError(404, "No such Tweet exists!");
  }
  //checking the user who is trying to update the tweet
  if (String(req.user?._id) !== String(tweet.owner?._id)) {
    throw new ApiError(401, "You don't have permission to perform this action");
  }
  const newtweet = await Tweet.findByIdAndUpdate(
    tweetid,
    {
      $set: {
        content: content,
        updatedAt: Date.now(),
      },
    },
    {
      new: true,
    }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, "New Tweet Updated Successfully!", newtweet));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetid } = req.params;
  if (!tweetid) {
    throw new ApiError(404, "Tweet id not found");
  }
  let tweet = await Tweet.findById(tweetid);
  if (!tweet) {
    throw new ApiError(404, "No such Tweet exists!");
  }
  //checking the user who is trying to update the tweet
  if (String(req.user?._id) !== String(tweet.owner?._id)) {
    throw new ApiError(401, "You don't have permission to perform this action");
  }
  await Tweet.findByIdAndDelete(tweetid);
  return res
    .status(200)
    .json(new ApiResponse(200, "Tweet Deleted Successfully!"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userid } = req.params;

  if (!isValidObjectId(userid)) {
    throw new ApiError(404, "Invalid User ID");
  }
  const alltweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userid),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerdetail",
        pipeline: [
          {
            $project: {
              userName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likedetail",
        pipeline: [
          {
            $project: {
              likedBy: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        likeCount: {
          $size: "$likedetail",
        },
        ownerdetail: {
          $first: "$ownerdetail",
        },
        isliked: {
          $cond: {
            if: { $in: [req.user?._id, "$likedetail.isliked"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        content: 1,
        createdAt: 1,
        ownerdetail: 1,
        likedetail: 1,
        likeCount: 1,
        isliked: 1,
      },
    },
  ]);

  if (!alltweets) {
    throw new ApiError(404, "tweets not found");
  }
  return res.status(200).json(new ApiResponse(200, "success", alltweets));
});

export { createtweet, updateTweet, deleteTweet, getUserTweets };
