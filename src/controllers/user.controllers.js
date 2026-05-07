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
    .json(new ApiError(200, {}, "User Logged Out"));
});

// change User Password
const changeUserPassword = asyncHandler(async (req, res) => {
  // when user wants to change the password, we will get the old password and new password from the request body
  const { oldPassword, newPassword, confirmNewPassword } = req.body;
  const user = await User.findById(req.user?._id);
  const isPasswordValid = await user.isPasswordMatch(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Old Password");
  }

  if (newPassword !== confirmNewPassword) {
    throw new ApiError(
      400,
      "New Password and Confirm New Password does not match"
    );
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: true });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed Successfully"));
});

// get Current User Password
const getCurrentUserPassword = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, "current user password fetched successfully"));
});

// update user details
const updateUserDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) {
    throw new ApiError(400, "fullName and email are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true } // to return the updated user details after update
  ).select("-password");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User Details Updated Successfully"));
});

// update user cover image
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImagePath = req.file?.path;
  if (!coverImagePath) {
    throw new ApiError(400, "cover image file is required");
  }

  const coverImage = await uploadToCloudinary(coverImagePath);
  if (!coverImage.url) {
    throw new ApiError(
      500,
      "Somethings went wrong while uploading the cover image"
    );
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User cover image update successfully"));
});

// update user avatar image
const updateUserAvatarImage = asyncHandler(async (req, res) => {
  const avatarImagePath = req.file?.path;
  if (!avatarImagePath) {
    throw new ApiError(400, "avatar image file is required");
  }

  const avatarImage = await uploadToCloudinary(avatarImagePath);
  if (!avatarImage.url) {
    throw new ApiError(
      500,
      "Somethings went wrong while uploading the avatar image"
    );
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatarImage.url,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User avatar image update successfully"));
});

// get user channel details
const getUserChannelDetails = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username.trim()) {
    throw new ApiError(400, "username is required");
  }

  // we will get the user details based on the username and also get the subscriber count and subscription count and also check if the logged in user is subscribed to that channel or not
  // we will use aggregation pipeline to get the user details and also get the subscriber count and subscription count and also check if the logged in user is subscribed to that channel or not
  const channelDetails = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscribers", // collection name in db
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $Lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscriptionsTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelSubscriptionsCount: {
          $size: "$subscriptionsTo",
        },
        isSubscribed: {
          $cond: {
            if: {
              $in: [
                new mongoose.Types.ObjectId(req.user?._id),
                "$subscribers.subscriber",
              ],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
        subscribersCount: 1,
        channelSubscriptionsCount: 1,
        isSubscribed: 1,
      },
    },
  ]);

  if (!channelDetails.length) {
    throw new ApiError(404, "Channel not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        channelDetails[0],
        "Channel details fetched successfully"
      )
    );
});

// get watch history of the user
// we will get the watch history of the user based on the user id and also populate the video details in the watch history
// we will use aggregation pipeline to get the watch history of the user and also populate the video details in the watch history
// we will sort the watch history based on the createdAt field in descending order to get the latest watched videos at the top

const getWatchHistory = asyncHandler(async (req, res) => {
  const watchHistory = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistoryDetails",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "ownerDetails",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      $addFields: {
        ownerDetails: {
          $first: "$ownerDetails",
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiError(
        200,
        watchHistory[0]?.watchHistoryDetails || [],
        "watch history fetched successfully"
      )
    );
});

// export all the functions
export {
  registerUser,
  getAllUsers,
  loginUser,
  logoutUser,
  changeUserPassword,
  getCurrentUserPassword,
  updateUserDetails,
  updateUserCoverImage,
  updateUserAvatarImage,
  getUserChannelDetails,
  getWatchHistory,
};
