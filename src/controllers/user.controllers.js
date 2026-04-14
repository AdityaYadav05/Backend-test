import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: "user register successfully",
  });

  //get data from request body
  // get user details from frontend
  // validate user details
  // check if user already exists
  // if user exists, send error response
  // check for images , check for avatar and cover image
  // upload them to cloudinary and get tha URL of the uploaded images
  // create user in database with the details and the URLs of the uploaded images
  // create user object - create entry in database
  // remove password and refresh token from the user object before sending the response
  // check for user creation
  // return response to frontend with the user details and access token and refresh token

  // 1 get user details from the request body
  const { name, email, username, password } = req.body;
  console.log(name, email, username, password);

  // if(fullName === ""){
  // throw new ApiError(400, 'fullName is required')
  // }

  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with username or Password already existed");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar files is required ");
  }

  const avatar = await uploadToCloudinary(avatarLocalPath);
  const coverImage = await uploadToCloudinary(coverLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar files is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.Url,
    coverImageL: coverImage || "",
    email,
    password,
    email,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user")
  }

return res.status(201).json(
  new ApiResponse(200, createdUser, "User registered successfully")
)
  
});

export { registerUser };
