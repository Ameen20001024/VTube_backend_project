import mongoose, { set } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
// import { uploadoncloudinary } from "../utils/cloudinary";
import { ApiError } from "../utils/apierror";
import { ApiResponse } from "../utils/apiResponse";
import { Comments } from "../models/comments.models";
// import { User } from "../models/user.models";
import { Video } from "../models/video.models";


const addComment = asyncHandler(async (req, res) => {
    
    const {comment_content} = req.body

    if (!comment_content) {
        throw new ApiError(400, "Comment is empty")
    }

    const comment_owner_id = req.user?._id
    const {video_id} = req.params

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
    
    await Comments.findByIdAndDelete(comment_id)

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