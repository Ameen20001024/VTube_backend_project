import { v2 as cloudinary } from "cloudinary";
import fs from 'fs'
import { ApiError } from "./apierror";

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadoncloudinary = async (lfpath) => {
    try {
        if(!lfpath) return null

        const response = await cloudinary.uploader.upload(lfpath,{
            resource_type: "auto"   
        })

        fs.unlink(lfpath)
        return response

    } catch (error) {
        fs.unlink(lfpath)
        return null
    }
}

const deletefromcloudinary = async (public_id, resource_type = "auto") => {
    try {

        if(!public_id) return null

        const response = await cloudinary.uploader.destroy(public_id, {resource_type: resource_type, invalidate: true})

        return response

    } catch (error) {
        throw new ApiError(400, "File not deleted")
    }



}

export {uploadoncloudinary , deletefromcloudinary}

