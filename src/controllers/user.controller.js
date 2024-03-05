import { asyncHandler } from "../utils/ayncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadFileonCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiRespons.js";

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
   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length >0)
   {
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

  const user = await User.create(
   {
      userName:userName.toLowerCase(),
      fullName,
      email,
      password,
      avatar:avatar.url,
      coverImage:coverImage?.url || "",
   }
  )
  const createdUser = await User.findById(user._id).select(
   "-password -refreshToken"
  );

  if (!createdUser) {
     throw new ApiError(500,"Something went wrong creating the user");
  }

  return res.status(201).json(
   new ApiResponse(200,createdUser,"User created successfully",)
  );

});

export { registerUser };
