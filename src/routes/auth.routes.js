import { Router } from "express";
import { registerUser,login, logoutUser  } from "../controllers/auth.controllers.js";
import { validate } from "../middlewares/validator.middlewares.js";
import {  userRegisterValidator,userLoginvalidator } from "../validators/index.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()

router.route("/rgister").post(userRegisterValidator(),validate,registerUser)
router.route("/login").post(userLoginvalidator(),validate,login)

//securer routes
router.route("/logout").post(verifyJWT, logoutUser)


export default router