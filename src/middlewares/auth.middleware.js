import { User } from "../models/user-models.js";
import { ApiError } from "../utiles/api-error.js";
import { asyncHandler } from "../utiles/async-handler.js";

export const verifyJWT = asyncHandler(
    async(req,res,next) => {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")

        if(!token) {
            throw new ApiError(401,"Unauthoried request");
        }
        try {
            const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRATE)
            const user = await User.findById(decodedToken?._id).select("-password -refreshToken -emailverificationToken -emailverificationExpiry")
            
        if(!user) {
            throw new ApiError(401,"Invalid access token");
        }

        req.user = user

        next()
        } catch (error) {
            throw new ApiError(401,"Invalid access token");
        }
    }
)