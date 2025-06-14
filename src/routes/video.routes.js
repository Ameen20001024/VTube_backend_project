import {upload} from "../middlewares/multer.middleware.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

import { Router } from "express";


import { 
    playVideoById,
    deleteVideo,
    updateVideoFile,
    updateVideoThumbnailFile,
    updateVideodata,
    publishAVideo 
} from "../controllers/video.controllers"; 


const router = Router()

router.use(verifyJWT)

router.route("/").post( upload.fields([
    {
        name: "videoFile",
        maxCount: 1
    },
    {
        name: "thumbnail",
        maxCount:1
    }
]), publishAVideo)

router.route("/:videoId")
    .get(playVideoById)
    .patch(updateVideodata)
    .delete(deleteVideo)

router.route("/modify_video/:videoId").patch(upload.single("videoFile"), updateVideoFile)
router.route("/edit_thumbnail/:videoId").patch(upload.single("thumbnail"), updateVideoThumbnailFile)

export default router