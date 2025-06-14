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

router.route("/:video_id").post(addComment).patch(updateComment).delete(deletecomment).get(getAllVideoComments)