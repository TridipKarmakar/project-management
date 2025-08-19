
import Mailgen from "mailgen";
import nodemailer from "nodemailer"


const sendEmail = async (option) => {
    const mailGenerator = new Mailgen(
        {
            theme: "default",
            product: {
                name: "Task Manager",
                link: "https://taskmanagerlink.com"
            }
        }
    )

    const emailTextual = mailGenerator.generatePlaintext(option.mailgenContent)
    const emailHtml = mailGenerator.generate(option.mailgenContent)

    const transpoter = nodemailer.createTransport({
        host: process.env.MAILTRAP_SMTP_HOST,
        port: process.env.MAILTRAP_SMTP_PORT,
        auth: {
            user: process.env.MAILTRAP_SMTP_USER,
            pass: process.env.MAILTRAP_SMTP_PASS
        }
    })

    const mail = {
        from: "mail.taskmanager@example.com",
        to: option.email,
        subject: option.subject,
        text: emailTextual,
        html: emailHtml
    }

    try {
        await transpoter.sendMail(mail)
    } catch (error) {
        console.error("Email service failed siliently. Make sure that you have provided your MailTrap credentials in the .env file");
        console.error("Error: ",error);
    }

}

const emailVerificationMailgenContent = (username, verficationUrl) => {
    return {
        body: {
            name: username,
            intro: "Welcome to our App! we're excited to have you on board.",
            action:{
                instructions: "To verify your email please click on the following button",
                button: {
                    color: "#22BC66",
                    text: "Verify your email",
                    link: verficationUrl
                }
            },
            outro: "Need hel, or have questions? Just reply to this mail, we'd love to help."
        }
    }
}
const forgotPasswordMailgenContent = (username, passwordResetUrl) => {
    return {
        body: {
            name: username,
            intro: "We gota requet to reset the password of your account.",
            action:{
                instructions: "To reset your password click on the following button or link",
                button: {
                    color: "#22BC66",
                    text: "Reset Password",
                    link: passwordResetUrl
                }
            },
            outro: "Need help, or have questions? Just reply to this mail, we'd love to help."
        }
    }

}

export { emailVerificationMailgenContent, forgotPasswordMailgenContent,sendEmail }