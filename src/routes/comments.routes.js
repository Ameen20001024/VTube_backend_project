import {upload} from "../middlewares/multer.middleware.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

import { Router } from "express";

import { addComment,
    updateComment,
    deletecomment,
    getAllVideoComments
} from "../controllers/comments.controllers.js";

const router = Router()

router.use(verifyJWT)

router.route("/:video_id").post(addComment).get(getAllVideoComments)

router.route("/:comment_id").patch(updateComment).delete(deletecomment)