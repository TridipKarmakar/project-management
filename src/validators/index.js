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


export {
    userRegisterValidator
}