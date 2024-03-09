import { asyncHandler } from "../utils/ayncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadFileonCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiRespons.js";
import jwt from "jsonwebtoken";
let acctoken;
const genrateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.genrateAccessToken();
    const refereshToken = user.genrateRefreshToken();

    user.refreshToken = refereshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refereshToken };
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

  const { accessToken, refereshToken } = await genrateAccessAndRefereshTokens(
    user._id
  );
  acctoken = accessToken;
  const loggedUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(201)
    .cookie("accessToken", accessToken)
    .cookie("refreshToken", refereshToken)
    .json(
      new ApiResponse(
        200,
        { user: loggedUser, accessToken, refereshToken },
        "User Logged in successfully"
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

  res
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
  
    if(!user)
    {
      throw new ApiError(401,"Invalid Refresh Token");
    }
  
    if(incomingrefreshtoken !== user?.refreshToken)
    {
      throw new ApiError(401,"Refresh token does not match!");
    }
     
    const options = {
      httpOnly: true,
      secure: true,
    };
  
   const {accessToken,newrefreshToken} =await genrateAccessAndRefereshTokens(user._id);
  
   return res
          .status(200)
          .cookie("accessToken", accessToken, options)
          .cookie("refreshToken", newrefreshToken, options)
          .json(
              new ApiResponse(
                  200, 
                  {accessToken, refreshToken: newrefreshToken},
                  "Access token refreshed"
              )
          )
  } catch (error) {
      throw new ApiError(401,"Invalid Refresh Token",error)
  }
});

export { registerUser, loginUser, logoutUser, refereshAccessToken,acctoken };
