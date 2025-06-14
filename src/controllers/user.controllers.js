import { User } from "../models/user.models";
import { ApiError } from "../utils/apierror";
import { ApiResponse } from "../utils/apiResponse";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { uploadoncloudinary , deletefromcloudinary } from "../utils/cloudinary";
import { Subscription } from "../models/subscriptions.models";


const generateaccessandrefreshtokens = async (userId) => {
    try {
        
        const user = await User.findById(userId)
        const accesstoken = user.generateaccesstoken()
        const refreshtoken = user.generaterefreshtoken()

        user.refreshtoken = refreshtoken

        await user.save({validateBeforeSave: false})

        return {accesstoken, refreshtoken}
        

    } catch (error) {
        throw new ApiError(500, "refreshtoken and accesstoken could not be generated")
    }
}


const registerUser = asyncHandler(async (req, res) => {
    // get user details from front end
    // validation - not empty
    // check if user already exists
    // check for files (avatar, coverImage)
    // Upload to cloudinary
    // create user object
    // remove password and refreshtoken from response
    // check user creation
    // return response

    const { fullname, username, email, password } = req.body


    if(
        { fullname, username, email, password }.some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are compulsory")
    }


    const existeduser = await User.findOne({
        $or: [{username}, {email}]
    })

    if (existeduser){
        throw new ApiError(400, "user already exists")
    }

    let coverimagelocalpath;
    if (req.files && Array.isArray(req.files.coverimage) && req.files.coverimage.length > 0) {
        coverimagelocalpath = req.files.coverimage[0].path
    }

    let avatarlocalpath;
    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
        avatarlocalpath = req.files.avatar[0].path
    }

    if (!avatarlocalpath) {
        throw new ApiError(401, "Avatar file is required ")
    }

    const avatar = await uploadoncloudinary(avatarlocalpath)
    const coverimage = await uploadoncloudinary(coverimagelocalpath)

    if (!avatar) {
        throw new ApiError(400, "Avatar is required")
    }

    const user = await User.create({
        fullname,
        username: username.toLowerCase(),
        email,
        password,
        avatar: avatar.url,
        coverimage: coverimage?.url || ""

    })

    const createduser = await User.findById(user._id).select(" -password -refreshtoken ")

    if (!createduser) {
        throw new ApiError(500, "Something went worng; user not regiestered")
    }

    const options = {
            httpOnly: true,
            secure: true
        }

    return res
    .status(200)
    .cookie("Avatar_public_id", avatar.public_id, options)
    .cookie("CoverImage_public_id", coverimage?.public_id || "", options)
    .json(
        new ApiResponse(201, createduser, "User registered successfully")
    )
})


const loginUser = asyncHandler(async (req, res) => {
    // get data from frontend
    // validate (empty)
    // find user
    // password check
    // access and refresh token
    // send cookie

    const { username , email, password } = req.body

    if (!username && !email) {
        throw new ApiError(400, "Username or email required for sign in")
    }

    if (!password) {
        throw new ApiError(400, "password required")
    }

    const user = await User.findOne({
        $or: [{email}, {username}]
    })

    if (!user) {
        throw new ApiError(401, "user not found")
    }

    const ispasswordvalid = await user.isPasswordcorrect(password)

    if (!ispasswordvalid) {
        throw new ApiError(400, "Invalid credentials")
    }

    const {accesstoken, refreshtoken} = await generateaccessandrefreshtokens(user._id)

    const loggedinUser = await User.findById(user._id).select(
        "-password -refreshtoken"
    )

    if (!loggedinUser) {
        throw new ApiError(500, "login wasn't successful")
    }

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accesstoken", accesstoken, options)
    .cookie("refreshtoken", refreshtoken, options)
    .json(
        new ApiResponse(201, loggedinUser, "Logged in successfully")
    )
})


const logoutuser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, 
        {
        $unset: {refreshtoken : 1}
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearcookie("refreshtoken". options)
    .clearcookie("accesstoken", options)
    .json(
        new ApiResponse(200, {}, "Logged out successfully")
    )
})


// const deleteUserAccount = asyncHandler(async (req,res) => {
    
//     try {
//         await User.findByIdAndDelete(req.user?._id)
//     } catch (error) {
//         throw new ApiError(400, " deletion failed")
//     }

//     const oldavatarpublic_id = req.cookies.Avatar_public_id

//     if (oldavatarpublic_id) {
//         await deletefromcloudinary(oldavatarpublic_id)
//     }

//     const oldcoverimagepublic_id = req.cookies.CoverImage_public_id

//     if (oldcoverimagepublic_id) {
//         await deletefromcloudinary(oldcoverimagepublic_id)
//     }

//     const options = {
//         httpOnly: true,
//         secure: true
//     }

//     return res
//     .status(200)
//     .clearcookie("refreshtoken". options)
//     .clearcookie("accesstoken", options)
//     .json(
//         new ApiResponse(200, {}, "Accound deleted successfully")
//     )

// })


const RefreshAccessToken = asyncHandler(async (req, res) => {
    const incomingrefreshtoken = req.cookies.refreshtoken

    if (!incomingrefreshtoken) {
        throw new ApiError(400, "unautherised request")
    }

    const decodedToken = jwt.verify(
        incomingrefreshtoken,
        process.env.REFRESHTOKENSECRET
    )

    try {
        const user = await User.findById(decodedToken._id)
    
        if (!user) {
            throw new ApiError(400, "invalid refresh token")
        }
    
        if (incomingrefreshtoken !== user.refreshtoken) {
            throw new ApiError(400, "invalid refresh token")
        }
    
        const {accesstoken, newRefreshToken} = await generateaccessandrefreshtokens(user._id)
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        return res
        .status(200)
        .cookie("refreshtoken", newRefreshToken, options)
        .cookie("accesstoken", accesstoken, options)
        .json(
            new ApiResponse(200, {accesstoken, refreshtoken: newRefreshToken}, "Access token refreshed")
        )       
    } catch (error) {
        throw new ApiError(400, error?.message || "invalid refreshtoken")
    }

})


const changeCurrentPassword = asyncHandler(async (req, res) => {
    
    const { oldPassword, newPassword, confirmPassword } = req.body

    const user = await User.findById(req.user?._id)

    const isPasswordcorrect = await user.isPasswordcorrect(oldPassword)

    if (!isPasswordcorrect) {
        throw new ApiError(400, "Invalid password")
    }

    if (newPassword === confirmPassword) {
        throw new ApiError(400, "Passwords don't match")
    }

    user.password = newPassword

    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(200, {}, "password changed successfully")
})


const getCurrentUser = asyncHandler(async (req, res) => {
    return res
    .status(200)
    .json(200, req.user, "User fetched")
})


const updateAccountDetail = asyncHandler(async (req, res) => {
    const { username, fullname, email } = req.body

    if (!username || !email || !fullname) {
        throw new ApiError(400, "Update fields are empty")
    }

    const user = await User.findByIdAndUpdate(req.user._id,{
        $set: {
            fullname: fullname,
            email: email,
            username: username
        }
    },

    {
        new:true
    }).select("-password")

    return res
    .status(200)
    .json(200, user, "Account details updated")

})


const updateUserAvatar = asyncHandler(async (req, res) => {

    const oldavatarpublic_id = req.cookies.Avatar_public_id

    if (!oldavatarpublic_id) {
        throw new ApiError(400, "Avatar not found")
    }

    const avatarlocalpath = req.files?.path
    
    if (!avatarlocalpath) {
        throw new ApiError(400, "File not found")
    }

    const avatar = await uploadoncloudinary(avatarlocalpath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading")
    }

    const user = await User.findByIdAndUpdate(req.user._id, {
        $set:{
            avatar: avatar.url
            }
    },
    {
        new: true
    }).select("-password")

    if (!user) {
        throw new ApiError(400, "Avatar not updated")
    }

    
    if (oldavatarpublic_id) {
        await deletefromcloudinary(oldavatarpublic_id)
    }

    return res
    .status(200)
    .cookie("Avatar_public_id", avatar.public_id, options)
    .json(200, user, "Avatar details updated")

})


const updateUsercoverImage = asyncHandler(async (req, res) => {

    const oldcoverimagepublic_id = req.cookies.CoverImage_public_id

    const coverImagelocalpath = req.file?.path
    
    if (!coverImagelocalpath) {
        throw new ApiError(400, "File not found")
    }

    const coverImage = await uploadoncloudinary(coverImagelocalpath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading")
    }

    const user = await User.findByIdAndUpdate(req.user._id, {
        $set:{
            coverimage: coverImage.url
            }
    },
    {
        new: true
    }).select("-password")

    if (!user) {
        throw new ApiError(400, "Avatar not updated")
    }
    
    if (oldcoverimagepublic_id) {
        await deletefromcloudinary(oldcoverimagepublic_id)
    }

    return res
    .status(200)
    .cookie("CoverImage_public_id", coverImage?.public_id || "", options)
    .json(200, user, "Cover Image details updated")

})


const getUserChannelProfile = asyncHandler(async (req, res) => {

    const {username} = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "username missing")
    }

    const channel = await User.aggregate([

        {
            $match:{
                username: username?.toLowerCase()
            }
        },

        {
            $lookup:{
                as: "subscribers",
                localField: "_id",
                from: "subscriptions",
                foreignField: "channel"
            }
        },
        
        {
            $lookup:{
                as: "channelsSubscribedTo",
                localField: "_id",
                from: "subscriptions",
                foreignField: "subscriber"
            }
        },

        {
            $lookup:{
                as: "userUploadedVideos",
                localField: "_id",
                from: "videos",
                foreignField: "owner",
                pipeline:[
                    {
                        $lookup:{
                            localField: "owner",
                            foreignField: "_id",
                            from: "users",
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
                        },
                    },

                    {
                        $addFields:{
                            owner: {
                                $first: "$owner"
                            }
                        }
                    },

                ]
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
                
                userUploadedVideosCount:{
                    $size: "$userUploadedVideos"
                },

                usercreatedPlaylistsCount:{
                    $size: "$usercreatedPlaylists"
                },

                subscribersCount:{
                    $size: "$subscribers"
                },

                channelsSubscribedToCount:{
                    $size: "$channelsSubscribedTo"
                },

                isSubscribed: {
                    $cond:{
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },

        {
            $project:{
                username: 1,
                fullname: 1,
                avatar: 1,
                coverImage: 1,
                channelsSubscribedToCount: 1,
                subscribersCount: 1,
                isSubscribed: 1,
                userUploadedVideosCount: 1,
                userUploadedVideos: 1,
                usercreatedPlaylists: 1,
                usercreatedPlaylistsCount:1
            }

        }

    ])

    if (!channel?.length) {
        throw new ApiError(404, "Channel does not exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )

})


const subscribers_list = asyncHandler(async (req, res) => {
    
    const {username} = req.params

    if (!(username === req.user.username)) {
        throw new ApiError(404, "Unautherised request")
    }

    const channelowner = await User.findOne({username})

    if (!channelowner) {
        throw new ApiError(400, "Channel data not fetched")
    }

    const channelowner_id = channelowner._id

    if (!channelowner_id) {
        throw new ApiError(400, "Channel Id data not fetched")
    }

    const allChannelSubscribers = await Subscription.find({channel: channelowner_id}).populate('subscriber')

    if (!allChannelSubscribers) {
        throw new ApiError(400, "could not fetch all subscriptions")
    }

    const subcribers_list = allChannelSubscribers.map(object => ({fullname: object.subscriber.fullname, username: object.subscriber.username, avatar: object.subscriber.avatar}))

    if (!subcribers_list) {
        throw new ApiError(400, "subscribers data not fetched")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, subcribers_list, "List of subscribers fetched successfully")
    )

})


const getWatchHistory = asyncHandler(async (req, res) => {
    
    const user = await User.aggregate([

        {
            
            $match:{
                _id: mongoose.Types.ObjectId(req.user._id)
            }

        },
        
        {

            $lookup:{
                localField: "watchHistory",
                from: "videos",
                foreignField: "_id",
                as: "watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            localField: "owner",
                            foreignField: "_id",
                            from: "users",
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
                        },

                        // $project:{
                        //     username: 1,
                        //     fullname: 1,
                        //     avatar: 1
                        // },
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

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history of user fetched successfully"
        )
    )

})


export {
    registerUser,
    loginUser,
    logoutuser,
    updateAccountDetail,
    updateUserAvatar,
    updateUsercoverImage,
    changeCurrentPassword,
    getCurrentUser,
    RefreshAccessToken,
    getUserChannelProfile,
    subscribers_list,
    getWatchHistory,
    // deleteUserAccount
}