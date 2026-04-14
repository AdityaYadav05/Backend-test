import express from 'express';
import { registerUser, getAllUsers} from '../controllers/user.controllers.js';
import { upload } from '../middlewares/multer.middlewares.js'


const router = express.Router();

router.route('/register').post(
    upload.fields([
        {
            name : "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
);


// get all users 
router.route('/get-all-users').get(getAllUsers)

export default router;