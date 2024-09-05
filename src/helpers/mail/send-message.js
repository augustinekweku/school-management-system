import MailTransporter from "./transport.js"

const account = {
    firstname: 'Prince',
    lastname: 'Jefferson',
    email: 'kalenuxoesekwasi@gmail.com'
}

const useMessenger = async () => {
    const transporter = MailTransporter()
    try {
        const sendMessage = await transporter.sendMail({
            from: `SMS < ${process.env.SMS_MAIL_ADDRESS}>`,
            to: `${account.firstname} ${account.lastname} < ${account.email}>`,
            subject: 'Two-Factor Authentication',
            html: '<p>Testing new mail</p>',
        })

        if (sendMessage.accepted.includes(account.email)) return true
        return false
    } catch (error) {
        return false
    }
}
export default useMessenger