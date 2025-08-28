import { User } from "../models/user-models.js";
import { ApiError } from "../utiles/api-error.js";
import { asyncHandler } from "../utiles/async-handler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(
    async(req,res,next) => {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")

        if(!token) {
            throw new ApiError(401,"Unauthoried request token nout found");
        }
        try {
            const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRATE)
            
            const user = await User.findById(decodedToken?._id).select("-password -refreshToken -emailverificationToken -emailverificationExpiry")
            console.log(user);
            
            if(!user) {
                throw new ApiError(401,"Invalid access token and decoded user not found");
            }

        req.user = user

        next()
        } catch (error) {
            throw new ApiError(401,"Invalid access token or it may be expired");
        }
    }
)