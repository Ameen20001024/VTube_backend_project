import jwt from "jsonwebtoken";
import { User } from "../models/user.models";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apierror";


export const verifyJWT = asyncHandler(async (req, __dirname, next) => {
    try {
        const token = req.cookie?.accesstoken
        if (!token) {
            throw new ApiError(401, "unautherised request")
        }

        const decodedtoken = jwt.verify(token, process.env.ACCESSTOKENSECRET)

        const user = await User.findById(decodedtoken?._id).select("-password -refreshtoken")

        if (!user) {
            throw new ApiError(401,"Invalid token")
        }

        req.user = user

        next()

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
})