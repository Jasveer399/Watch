import { asyncHandler } from "../utils/ayncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadFileonCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiRespons.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
const genrateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.genrateAccessToken();
    const refreshToken = user.genrateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong While generating Access And Referesh Token"
    );
  }
};
const registerUser = asyncHandler(async (req, res) => {
  const { userName, email, password, fullName } = req.body;
  //   console.log(userName);

  if (
    [fullName, userName, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields must be Required");
  }

  const existedUser = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "This User already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  //   const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar Local File Path is Required");
  }

  const avatar = await uploadFileonCloudinary(avatarLocalPath);
  const coverImage = await uploadFileonCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar File is Required");
  }

  const user = await User.create({
    userName: userName.toLowerCase(),
    fullName,
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong creating the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User created successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { userName, email, password } = req.body;

  if (!userName && !email) {
    throw new ApiError(400, "Username or Email are required fields");
  }
  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (!user) {
    throw new ApiError(401, "Invalid Credentials");
  }
  // Check Password
  const matchPassword = await user.isPasswordCorrect(password);

  if (!matchPassword) {
    throw new ApiError(401, "Password is invalid. Enter valid Password");
  }

  let { accessToken, refreshToken } = await genrateAccessAndRefereshTokens(
    user._id
  );
  const loggedUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  let token;
  await accessToken.then((t) => {
    token = t; // This will log the JWT string
  });
  accessToken = token;
  await refreshToken.then((t) => {
    token = t;
  });
  refreshToken = token;
  return res
    .status(201)
    .cookie("accessToken", accessToken)
    .cookie("refreshToken", refreshToken)
    .json(
      new ApiResponse(
        200,
        // {
        //   user: { loggedUser, accessToken, refreshToken },
        // },
        "User Logged in successfully",
        {
          user: loggedUser,
          accessToken,
          refreshToken,
        }
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  console.log(req.user);
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logout"));
});

const refereshAccessToken = asyncHandler(async (req, res) => {
  const incomingrefreshtoken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingrefreshtoken) {
    throw new ApiError(400, "Unauthorized Refresh Token");
  }
  try {
    const decodedtoken = jwt.verify(
      incomingrefreshtoken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedtoken._id);

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    if (incomingrefreshtoken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token does not match!");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newrefreshToken } =
      await genrateAccessAndRefereshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newrefreshToken, options)
      .json(
        new ApiResponse(200, "Access token refreshed", {
          accessToken,
          refreshToken: newrefreshToken,
        })
      );
  } catch (error) {
    throw new ApiError(401, "Invalid Refresh Token", error);
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldpassword, newpassword } = req.body;
  if (!newpassword) {
    throw new ApiError(401, "Invalid data", "New password is required");
  }
  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldpassword);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Password is not correct", "Old Password is wrong");
  }

  user.password = newpassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, "Current user info", req.user));
});

const updateUserdetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(401, "Both fullname and email are required fields");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName: fullName,
        email: email,
      },
    },
    { new: true }
  ).select("-password");

  return res.status(200).json(new ApiResponse(200, "Profile updated", user));
});

const updatedUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  console.log(avatarLocalPath);

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar File is Missing");
  }
  const avatar = await uploadFileonCloudinary(avatarLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Error While uploading  Avatar to Cloudinary");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar?.url,
      },
    },
    {
      new: true,
    }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, "Avatar Updated Successfully", user));
});

const updatedUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Avatar File is Missing");
  }
  const coverImage = await uploadFileonCloudinary(coverImageLocalPath);

  if (!coverImage) {
    throw new ApiError(400, "Error While uploading  CoverImage to Cloudinary");
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: coverImage?.url,
      },
    },
    {
      new: true,
    }
  );
  console.log(user);
  return res
    .status(200)
    .json(new ApiResponse(200, "Avatar Updated Successfully", user));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { userName } = req.params;
  if (!userName.trim()) {
    throw new ApiError(400, "UserName is Missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        userName: userName?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channal",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelSubscriberdCount: {
          $size: "$subscribedTo",
        },
        isSubscriberd: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        userName: 1,
        subscribersCount: 1,
        channelSubscriberdCount: 1,
        isSubscriberd: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "No channel available");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Channel Fetched SuccessFully", channel[0]));
});

const getWatchHistoty = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    userName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  if (!user) {
    throw new ApiError(404, "User not found", error.message);
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Watch History Fatched Successuflly",
        user[0].watchHistory
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refereshAccessToken,
  changeCurrentPassword,
  updateUserdetails,
  getCurrentUser,
  updatedUserAvatar,
  updatedUserCoverImage,
  getUserChannelProfile,
  getWatchHistoty,
};
