import {upload} from "../middlewares/multer.middleware.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

import { Router } from "express";

import { getLikedPlaylists,
    likeAVideo,
    getLikedVideos,
    likeAPlaylist,
    unlikethePlaylist,
    unlikeTheComment,
    likeAComment,
    unlikeTheVideo
} from "../controllers/likes.controllers.js";

const router = Router()

router.use(verifyJWT)

router.route("/video/:video_id").post(likeAVideo).delete(unlikeTheVideo)
router.route("/comment/:comment_id").post(likeAComment).delete(unlikeTheComment)
router.route("/playlist/:playlist_id").post(likeAPlaylist).delete(unlikethePlaylist)
router.route("/liked-videos").get(getLikedVideos)
router.route("/liked-playlists").get(getLikedPlaylists)

export default router