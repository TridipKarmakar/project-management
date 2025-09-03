import { body } from "express-validator";


const userRegisterValidator = () => {
    return [
        body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Email is invalid"),
        body("username")
        .trim()
        .notEmpty()
        .withMessage("Username is required")
        .isLowercase()
        .withMessage("Username is must be in the lowercase")
        .isLength({min: 3})
        .withMessage("Username must be at least 3 charecters long"),
        body("password")
        .trim()
        .notEmpty()
        .withMessage("Password is required"),
        body("fullname")
        .optional()
        .trim()

    ]

}


const userLoginvalidator = () => {
return [
    body("emial").optional()
    .isEmail()
    .withMessage("Email is valied"),
    body("password")
    .notEmpty()
    .withMessage("password is required")
]
}

const userChnageCurrentpasswordValidator = () => {
    return [
        body("oldPassword")
            .notEmpty()
            .withMessage("Old password is required"),
            body("newPassword")
             .notEmpty()
            .withMessage("New password is required"),
            
    ]
}

const  userForgotPasswordRequestValidator = () => {
    return  [
        body("email")
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Email is invalid")
    ]
}


const userResetForgotPasswordValidator = () => {
    return [
        body("newPassword")
            .notEmpty()
            .withMessage("Password is required")
    ]
}

export {
    userRegisterValidator,  userLoginvalidator,
    userChnageCurrentpasswordValidator,
    userForgotPasswordRequestValidator,
    userResetForgotPasswordValidator
}