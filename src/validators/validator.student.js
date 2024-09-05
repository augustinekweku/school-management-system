import StringManipulators from '../utils/algos/StringManipulators.js'
import { Regex } from '../utils/static/index.js'
import moment from 'moment'

export default function StudentValidator() {
    const { MONGOOBJECT, ALPHA, CSVDOT_HYPHEN, NUMERICAL, ISBASE64 } = Regex
    const { polishLongTexts } = StringManipulators()
    const createStudentValidator = (data, next) => {
        const { firstname, othername, lastname, gender, nationality,
            dob, language, telephone, address, school_id, last_school_attended,
            is_new_student, class_id, passport_photo } = data
        if (!school_id.toString().match(MONGOOBJECT) ||
            !class_id.toString().match(MONGOOBJECT)
        ) return { error: 'Bad request' }
        if (!['male', 'female'].includes(gender.toLowerCase())) return { error: 'Selected gender was rejected' }
        if (![true, false].includes(is_new_student)) return { error: "Incorrect student's status selected" }
        // if (!firstname.match(ALPHA) || !lastname.match(ALPHA)) return { error: 'Names must contain only English alphabets and whitespaces' }
        if (firstname.length < 3 || firstname.length > 100 || lastname.length < 3 || lastname.length > 100) return { error: 'Firstname and lastname must be in the range of 3 to 100 chars' }
        if (!nationality.match(ALPHA)) return { error: 'Selected nationality does not exists' }
        const checkDOB = moment((new Date(dob.substring(0, 10))))
        if (!moment(checkDOB, true).isValid()) return { error: 'Date of birth is not a valid date' }
        const othernameIsBlank = othername.toString().trim().length === 0
        const addressIsBlank = address.toString().trim().length === 0
        const lastSchoolAttended = last_school_attended.toString().trim().length === 0
        const telephoneIsBlank = polishLongTexts(telephone).length === 0
        if (!telephoneIsBlank) {
            if (!telephone.match(NUMERICAL) ||
                polishLongTexts(telephone).length !== 10 ||
                parseInt(polishLongTexts(telephone).charAt(0)) !== 0
            ) return { error: 'Telephone must be a numerical string of 10 chars, starting with 0' }
        }
        // if (!othernameIsBlank) {
        //     if (!othername.toString()
        //         .match(ALPHA)) return { error: 'Othernames must contain only English alphabets and whitespaces' }
        // }
        // if (!addressIsBlank) {
        //     if (!address.toString()
        //         .match(CSVDOT_HYPHEN)) return { error: 'Unexpected characters found in address' }
        // }
        // if (!lastSchoolAttended) {
        //     if (!last_school_attended.match(CSVDOT_HYPHEN))
        //         return { error: 'Unexpected characters found in last school attended' }
        // }
        let languageIsTrue = true
        for (let i = 0; i < language.length; i++) {
            const languageItem = language[i]
            if (!languageItem.match(ALPHA)) languageIsTrue = false
            if (languageItem.toString().trim().length < 2) languageIsTrue = false
        }
        if (!languageIsTrue) return { error: 'Language must contain only English alphabets and be of at least 2 chars' }
        const photo_parts = passport_photo.split(',', 2)
        if (photo_parts.length === 2) {
            const photo_ext = photo_parts[0]
            const photo_data = photo_parts[1]
            if (!photo_data.match(ISBASE64)) return { error: 'No passport photo found' }
            if (photo_ext !== "data:image/png;base64" && photo_ext !== "data:image/jpeg;base64" && photo_ext !== "data:image/jpg;base64") return { error: 'Photo type is unaccepted. Choose jpeg, jpg, png files only.' }
        }
        next()
    }
    const studentUpdateValidator = (data, next) => {
        const {
            student_id, classes, firstname, othername, lastname, gender, nationality,
            dob, language, telephone, address, last_school_attended,
            is_new_student, passport_photo, current_class
        } = data
        if (!student_id.toString().match(MONGOOBJECT) ||
            !current_class.match(MONGOOBJECT)
        ) return { error: 'Bad request' }
        if (!['male', 'female'].includes(gender.toLowerCase())) return { error: 'Selected gender was rejected' }
        if (![true, false].includes(is_new_student)) return { error: "Incorrect student's status selected" }
        // if (!firstname.match(ALPHA) || !lastname.match(ALPHA)) return { error: 'Names must contain only English alphabets and whitespaces' }
        if (firstname.length < 3 || firstname.length > 100 || lastname.length < 3 || lastname.length > 100) return { error: 'Firstname and lastname must be in the range of 3 to 100 chars' }
        if (!nationality.match(ALPHA)) return { error: 'Selected nationality does not exists' }
        const checkDOB = moment((new Date(dob.substring(0, 10))))
        if (!moment(checkDOB, true).isValid()) return { error: 'Date of birth is not a valid date' }
        const othernameIsBlank = othername.toString().trim().length === 0
        const addressIsBlank = address.toString().trim().length === 0
        const lastSchoolAttended = last_school_attended.toString().trim().length === 0
        const telephoneIsBlank = polishLongTexts(telephone).length === 0
        if (!telephoneIsBlank) {
            if (!telephone.match(NUMERICAL) ||
                polishLongTexts(telephone).length !== 10 ||
                parseInt(polishLongTexts(telephone).charAt(0)) !== 0
            ) return { error: 'Telephone must be a numerical string of 10 chars, starting with 0' }
        }
        // if (!othernameIsBlank) {
        //     if (!othername.toString()
        //         .match(ALPHA)) return { error: 'Othernames must contain only English alphabets and whitespaces' }
        // }
        // if (!addressIsBlank) {
        //     if (!address.toString()
        //         .match(CSVDOT_HYPHEN)) return { error: 'Unexpected characters found in address' }
        // }
        // if (!lastSchoolAttended) {
        //     if (!last_school_attended.match(CSVDOT_HYPHEN))
        //         return { error: 'Unexpected characters found in last school attended' }
        // }
        let languageIsTrue = true
        for (let i = 0; i < language.length; i++) {
            const languageItem = language[i]
            if (!languageItem.match(ALPHA)) languageIsTrue = false
            if (languageItem.toString().trim().length < 2) languageIsTrue = false
        }
        if (!languageIsTrue) return { error: 'Language must contain only English alphabets and be of at least 2 chars' }
        let classIsTrue = true
        for (let i = 0; i < classes.length; i++) {
            const classItem = classes[i]
            if (!classItem.match(MONGOOBJECT)) classIsTrue = false
        }
        if (!classIsTrue) return { error: 'Incorrect classes passed' }
        if (!classes.includes(current_class)) return { error: "Student's current class error" }
        const photo_parts = passport_photo.split(',', 2)
        if (photo_parts.length === 2) {
            const photo_ext = photo_parts[0]
            const photo_data = photo_parts[1]
            if (!photo_data.match(ISBASE64)) return { error: 'No passport photo found' }
            if (photo_ext !== "data:image/png;base64" && photo_ext !== "data:image/jpeg;base64" && photo_ext !== "data:image/jpg;base64") return { error: 'Photo type is unaccepted. Choose jpeg, jpg, png files only.' }
        }
        next()
    }
    return {
        createStudentValidator, studentUpdateValidator
    }
}