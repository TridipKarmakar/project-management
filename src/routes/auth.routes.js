import { Router } from "express";
import { registerUser, login, logoutUser,getCurrentUser, verifyEmail, resendEmailVerification, refreshAccessToken,
forgotPasswordRequest,
resetForgotPassword,
changeCurrentPassword  } from "../controllers/auth.controllers.js";
import { validate } from "../middlewares/validator.middlewares.js";
import {  userRegisterValidator,userLoginvalidator, userChnageCurrentpasswordValidator,userForgotPasswordRequestValidator,
userResetForgotPasswordValidator } from "../validators/index.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()

//unsecured routes 
router.route("/register").post(userRegisterValidator(),validate,registerUser) // verified routes

router.route("/login").post(userLoginvalidator(),validate,login) // verified routes

router.route("/verify-email/:verificationToken").get(verifyEmail) 

router.route("/refresh-token").post(refreshAccessToken) // verified routes

router.route("/forgot-password").post(userForgotPasswordRequestValidator(),validate,forgotPasswordRequest) 

router.route("/reset-password/:resetToekn").post(userResetForgotPasswordValidator(),validate,resetForgotPassword)



//secure routes
router.route("/logout").post(verifyJWT, logoutUser) // verified routes

router.route("/current-user").post(verifyJWT, getCurrentUser) // verified routes

router.route("/change-password").post(verifyJWT, userChnageCurrentpasswordValidator(),validate,changeCurrentPassword) // verified routes

router.route("/resend-email-verification").post(verifyJWT, resendEmailVerification)

export default router