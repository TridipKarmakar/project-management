import { User } from "../models/user-models.js"
import { ApiResponse } from "../utiles/api-response.js"
import { ApiError } from "../utiles/api-error.js"
import { asyncHandler } from "../utiles/async-handler.js"
import { emailVerificationMailgenContent, sendEmail } from "../utiles/mail.js";

const generateAccessAndgenerateRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})
        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500,"Something went wrong wile generating access token");
        
    }
}



const registerUser = asyncHandler(async (req,res)=>{
    const {email, username, password, role} = req.body

    const existedUser = await User.findOne({
        $or: [{username},{email}]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email oor username already exist")
    }

    const user = await User.create({
        email,  
        password, 
        username, 
        isEmailVerified: false})



    const {unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken()

    user.emailverificationToken = hashedToken 
    user.emailverificationExpiry = tokenExpiry 

    await user.save({validateBeforeSave: false})

    
    await sendEmail(
        {
            email: user?.email,
            subject: "Pelease verify your email",
            mailgenContent: emailVerificationMailgenContent(
                user.username,
                `${req.protocol}://${req.get("host")}/api/v1/user/verify-email/${unHashedToken}`
            )

        }
    )

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken -emailverificationToken -emailverificationExpiry"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong wile registering a user");
        
    }


    return res 
    .status(201)
    .json(
        new ApiResponse(
            200,
            {
                user: createdUser
            },
            "User registered successfully and verification email has been sent on your email."
        )
    )

})

export {
    registerUser
}