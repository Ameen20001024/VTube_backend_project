import mongoose from "mongoose";
import { ApiError } from "../utils/apierror.js";
import { ApiResponse } from "../utils/apiResponse.js";
// import { uploadoncloudinary } from "../utils/cloudinary";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
// import { Video } from "../models/video.models";
import { Subscription } from "../models/subscriptions.models.js";


const subscribechannel = asyncHandler(async (req, res) => {
    
    const {username} = req.params

    if (!username) {
        throw new ApiError(400, "channel not found")
    }

    const channelowner = await User.findOne({username})

    const subscriber_id = req.user?._id

    if (!subscriber_id) {
        throw new ApiError(400, "Subscriber not identified")
    }

    const channelowner_id = channelowner._id

    if (!channelowner_id) {
        throw new ApiError(400, "Channel owner not identified")
    }

    const subscription = await Subscription.create({
        subscriber: subscriber_id,
        channel: channelowner_id
    })

    if (!subscription) {
        throw new ApiError(400, "Subscription failed")
    }

    return res
    .status(200)
    .cookie("Channelowner_ID", channelowner_id)
    .json(
        new ApiResponse(200, subscription, "Channel subscribed successfully")
    )

})


const unSubscribeChannel = asyncHandler(async (req, res) => {

    const {username} = req.params
    const channelowner = await User.findOne({username})

    if (!channelowner) {
        throw new ApiError(400, "Channel data not fetched")
    }

    const channelowner_id = channelowner._id

    if (!channelowner_id) {
        throw new ApiError(400, "Channel Id data not fetched")
    }

    const subscriber_id = req.user?._id

    const allChannelSubscribers = await Subscription.find({channel: channelowner_id})

    if (!allChannelSubscribers) {
        throw new ApiError(400, "could not fetch all subscriptions")
    }

    const subscription = allChannelSubscribers.find((field)=> field.subscriber.toString() === subscriber_id.toString())

    if (!subscription) {
        throw new ApiError(400, "could not fetch subscription object")
    }

    const subscription_id = subscription._id

    try {
        await Subscription.findByIdAndDelete(subscription_id)
    } catch (error) {
        throw new ApiError(400,"Unsubscription failed")
    }

    const isSubscribed = false

    return res
    .status(200)
    .json(
        new ApiResponse(200, isSubscribed, "Unsubscription successful")
    )

})


const channelsSubscribedToList = asyncHandler(async (req, res) => {
    
    const subscriber_id = req.user?._id

    const allChannelsSubscribedTo = await Subscription.find({subscriber: subscriber_id}).populate('channel')

    if (!allChannelsSubscribedTo) {
        throw new ApiError(400, "could not fetch all subscriptions")
    }

    const channelsSubscribedTo_list = allChannelsSubscribedTo.map(object => ({fullname: object.channel.fullname, username: object.channel.username, avatar: object.channel.avatar}))

    if (!channelsSubscribedTo_list.length) {
        throw new ApiError(400, "List of channels subscribed to is not fetched")
    }

    return res.status(200).json(
        new ApiResponse(200, channelsSubscribedTo_list, "List of channel subscriptions are fetched")
    )

})


export {
    channelsSubscribedToList,
    unSubscribeChannel,
    subscribechannel
}