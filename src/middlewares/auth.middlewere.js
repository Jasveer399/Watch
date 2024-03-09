import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/ayncHandler.js";
import { User } from "../models/user.models.js";
import { acctoken } from "../controllers/user.controller.js";
export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    let token;
    const jwtPromise = acctoken;
   await jwtPromise.then((t) => {
      token = t; // This will log the JWT string
    });
    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
