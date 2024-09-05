import { Regex } from "../utils/static/index.js"

export default function StudentAccessValidations() {
    const { PASSWORD, ISBASE64 } = Regex
    const loginValidator = (data, next) => {
        let { username, password } = data
        if (!password.match(PASSWORD)) return { error: 'Incorrect credentials' }
        if (username.length < 5 || password.length < 8) return { error: 'Incorrect credentials' }
        next()
    }

    const validateAccountSetting = (data, next) => {
        const { password, passport_photo } = data
        const photo_parts = passport_photo.split(',', 2)
        const photo_ext = photo_parts[0]
        const photo_data = photo_parts[1]
        const passwordIsBlank = password.length === 0
        if (passwordIsBlank && photo_data === undefined) return { error: 'Cannot continue to process the request' }
        if (!passwordIsBlank) {
            if (!password.match(PASSWORD)) return { error: 'Password must contain uppercase, lowercase alphabets, numbers and special chars' }
            if (password.length < 8) return { error: 'Password must contain at least 8 chars' }
        }
        if (photo_data !== undefined) {
            if (!photo_data.match(ISBASE64)) return { error: 'No image files found' }
            if (photo_ext !== "data:image/png;base64" && photo_ext !== "data:image/jpeg;base64" && photo_ext !== "data:image/jpg;base64") return { error: 'Passport photo type is unaccepted. Choose jpeg, jpg, png files only.' }
        }
        next()
    }
    return {
        loginValidator, validateAccountSetting
    }
}