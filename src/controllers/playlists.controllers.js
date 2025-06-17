import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
// import { uploadoncloudinary } from "../utils/cloudinary";
import { ApiError } from "../utils/apierror.js";
import { ApiResponse } from "../utils/apiResponse.js";
// import { Comments } from "../models/comments.models";
// import { Likes } from "../models/likes.models";
import { Playlist } from "../models/playlists.models.js";
// import { Video } from "../models/video.models";
import { User } from "../models/user.models.js";


const createAPlaylist = asyncHandler(async (req, res) => {
    
    const owner_id = req.user?._id

    if (!owner_id) {
        throw new ApiError(401, "User not fetched")
    }

    const {name, description} = req.body

    if (!name || !description) {
        throw new ApiError(404, "All fields are required")
    }

    const new_playlist = await Playlist.create({
        owner: owner_id,
        name: name,
        description: description
    })

    if (!new_playlist) {
        throw new ApiError(404, "Playlist creation failed")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, new_playlist, "New playlist created successfully")
    )

})


const getplaylistbyId = asyncHandler(async (req, res) => {
    
    const {playlist_id} = req.params

    if (!playlist_id) {
        throw new ApiError(401, "Invalid request")
    }

    const playlist = await Playlist.findById(playlist_id).populate('owner').populate("videos")

    if (!playlist) {
        throw new ApiError(400, "Playlist not found")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(200, playlist, "Playlist fetched by Id successfully")
    )

})


const getplaylistbyname = asyncHandler(async (req, res) => {
    
    const {playlist_name} = req. params

    if (!playlist_name?.trim()) {
        throw new ApiError(401, "Invalid request")
    }

    const playlist = await Playlist.findOne({name: playlist_name}).populate('owner').populate("videos")

    if (!playlist) {
        throw new ApiError(400, "Playlist not found")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(200, playlist, "Playlist fetched successfully")
    )

})


const addVideotoPlaylist = asyncHandler(async (req, res) => {
    
    const {video_id, playlist_id} = req. params

    if (!video_id || !playlist_id) {
        throw new ApiError(401, "Invalid request")
    }

    const playlist = await Playlist.findById(playlist_id).populate('owner')

    if (!playlist) {
        throw new ApiError(402, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to modify this playlist");
    }

    const videoAdded_playlist = await Playlist.findByIdAndUpdate(playlist_id, {
        $push:{
            videos: video_id
        }
    },
    
    {
        new : true
    })

    if (!videoAdded_playlist) {
        throw new ApiError(401, "Failed to add video to the playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, videoAdded_playlist, "Video added to playlist")
    )

})


const addVideotoNewPlaylist = asyncHandler(async (req, res) => {
    
    const owner_id = req.user?._id

    if (!owner_id) {
        throw new ApiError(401, "User not fetched")
    }

    const {video_id} = req.params

    if (!video_id) {
        throw new ApiError(401, "Invalid request")
    }

    const {name, description} = req.body

    if (!name?.trim() || !description?.trim()) {
        throw new ApiError(404, "All fields are required")
    }

    const new_playlist_withTheVideo = await Playlist.create({
        owner: owner_id,
        name: name,
        description: description,
        videos: [video_id]
    })

    if (!new_playlist_withTheVideo) {
        throw new ApiError(404, "Playlist creation failed")
    }

    const new_playlist_withTheVideo_populated = await Playlist.findById(new_playlist_withTheVideo._id).populate('owner')

    return res
    .status(200)
    .json(
        new ApiResponse(200, new_playlist_withTheVideo_populated, "New playlist created successfully")
    )

})


const removeVideofromPlaylist = asyncHandler(async (req, res) => {
    
     const {video_id, playlist_id} = req. params

    if (!video_id || !playlist_id) {
        throw new ApiError(401, "Invalid request")
    }

    const playlist = await Playlist.findById(playlist_id).populate('owner')

    if (!playlist) {
        throw new ApiError(402, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to modify this playlist");
    }

    const videoRemoved_playlist = await Playlist.findByIdAndUpdate(playlist_id, {
        $pull:{
            videos: video_id
        }
    },
    
    {
        new : true
    }).populate('owner')

    if (!videoRemoved_playlist) {
        throw new ApiError(401, "Failed to remove video from the playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, videoRemoved_playlist, "Video removed from playlist")
    )

})


const updatePlaylistinfo = asyncHandler(async (req, res) => {
    
    const {name, description} = req.body
    const {playlist_id} = req.params

    const playlist = await Playlist.findById(playlist_id).populate('owner')

    if (!playlist) {
        throw new ApiError(402, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to modify this playlist");
    }

    
    if (!name?.trim() || !description.trim()) {
        throw new ApiError(401, "These fields are required")
    }

    if (!playlist_id) {
        throw new ApiError(401, "Invalid request")
    }



    const updated_playlist = await Playlist.findByIdAndUpdate(playlist_id, {
        $set:{
            name: name,
            description: description
        }
        
    },

    {
        new: true
    })

    if (!updated_playlist) {
        throw new ApiError(402, "Playlist info not updated")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updated_playlist, "Playlist info updated successfully")
    )

})


const deleteAPlaylist = asyncHandler(async (req, res) => {
    
    const {playlist_id} = req.params

    const playlist = await Playlist.findById(playlist_id).populate('owner')

    if (!playlist) {
        throw new ApiError(402, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to modify this playlist");
    }

    if (!playlist_id) {
        throw new ApiError(400, "Invalid request")
    }
    try {
        await Playlist.findByIdAndDelete(playlist_id)
    } catch (error) {
        throw new ApiError(404, "Playlist deletion failed")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Playlist deleted")
    )

})


const getUserCreatedPlaylists = asyncHandler(async (req, res) => {

    const {username} = req.user

    if (!username?.trim()) {
        throw new ApiError(400, "username missing")
    }

    const created_playlists = await User.aggregate([

        {
            $match:{
                username: username?.toLowerCase()
            }
        },

        {
            $lookup:{
                as: "usercreatedPlaylists",
                localField: "_id",
                from: "playlists",
                foreignField: "owner",
               
            }
        },

        {
            $addFields:{
                
                usercreatedPlaylistsCount:{
                    $size: "$usercreatedPlaylists"
                },

                
            }
        },

        {
            $project:{
                username: 1,
                fullname: 1,
                avatar: 1,
                coverImage: 1,
                usercreatedPlaylists: 1,
                usercreatedPlaylistsCount:1
            }

        }

    ])

    if (!created_playlists?.length) {
        throw new ApiError(404, "Channel does not exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, created_playlists[0], "User channel fetched successfully")
    )

})



export {
    createAPlaylist,
    getplaylistbyname,
    getplaylistbyId,
    addVideotoPlaylist,
    addVideotoNewPlaylist,
    removeVideofromPlaylist,
    updatePlaylistinfo,
    deleteAPlaylist,
    getUserCreatedPlaylists
}