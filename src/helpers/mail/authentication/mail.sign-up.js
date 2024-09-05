import SignUpMailTemplate from "../templates/template.sign-up.js"
import MailTransporter from "../transport.js"

const useSignUpMailer = async (payload) => {
    const transporter = MailTransporter()
    const name = `${payload.firstname} ${payload.lastname}`
    const template = SignUpMailTemplate(name, payload.link)
    try {
        const sendMessage = await transporter.sendMail({
            from: `EDUMINFO < ${process.env.SMS_MAIL_ADDRESS}>`,
            to: `${name} < ${payload.email}>`,
            subject: 'Account Verification',
            html: template,
        })
        if (sendMessage.accepted.includes(payload.email)) return true
        return false
    } catch (error) {
        return false
    }
}
export default useSignUpMailer