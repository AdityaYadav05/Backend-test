import express from "express";
import {
  refreshAccessToken,
  registerUser,
  getAllUsers,
  loginUser,
  logoutUser,
  changeUserPassword,
  getCurrentUserPassword,
  getWatchHistory,
  updateUserDetails,
  updateUserCoverImage,
  updateUserAvatarImage,
  getUserChannelDetails,
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = express.Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/refresh-access-token").post(refreshAccessToken);

router.route("/get-all-users").get(getAllUsers);

router.route("/login").post(loginUser);

router.route("/logout").post(verifyJWT, logoutUser);

router.route("/change-password").post(verifyJWT, changeUserPassword);

router.route("/current-user").get(verifyJWT, getCurrentUserPassword);

router.route("/update-account-details").patch(verifyJWT, updateUserDetails);

router
  .route("/update-cover-image")
  .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

router
  .route("/update-avatar-image")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatarImage);

router.route("/c/:username").get(verifyJWT, getUserChannelDetails);

router.route("/watch-history").get(verifyJWT, getWatchHistory);

export default router;
