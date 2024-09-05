import nodemailer from 'nodemailer'

const MailTransporter = () => {
    const transporter = nodemailer.createTransport({
        service: process.env.SMS_MAIL_SERVICE,
        host: process.env.SMS_MAIL_SERVER,
        port: Number(process.env.SMS_MAIL_PORT),
        secure: true,
        auth: {
            user: process.env.SMS_MAIL_ADDRESS,
            pass: process.env.SMS_GMAIL_APP_PASSWORD,
        }
    })
    return transporter
}
export default MailTransporter