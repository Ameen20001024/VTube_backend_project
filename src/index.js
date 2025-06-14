import dotenv from "dotenv";
import connectdb from "./db/index.js";
import {app} from './app.js'

dotenv.config({
    path: './.env'
})

connectdb()
.then(() =>{
    app.listen(process.env.PORT || 8000, () =>{
        console.log(`Server is running at port : ${process.env.PORT}`);
    })
    app.on('error', (error)=> {
        console.log("ERROR: ", error)
        throw error
    })
})

.catch((error) => {
    console.log("MONGODB connection failed ", error)
})

// 5.30