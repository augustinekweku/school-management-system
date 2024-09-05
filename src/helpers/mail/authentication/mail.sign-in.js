import SignInMailTemplate from "../templates/template.sign-in.js"
import MailTransporter from "../transport.js"

const useSignInMailer = async (payload) => {
    const transporter = MailTransporter()
    const name = `${payload.firstname} ${payload.lastname}`
    const template = SignInMailTemplate(payload.otp)
    try {
        const sendMessage = await transporter.sendMail({
            from: `EDUMINFO < ${process.env.SMS_MAIL_ADDRESS}>`,
            to: `${name} < ${payload.email}>`,
            subject: 'OTP Verification',
            html: template,
        })
        if (sendMessage.accepted.includes(payload.email)) return true
        return false
    } catch (error) {
        return false
    }
}
export default useSignInMailer