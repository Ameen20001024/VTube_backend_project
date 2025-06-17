import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const userSchema = new Schema(
    {
        username:{
            type: String,
            required: true,
            lowercase: true,
            unique: true,
            trim: true,
            index: true
        },

        email:{
            type: String,
            required: true,
            lowercase: true,
            unique: true,
            trim: true
        },

        fullname:{
            type: String,
            required: true,
            trim: true,
            index: true
        },

        avatar:{
            required: true,
            type: String
        },

        coverimage:{
            type: String
        },

        password:{
            required: [true, "Password is required"],
            type: String
        },

        watchHistory:[{
            type: Schema.Types.ObjectId,
            ref: "video"
        }],

        refreshtoken:{
            type:String
        }
    },

    {
        timestamps: true
    }
)

userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordcorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateaccesstoken = function () {
    return jwt.sign(
        {
            _id : this._id,
            email : this.email,
            username : this.username,
            fullname : this.fullname
        },
        process.env.ACCESSTOKENSECRET,
        {
            expiresIn: process.env.ACCESSTOKENEXPIRY
        }
    )
}

userSchema.methods.generaterefreshtoken = function () {
    return jwt.sign(
        {
            _id : this._id
        },
        process.env.REFRESHTOKENSECRET,
        {
            expiresIn: process.env.REFRESHTOKENEXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)