import express from "express"
import cors from "cors";
import cookieParser from "cookie-parser"

const app = express()
app.set("trust proxy", true);

// basic configarations
app.use(express.json({limit : "16kb"}))
app.use(express.urlencoded({extended:true,limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())



// cors configaration
app.use(cors(
    {
        origin: process.env.CORS_ORIGIN?.split(",") ||"http://localhost:5173",
        credentials:true,
        method: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
        allowedHeaders: ["Content-Type","Authorization"],

    }
))


// import the routes

import healthcheckRouter from "./routes/healthcheck.routes.js";
import authRouter from "./routes/auth.routes.js";




app.use("/api/v1/healthcheck",healthcheckRouter)
app.use("/api/v1/auth",authRouter)

app.get('/', (req, res) => {
  res.send('welome to basecampy!')
})



export default app

