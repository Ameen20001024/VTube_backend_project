import {upload} from "../middlewares/multer.middleware.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

import { Router } from "express";

import { 
    createAPlaylist, 
    getplaylistbyname,
    getplaylistbyId,
    addVideotoPlaylist,
    addVideotoNewPlaylist,
    removeVideofromPlaylist,
    updatePlaylistinfo,
    deleteAPlaylist,
    getUserCreatedPlaylists 
} from "../controllers/playlists.controllers.js";

const router = Router()

router.use(verifyJWT)

router.route("/").post(createAPlaylist).get(getUserCreatedPlaylists)

router.route("/:name").get(getplaylistbyname)

router.route("/:playlist_id")
    .get(getplaylistbyId)
    .patch(updatePlaylistinfo)
    .delete(deleteAPlaylist)

router.route("/:video_id").post(addVideotoNewPlaylist)

router.route("/add/:video_id/:playlist_id").patch(addVideotoPlaylist)

router.route("/remove/:video_id/:playlist_id").patch(removeVideofromPlaylist)

export default router