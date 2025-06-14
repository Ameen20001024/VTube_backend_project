import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutuser,
    updateAccountDetail,
    updateUserAvatar,
    updateUsercoverImage,
    changeCurrentPassword,
    getCurrentUser,
    RefreshAccessToken,
    getUserChannelProfile,
    subscribers_list,
    getWatchHistory,
    // deleteUserAccount
} from "../controllers/user.controllers";

import {upload} from "../middlewares/multer.middleware.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/register").post(upload.fields([
    {
        name: "avatar",
        maxCount: 1
    },
    {
        name: "coverImage",
        maxCount: 1
    }
]), registerUser)

router.route("/login").post(loginUser)

router.route("/update-account").patch(verifyJWT, updateAccountDetail)

router.route("/change-password").post(verifyJWT, changeCurrentPassword)

router.route("/logout").post(verifyJWT, logoutuser)

router.route("/change-userAvatar").patch(verifyJWT, upload.single("avatar") , updateUserAvatar)

router.route("/change-userCoverimage").patch(verifyJWT,upload.single("coverImage"), updateUsercoverImage)

router.route("/user-account").get(verifyJWT, getCurrentUser)

router.route("/refresh-token").post(RefreshAccessToken)

router.route("/:username").get(verifyJWT, getUserChannelProfile)

router.route("/subscribers-list/:username").get(verifyJWT, subscribers_list)

router.route("/watch-history").get(verifyJWT, getWatchHistory)

// router.route("/delete-account").delete(verifyJWT, deleteUserAccount)

export default router