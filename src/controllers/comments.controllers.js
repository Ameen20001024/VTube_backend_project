import mongoose, { set } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
// import { uploadoncloudinary } from "../utils/cloudinary";
import { ApiError } from "../utils/apierror.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Comments } from "../models/comments.models.js";
// import { User } from "../models/user.models";
import { Video } from "../models/video.models.js";


const addComment = asyncHandler(async (req, res) => {
    
    const {comment_content} = req.body

    if (!comment_content) {
        throw new ApiError(400, "Comment is empty")
    }

    const comment_owner_id = req.user?._id
    const {video_id} = req.params

    const video = await Video.findById(video_id); // validating video_id with db
    if (!video) {
        throw new ApiError(404, "Video not found");
    }


    const addAComment = await Comments.create({
        content: comment_content,
        video: video_id,
        owner: comment_owner_id
    })

    if (!addAComment) {
        throw new ApiError(400, "Comment not saved")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, addAComment, "Comment posted succesfully")
    )

})


const updateComment = asyncHandler(async (req, res) => {
    
    const {comment_id} = req.params
    const {updated_content} = req.body

    if (!updated_content?.trim()) {
        throw new ApiError(400, "Updated content is empty");
    }


    const comment = await Comments.findById(comment_id);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized to update this comment");
    }


    const newcomment = await Comments.findByIdAndUpdate(comment_id, {
        $set: {
            content: updated_content
        }
    },
    {
        new: true
    })

    if (!newcomment) {
        throw new ApiError(400, "Comment not updated")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, newcomment, "Comment updated successfully")
    )

})


const deletecomment = asyncHandler(async (req, res) => {
    
    const {comment_id} = req.params

    const comment = await Comments.findById(comment_id);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized to update this comment");
    }

    
    await Comments.findByIdAndDelete(comment_id)

    return res.status(200).json(
        new ApiResponse(200, {}, "Comment deleted successfully")
    )

})

const getAllVideoComments = asyncHandler(async (req, res) => {

    const {video_id} = req.params

    if (!video_id) {
        throw new ApiError(404, "Video not found")
    }
    
    const allvideoComments = await Video.aggregate([

        {
            $match:{
                _id: mongoose.Types.ObjectId(video_id)
            }
        },

        {
            $lookup: {
                localField: "_id",
                from: "comments",
                foreignField: "video",
                as: "allComments",
                pipeline: [
                    {
                        $lookup:{
                            localField: "owner",
                            from: "users",
                            foreignField: "_id",
                            as: "owner",
                            pipeline:[
                                {
                                    $project:{
                                        username: 1,
                                        fullname: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },

                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    },

                    {
                        $project:{
                            owner: 1,
                            content: 1
                        }
                    }
                ]
            }
        }

    ])

    if (!allvideoComments.length) {
        throw new ApiError(404, "Video comments not found");
    }


    return res
    .status(200)
    .json(
        new ApiResponse(200, allvideoComments[0].allComments, "Comments fetched successfully")
    )

})




export {
    addComment,
    updateComment,
    deletecomment,
    getAllVideoComments
    
}