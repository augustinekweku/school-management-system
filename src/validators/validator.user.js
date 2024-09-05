import StringManipulators from "../utils/algos/StringManipulators.js"
import { Numerical_Entity, Regex } from "../utils/static/index.js"

export default function UserValidator() {
    const { ALPHA, PASSWORD, EMAIL, NUMERICAL, CSVDOT_HYPHEN, MONGOOBJECT } = Regex, { TWOINARRAY } = Numerical_Entity
    const { cleanExcessWhiteSpaces } = StringManipulators()
    const validateRegistration = (data, next) => {
        let {
            firstname, lastname, email, gender, phone, password, password_confirmation,
            school_name, school_country
        } = data
        firstname = cleanExcessWhiteSpaces(firstname)
        lastname = cleanExcessWhiteSpaces(lastname)
        phone = cleanExcessWhiteSpaces(phone)
        school_name = cleanExcessWhiteSpaces(school_name)
        // if (!firstname.match(ALPHA) || !lastname.match(ALPHA) || !school_country.match(ALPHA)) return { error: 'Only English alphabets and whitespaces allowed for country, firstname and lastname' }
        if (!password.match(PASSWORD)) return { error: 'The password must include a combination of uppercase and lowercase English letters, at least one digit, and at least one special character' }
        if (!email.match(EMAIL)) return { error: 'Incorrect email address' }
        if (!phone.match(NUMERICAL) || phone.length !== 10 ||
            parseInt(phone.charAt(0)) !== 0
        ) return { error: 'Phone number must be a numerical string of 10 chars, starting with 0' }
        if (firstname.length < 3 || firstname.length > 100 || lastname.length < 3 || lastname.length > 100) return { error: 'Firstname and lastname must be in the range of 3 to 100 chars' }
        if (password.length < 8) return { error: 'Password must be of at least 8 chars' }
        if (password !== password_confirmation) return { error: 'Passwords do not match' }
        if (!['male', 'female'].includes(gender.toLowerCase())) return { error: 'Gender rejected' }
        // if (!school_name.match(CSVDOT_HYPHEN)) return { error: 'Unexpected characters found in name of school' }
        // if (school_name.length < 3) return { error: 'School name is too short' }
        next()
    }
    const passwordResetValidator = (user, code, password, password_confirmation, next) => {
        if (!user.toString().match(MONGOOBJECT) || code.length < 36) return { error: 'Bad request received' }
        if (password.length < 8) return { error: 'Password must be of at least 8 chars' }
        if (!password.match(PASSWORD)) return { error: 'The password must include a combination of uppercase and lowercase English letters, at least one digit, and at least one special character' }
        if (password !== password_confirmation) return { error: 'Passwords do not match' }
        return next()
    }
    const loginValidator = (email, password, next) => {
        if (!email.length || !password.length) return { error: 'Email and password required' }
        if (password.length < 8 || !password.match(PASSWORD)) return { error: 'Incorrect credentials' }
        if (!email.match(EMAIL)) return { error: 'Incorrect credentials' }
        next()
    }
    const otpValidator = (user, otp, next) => {
        if (!user.toString().match(MONGOOBJECT) || !otp.toString().match(NUMERICAL)) return { error: 'Bad request' }
        if (otp.length !== 6) return { error: 'Incorrect OTP' }
        next()
    }
    const userUpdateValidator = (data, next) => {
        const { id, firstname, lastname, email, phone, usertype, gender, roles } = data
        if (!id.match(MONGOOBJECT)) return { error: 'User not found' }
        // if (!firstname.match(ALPHA) || !lastname.match(ALPHA)) return { error: 'Only English alphabets and whitespaces allowed for firstname and lastname' }
        if (!email.match(EMAIL)) return { error: 'Incorrect email address' }
        if (!phone.match(NUMERICAL) || phone.length !== 10 ||
            parseInt(phone.charAt(0)) !== 0
        ) return { error: 'Phone number must be a numerical string of 10 chars, starting with 0' }
        if (firstname.length < 3 || firstname.length > 100 || lastname.length < 3 || lastname.length > 100) return { error: 'Firstname and lastname must be in the range of 3 to 100 chars' }
        if (!['male', 'female'].includes(gender.toLowerCase())) return { error: 'Gender rejected' }
        if (![1, 2, 3, 4, 5].includes(Number(usertype))) return { error: 'Usertype was rejected' }
        if (!Array.isArray(roles)) return { error: 'Roles must be an array of strings' }
        let isRole = true
        for (let i = 0; i < roles.length; i++) {
            const role = roles[i]
            if (!role.match(ALPHA) || cleanExcessWhiteSpaces(role).length === 0) isRole = false
        }
        if (!isRole) return { error: 'Roles must consist solely of English alphabet strings with a length greater than 1' }
        next()
    }
    return {
        validateRegistration, passwordResetValidator, otpValidator, loginValidator, userUpdateValidator
    }
}