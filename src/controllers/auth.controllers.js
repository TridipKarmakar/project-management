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
    

    const {accessToken, refreshToken}= await generateAccessAndgenerateRefreshToken(user._id)

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


const getCurrentUser =  asyncHandler(async(res,req) => {
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

// const getCurrentUser =  asyncHandler(async(res,req) => {})



export {
    registerUser, 
    login, 
    logoutUser, 
    getCurrentUser, 
    verifyEmail,
    resendEmailVerification
}