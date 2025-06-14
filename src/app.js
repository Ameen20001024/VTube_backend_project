import express from "express"
import cookieParser from "cookie-parser"
import cors from 'cors'

const app = express()

app.use(cors)
app.use(cookieParser)

app.use(express.json({limit: '16kb'}))
app.use(express.static('public'))
app.use(express.urlencoded({extended: true, limit: '16kb'}))


import userRouter from "./routes/user.routes.js"
import videoRouter from "./routes/video.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import commentsRouter from "./routes/comments.routes.js"
import likesRouter from "./routes/likes.routes.js"
import playlistRouter from "./routes/playlist.routes.js"

app.use("/api/v1/users", userRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/channels", subscriptionRouter)
app.use("/api/v1/comments", commentsRouter)
app.use("/api/v1/likes", likesRouter)
app.use("/api/v1/playlists", playlistRouter)


export {app}

