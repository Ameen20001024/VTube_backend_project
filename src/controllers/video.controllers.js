import { ApiError } from "../utils/apierror.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { deletefromcloudinary, uploadoncloudinary } from "../utils/cloudinary.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { Playlist } from "../models/playlists.models.js";
import { Likes } from "../models/likes.models.js";


const publishAVideo = asyncHandler(async (req,res) => {

    // get data from front end
    // validate (empty or not)
    // check for existing video
    // check for files
    // upload to cloudinary
    // create video object
    // check for video creation
    // return response
    
    const {title , discription} = req.body

    if ([title, discription].some((fields)=>fields.trim()==="")) {
        throw new ApiError(400, "Title and discription are required")
    }

    const existingtitleordiscription = await Video.findOne({
        $or: [{title}, {discription}]
    })

    if (existingtitleordiscription) {
        throw new ApiError(400, "Title and discription must be unique")
    }
    
    const user_Id = req.user?._Id

    let videoLocalPath;
    if (req.files && Array.isArray(req.files.video) && req.files.video.length > 0) {
        videoLocalPath = req.files.video[0].path
    }

    if (!videoLocalPath) {
        throw new ApiError(401, "Video File not found")
    }

    let thumbnailLocalPath;
    if (req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0) {
        thumbnailLocalPath = req.files.thumbnail[0].path
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(401, "Thumbnail File is required")
    }

    const videoFile = await uploadoncloudinary(videoLocalPath)
    const thumbnailFile = await uploadoncloudinary(thumbnailLocalPath)

    if (!videoFile) {
        throw new ApiError(401,"video upload to cloudinary unsuccessful")
    }

    if (!thumbnailFile) {
        throw new ApiError(401, "Thumbnail upload to cloudinary failed")
    }

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnailFile.url,
        title: title,
        discription: discription,
        videoFilePublicId: videoFile.public_id,
        thumbnailPublicId: thumbnailFile.public_id,
        duration: videoFile.duration
    })

    const createdVideo = await Video.findByIdAndUpdate(video._id, {
        $set:{owner: user_Id}
    },
    {
        new: true
    }).select("-videoFilePublicId -thumbnailPublicId")

    if (!createdVideo) {
        throw new ApiError(401, "Video upload failed")
    }

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, createdVideo, "Video uploaded successfully")
    )

})


const getAllVideos = asyncHandler(async (req, res) => {
    // Filtering
    const filter = {};
    if (req.query.title) {
        filter.title = { $regex: req.query.title, $options: "i" };
    }

    // Sorting
    let sort = {};
    if (req.query.sort) {
        if (req.query.sort === "latest") sort = { createdAt: -1 };
        else if (req.query.sort === "views") sort = { views: -1 };
        else if (req.query.sort === "likes") sort = { likes: -1 };
    }
    else {
        sort = { createdAt: -1 };
    }

    // Pagination
    // const page = parseInt(req.query.page) || 1;
    // const limit = parseInt(req.query.limit) || 10;
    // const skip = (page - 1) * limit;

    // Query
    const videos = await Video.find(filter)
    .sort(sort)
    // .skip(skip)
    // .limit(limit);

    return res.status(200).json(
        new ApiResponse(200, videos, "Videos fetched successfully")
    )
});



const playVideoById = asyncHandler(async (req, res) => {
    
    const {videoId} = req.params

    if (!videoId?.trim()) {
        throw new ApiError(400, "video(ID) not found")
    }

    const video = await Video.findByIdAndUpdate(videoId, {
        $inc: {
            views: 1
        }
    },
    {
        new: true
    }).populate('owner').select("-videoFilePublicId -thumbnailPublicId")

    const userId = req.user?._id
    
    await User.findByIdAndUpdate(userId,{
        $push: {watchHistory: videoId}
    },
    {
        new: true
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "Video fetched and video Id added to user-Watch_history successfully")
    )

})


const deleteVideo = asyncHandler(async (req, res) => {
    
    const {videoId} = req.params
    
    const video = await Video.findById(videoId)

    const thumbnailPublicId = video.thumbnailPublicId
    const videoFilePublicId = video.videoFilePublicId

    try {
        await Video.findByIdAndDelete(videoId)
    } catch (error) {
        throw new ApiError(400, "video deletion failed")
    }

    if (thumbnailPublicId) {
        await deletefromcloudinary(thumbnailPublicId)
    }

    if (videoFilePublicId) {
        await deletefromcloudinary(videoFilePublicId)
    }

    await Likes.deleteMany({video: videoId})
    await Playlist.updateMany({videos: videoId}, {
        $pull:{
            videos: videoId
        }
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Video deleted successfully")
    )

})


const updateVideodata = asyncHandler(async (req, res) => {
    
    const {videoId} = req.params

    const {title, description} = req.body

    if (!title || !description) {
        throw new ApiError(400, "fields are required")
    }

    const video = await Video.findByIdAndUpdate(videoId, {
        $set: {
            title: title,
            description: description
        }
    },
    {
        new:true
    }).select("-videoFilePublicId -thumbnailPublicId")

    if (!video) {
        throw new ApiError(400, "Update failed")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "Updated")
    )

})


const updateVideoFile = asyncHandler(async (req, res) => {
    
    const {videoId} = req.params

    const video = await Video.findById(videoId)

    // const oldthumbnailPublicId = video.thumbnailPublicId
    const oldvideoFilePublicId = video.videoFilePublicId

    if (!oldvideoFilePublicId) {
        throw new ApiError(404, "Invalid request")
    }

    const videofilelocalpath = req.file?.path

    if (!videofilelocalpath) {
        throw new ApiError(400, "video file not found")
    }

    const videofile = await uploadoncloudinary(videofilelocalpath)

    if (!videofile) {
        throw new ApiError(400, "Upload to cloudinary failed")
    }

    const updatedvideo = await Video.findByIdAndUpdate(videoId,{
        $set:{
            videoFile: videofile.url,
            videoFilePublicId: videofile.public_id
        }
    },
    {
        new: true
    }).select("-videoFilePublicId -thumbnailPublicId")

    if (!updatedvideo) {
        throw new ApiError(400, "Video file update failed")
    }

    await deletefromcloudinary(oldvideoFilePublicId)



    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedvideo, "Video file updated successfully")
    )

})


const updateVideoThumbnailFile = asyncHandler(async (req, res) => {
    
    const {videoId} = req.params

    const video = await Video.findById(videoId)

    const oldthumbnailPublicId = video.thumbnailPublicId
    // const oldvideoFilePublicId = video.videoFilePublicId

    if (!oldthumbnailPublicId) {
        throw new ApiError(404, "Invalid request")
    }

    const thumbnailfilelocalpath = req.file?.path

    if (!thumbnailfilelocalpath) {
        throw new ApiError(400, "thumbnail not found")
    }

    const thumbnailfile = await uploadoncloudinary(thumbnailfilelocalpath)

    if (!thumbnailfile) {
        throw new ApiError(400, "Upload to cloudinary failed")
    }

    const updatedthumbnail = await Video.findByIdAndUpdate(videoId,{
        $set:{
            thumbnail: thumbnailfile.url,
            thumbnailPublicId: thumbnailfile.public_id
        }
    },
    {
        new: true
    }).select("-videoFilePublicId -thumbnailPublicId")

    if (!updatedthumbnail) {
        throw new ApiError(400, "thumbnail update failed")
    }

    await deletefromcloudinary(oldthumbnailPublicId)

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedthumbnail, "thumbnail updated successfully")
    )

})


export {
    playVideoById,
    getAllVideos,
    deleteVideo,
    updateVideoFile,
    updateVideoThumbnailFile,
    updateVideodata,
    publishAVideo
}