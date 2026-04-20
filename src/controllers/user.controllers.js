import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


// generate Access and refresh Tokens methods 
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "somethings went wrong while generating refresh and access token"
    );
  }
};


// user register here 
const registerUser = asyncHandler(async (req, res) => {
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
  const { fullName, email, password } = req.body;
  console.log(fullName, email, password);

  // if(fullName === ""){
  // throw new ApiError(400, 'fullName is required')
  // }

  if ([fullName, email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ fullName }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with fullName or Password already existed");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverLocalPath = req.files?.coverImage?.[0]?.path;

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
    avatar,
    coverImage: coverImage || "",
    email,
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

export { registerUser };

// get all users
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password -refreshToken");
  if (!users.length) {
    throw new ApiError(404, "No users found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, users, "users fetched successfully"));
});

export { getAllUsers };


// user login or not
const loginUser = asyncHandler(async (req, res) => {
  // get data from req.body
  // check full name or email
  // find the user
  // password check
  // access and refresh token
  // send to the cookie

  const { email, fullName, password } = req.body;
  if (!email || !fullName) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ fullName }, { email }],
  });

  if (!user) {
    throw new ApiError(400, "user does not exist");
  }

  const isPasswordValid = await user.isPasswordMatch(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid User Credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged In Successfully"
      )
    );
});

export {loginUser}


// logout function 
  const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
      req.user?._id,
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
      .json(new ApiError(200,{}, "User Logged Out"));
  });

  export { logoutUser };

