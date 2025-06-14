import {upload} from "../middlewares/multer.middleware.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

import { Router } from "express";

import { 
    channelsSubscribedToList,
    unSubscribeChannel,
    subscribechannel
} from "../controllers/subscriptions.controllers.js";

import { getUserChannelProfile } from "../controllers/user.controllers.js";


const router = Router()

router.use(verifyJWT)


router.route("/").get(channelsSubscribedToList)
router.route("/:username")
    .get(getUserChannelProfile)
    .post(subscribechannel)
    .delete(unSubscribeChannel)



export default router