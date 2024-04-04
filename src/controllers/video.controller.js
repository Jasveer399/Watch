import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiRespons.js";
import { asyncHandler } from "../utils/ayncHandler.js";
import { uploadFileonCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video

  if (!title || !description) {
    throw new ApiError(401, "title and description Both are required");
  }
  const videoLocalPath = req.files?.videoFile[0].path;
  const thumbnailLocalPath = req.files?.thumbnail[0].path;

  if (!videoLocalPath) {
    throw new ApiError(401, "Video File is Required");
  }
  if (!thumbnailLocalPath) {
    throw new ApiError(401, "Thumbnail is Required");
  }
  const videoFile = await uploadFileonCloudinary(videoLocalPath);
  const thumbnail = await uploadFileonCloudinary(thumbnailLocalPath);

  if (!videoFile) {
    throw new ApiError(500, "Video File is not uploaded due to server error");
  }

  if (!thumbnail) {
    throw new ApiError(
      500,
      "thumbnail File is not uploaded due to server error"
    );
  }

  const video = await Video.create({
    title: title,
    description: description,
    videoFile: videoFile?.url,
    thumbnail: thumbnail?.url,
    duration: videoFile?.duration,
    owner: req.user?._id,
    isPublished: false,
  });
  const videoUploaded = await Video.findById(video._id);

  if (!videoUploaded) {
    throw new ApiError(500, "videoUpload failed please try again !!!");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, "video uploaded successfully", video));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  if (!videoId) {
    throw new ApiError(401, "Plz Provide video id");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(401, "Provide valid video id");
  }
  return res.status(200).json(new ApiResponse(200, "video found", video));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  if (!(title && description)) {
    throw new ApiError(400, "title and description are required");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "No video found");
  }

  if (video?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      400,
      "You can't edit this video as you are not the owner"
    );
  }

  const thumbnailLocalPath = req.file?.path;

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "thumbnail is required");
  }

  const thumbnail = await uploadFileonCloudinary(thumbnailLocalPath);

  if (!thumbnail) {
    throw new ApiError(400, "thumbnail not found");
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: thumbnail.url,
      },
    },
    { new: true }
  );

  if (!updatedVideo) {
    throw new ApiError(500, "Failed to update video please try again");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }
  const video = await Video.findById(videoId);
  if (video?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      400,
      "You can't edit this video as you are not the owner"
    );
  }
  const deletedvideo = await Video.findByIdAndDelete(videoId);
  if (!deletedvideo) {
    throw new ApiError(400, "Video is Not Delete.try Again");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(
      400,
      "You can't edit this video as you are not the owner"
    );
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  if (video?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      400,
      "You can't edit this video as you are not the owner"
    );
  }
  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video?.isPublished,
      },
    },
    { new: true }
  );
  if (!updatedVideo) {
    throw new ApiError(500, "Failed to toogle video publish status");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, "Video publish toggled successfully", {
        isPublished: updatedVideo.isPublished,
      })
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
