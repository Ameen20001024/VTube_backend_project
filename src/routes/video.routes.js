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

Router.router("/").post( upload.fields([
    {
        name: "videoFile",
        maxCount: 1
    },
    {
        name: "thumbnail",
        maxCount:1
    }
]), publishAVideo)

Router
.router("/:videoId")
.get(playVideoById)
.patch(upload.single("thumbnail"), updateVideoThumbnailFile)
.patch(upload.single("videoFile"), updateVideoFile)
.patch(updateVideodata)
.delete(deleteVideo)


export default router