import { User } from "../models/user-models.js"
import { ApiResponse } from "../utiles/api-response.js"
import { ApiError } from "../utiles/api-error.js"
import { asyncHandler } from "../utiles/async-handler.js"
import { emailVerificationMailgenContent, forgotPasswordMailgenContent, sendEmail } from "../utiles/mail.js";
import jwt from "jsonwebtoken";

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



    const { unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken()

    user.emailverificationToken = hashedToken 
    user.emailverificationExpiry = tokenExpiry 

    await user.save({validateBeforeSave: false})

    await sendEmail(
        {
            email: user?.email,
            subject: "Please verify your email",
            mailgenContent: emailVerificationMailgenContent(
                user.username,
                `${process.env.BASE_URL}/api/v1/user/verify-email/${unHashedToken}`
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

const login = asyncHandler(async (req,res) => {
    const { email, password, username } = req.body

    if (!email) {
        throw new ApiError(400,"Username or email is required");
    }

    const user = await User.findOne({email})

    if (!user) {
        throw new ApiError(400,"User does not exists");
    }
    const isPasswordCorrect =  await user.isPasswordCorrect(password)
    
    if (!isPasswordCorrect) {
        throw new ApiError(400,"Invalid credentials");
    }
    

    const { accessToken, refreshToken } = await generateAccessAndgenerateRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken -emailverificationToken -emailverificationExpiry"
    )

    const option = {
        httpOnly : true,
        secure : true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, option)
        .cookie("refreshToken", refreshToken, option)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken, 
                },
                "User logged in successfully"
            ))
})

const logoutUser = asyncHandler(async (req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set : {
                refreshToken: ""
            }
        },
        {
            new: true
        },

    )

    const options = {
        httpOnly: true,
        secure: true,
        secure: true
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "User logged out")
    )
})

const getCurrentUser =  asyncHandler(async(req,res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                req.user,
                "Current user fetch successfully"
            )
        )

})

const verifyEmail =  asyncHandler(async(res,req) => {
    const {verificationToken} = req.params

    if(!verificationToken){
        throw new ApiError(400, "Email verification token is missing");
    }

    let hasedToken = crypto
        .createHash("sha256")
        .update(verificationToken)
        .digest("hex")

        const user = await User.findOne({
            emailverificationToken: hasedToken,
            emailverificationExpiry: {$gt: Date.now()}
        })


    if(!verificationToken){
        throw new ApiError(400, "Token is invalid or expired");
    }

    user.emailverificationToken = undefined
    user.emailverificationExpiry = undefined

    user.isEmailVerified = true 
    await user.save({validateBeforeSave: false})

    return res 
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    isEmailVerified: true,
                },
                "Email is verified"
            )
        )
})

const resendEmailVerification =  asyncHandler(async(res,req) => {
    const user =  await User.findById(req.user?._id)

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    if (user.isEmailVerified) {
        throw new ApiError(404, "Email is already verified");
    }

    const {unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken()

    user.emailverificationToken = hashedToken 
    user.emailverificationExpiry = tokenExpiry 

    await user.save({validateBeforeSave: false})

    
    await sendEmail(
        {
            email: user?.email,
            subject: "Please verify your email",
            mailgenContent: emailVerificationMailgenContent(
                user.username,
                `${process.env.BASE_URL}/api/v1/user/verify-email/${unHashedToken}`
            )
        }
    )

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Mail has been sent to your email ID"
            )
        )

})

const refreshAccessToken =  asyncHandler(async(req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401,"Unauthorised access");        
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRATE)
        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401,"Invalid refresh token");   
        }     

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401,"Refesh token is expired");
        }

        const options ={
            httpOnly: true,
            secure: true
        }

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndgenerateRefreshToken(user._id)

        user.refreshToken = newRefreshToken
        await user.save()

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {accessToken, refreshToken: newRefreshToken},
                    "Access token refreshed"
                )
            )

    } catch (error) {
            throw new ApiError(401,"Invalid refresh token");
    }

})


const forgotPasswordRequest =  asyncHandler(async(req, res) => {
    const {email} = req.body

    const user = await User.findOne({email})

    if(!user){
        throw new ApiError(404, "User dones not exist");
    }

    const {unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken()

    user.forgotPasswordToken = hashedToken
    user.forgotPasswordExpiry = tokenExpiry

    await user.save({validatebeforeSave: false})
   
    await sendEmail(
        {
            email: user?.email,
            subject: "Password Reset request",
            mailgenContent: forgotPasswordMailgenContent(
                user.username,
                `${process.env.FORGOT_PASSWORD_REDIRECT_URLL}/${unHashedToken}`,
            )
        }
    )
    
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
                "Password reset mail has been sent on your mail id"       
        )
    )    
})

const resetForgotPassword =  asyncHandler(async(res,req) => {
    const {resetToekn} = req.params
    const {newPassword} = req.body
    let hashedToken = crypto
        .createHash("sha256")
        .update(resetToekn)
        .digest("hex")
        
        const user = await User.findOne({
            forgotPasswordToken : hashedToken,
            forgotPasswordExpiry: {$gt: Date.now()}
        })

        if(!user){
            throw new ApiError(489,"Token is invalid or expired");
        }

        user.forgotPasswordExpiry = undefined 
        user.forgotPasswordToken = undefined

        user.password = newPassword
        await user.save({validateBeforeSave: false})

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {},
                    "Password reset successfully"
                )
            )

})

const changeCurrentPassword =  asyncHandler(async(req,res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)

    const isPassswordValid = await user.isPasswordCorrect(oldPassword)

    if(!isPassswordValid){
        throw new ApiError(400, "Invalid old Password")
        }
    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Passwprd change successfully"))
    
})


export {
    registerUser, 
    login, 
    logoutUser, 
    getCurrentUser, 
    verifyEmail,
    resendEmailVerification,
    refreshAccessToken,
    forgotPasswordRequest,
    resetForgotPassword,
    changeCurrentPassword
}