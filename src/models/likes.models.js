import mongoose, {Schema} from "mongoose";

const likeSchema = new Schema(
    {

        video:{
            type: Schema.Types.ObjectId,
            ref: "Video"
        },

        comment: {
            type: Schema.Types.ObjectId,
            ref: "Comments"
        },

        playlist: {
            type: Schema.Types.ObjectId,
            ref: "Playlist"
        },

        user:{
            type: Schema.Types.ObjectId,
            ref: "User"
        }

    },

    {
        timestamps: true
    })

export const Likes = mongoose.model("Likes", likeSchema)