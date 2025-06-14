import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { uploadoncloudinary } from "../utils/cloudinary";
import { ApiError } from "../utils/apierror";
import { ApiResponse } from "../utils/apiResponse";
import { Comments } from "../models/comments.models";
import { Likes } from "../models/likes.models";
import { Video } from "../models/video.models";
import { User } from "../models/user.models";
import { Playlist } from "../models/playlists.models";


const likeAVideo = asyncHandler(async (req, res) => {
    
    const {video_id} = req.params

    if (!video_id) {
        throw new ApiError(400, "video id not fetched")
    }

    const user_id = req.user?._id

    const videoliked = await Likes.create({
        video: video_id,
        user: user_id
    })

    if (!videoliked) {
        throw new ApiError(400, "Like failed")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, videoliked, "Video liked successfully")
    )

})


const unlikeTheVideo = asyncHandler(async (req, res) => {
    
    const {video_id} = req.params
    const user_id = req.user?._id

    const likedVideos = await Likes.find({user: user_id})

    if (!likedVideos) {
        throw new ApiError(400, "liked videos not found")
    }

    const videotoUnlike = likedVideos.find(field => field.video === video_id)

    if (!videotoUnlike) {
        throw new ApiError(400, "liked video not fetched")
    }

    try {
        await Likes.findByIdAndDelete(videotoUnlike._id)
    } catch (error) {
        throw new ApiError(400, 'Video not unliked')
    }

    const videolikestatus = false

    return res
    .status(200)
    .json(
        new ApiResponse(200, videolikestatus, "Video unliked")
    )

})


const likeAComment = asyncHandler(async (req, res) => {
    
    const {comment_id} = req.params

    if (!comment_id) {
        throw new ApiError(400, "video id not fetched")
    }

    const owner_id = req.user?._id

    const commentliked = await Likes.create({
        comment: comment_id,
        owner: owner_id
    })

    if (!commentliked) {
        throw new ApiError(400, "Like failed")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, commentliked, "Comment liked successfully")
    )

})


const unlikeTheComment = asyncHandler(async (req, res) => {
    
    const {comment_id} = req.params
    const user_id = req.user?._id

    const likedcomments = await Likes.find({user: user_id})

    if (!likedcomments) {
        throw new ApiError(400, "liked comments not found")
    }

    const commenttoUnlike = likedcomments.find(field => field.comment === comment_id)

    if (!commenttoUnlike) {
        throw new ApiError(400, "liked comment not fetched")
    }

    try {
        await Likes.findByIdAndDelete(commenttoUnlike._id)
    } catch (error) {
        throw new ApiError(400, 'Commend not unliked')
    }

    const commentlikestatus = false

    return res
    .status(200)
    .json(
        new ApiResponse(200, commentlikestatus, "Comment unliked")
    )

})


const likeAPlaylist = asyncHandler(async (req, res) => {
    
    const {playlist_id} = req.params

    if (!playlist_id) {
        throw new ApiError(400, "Playlist id not fetched")
    }

    const owner_id = req.user?._id

    const playlistliked = await Likes.create({
        playlist: playlist_id,
        owner: owner_id
    })

    if (!playlistliked) {
        throw new ApiError(400, "Like failed")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlistliked, "playlist liked successfully")
    )

})


const unlikethePlaylist = asyncHandler(async (req, res) => {
    
    const {playlist_id} = req.params
    const user_id = req.user?._id

    const likedplaylists = await Likes.find({user: user_id})

    if (!likedplaylists) {
        throw new ApiError(400, "liked playlists not found")
    }

    const playlisttoUnlike = likedplaylists.find(field => field.playlist === playlist_id)

    if (!playlisttoUnlike) {
        throw new ApiError(400, "liked playlist not fetched")
    }

    try {
        await Likes.findByIdAndDelete(playlisttoUnlike._id)
    } catch (error) {
        throw new ApiError(400, 'Playlist not unliked')
    }

    const playlistlikestatus = false

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlistlikestatus, "Playlist unliked")
    )

})


const getLikedVideos = asyncHandler(async (req, res) => {
    
    const userlikedvideos = await Likes.aggregate([
    
        {
            $match:{
                user: mongoose.Types.ObjectId(req.user._id)
            }
        
        },

        {
            $lookup:{
                localField: "video",
                from: "videos",
                foreignField: "_id",
                as: "likedVideos",
                pipeline: [
                    {
                        $lookup: {
                            localField: "owner",
                            from: "users",
                            foreignField: "_id",
                            as: "owner",
                            pipeline:[{
                                $project:{
                                    username: 1,
                                    fullname: 1,
                                    avatar: 1
                                }
                            }]
                        }
                    },

                    {

                        $addFields:{
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }   
    ])

    const allLikedVideos = userlikedvideos.flatMap(object => object.likedVideos)

    return res
    .status(200)
    .json(
        new ApiResponse(200, allLikedVideos, "Liked videos fetched successfully")
    )

})


const getLikedPlaylists = asyncHandler(async (req, res) => {

    const userlikedplaylists = await Likes.aggregate([
    
        {
            $match:{
                user: mongoose.Types.ObjectId(req.user._id)
            }
        
        },

        {
            $lookup:{
                localField: "playlist",
                from: "playlists",
                foreignField: "_id",
                as: "likedPlaylists",
                pipeline: [
                    {
                        $lookup: {
                            localField: "owner",
                            from: "users",
                            foreignField: "_id",
                            as: "owner",
                            pipeline:[{
                                $project:{
                                    username: 1,
                                    fullname: 1,
                                    avatar: 1
                                }
                            }]
                        }
                    },

                    {

                        $addFields:{
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }   
    ])

    if (userlikedplaylists.length === 0) {
        throw new ApiError(400, "Liked playlists array not created")
    }

    const allLikedplaylists = userlikedplaylists.flatMap(object => object.likedPlaylists)

    if (allLikedplaylists.length === 0) {
        throw new ApiError(400, "Failed to fetch Liked Playlists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, allLikedplaylists, "Liked comments fetched successfully")
    )

})


export {
    getLikedPlaylists,
    likeAVideo,
    getLikedVideos,
    likeAPlaylist,
    unlikethePlaylist,
    unlikeTheComment,
    likeAComment,
    unlikeTheVideo
}