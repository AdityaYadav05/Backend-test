import express from "express";
import {
  registerUser,
  getAllUsers,
  loginUser,
  logoutUser,
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import {verifyJWT} from "../middlewares/auth.middlewares.js";

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

// get all users
router.route("/get-all-users").get(getAllUsers);

router.route("/login").post(loginUser);

router.route("/logout").post(verifyJWT, logoutUser);

export default router;
