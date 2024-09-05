import { ArrayData, Regex } from "../utils/static/index.js"
import StringManipulators from "../utils/algos/StringManipulators.js"

export default function ParentValidator() {
    const { MONGOOBJECT, ALPHA, CSVDOT_HYPHEN, NUMERICAL, PASSWORD, ALPHANUMERIC } = Regex
    const { relationshipArray, genderArray } = ArrayData
    const { cleanExcessWhiteSpaces } = StringManipulators()
    const parentCreatorValidator = (data, next) => {
        const { student_id, parent_id, firstname, othername, lastname, gender, relationship,
            phone, residential_address, postal_address, occupation, employer, work_address
        } = data
        if (!student_id.toString().match(MONGOOBJECT)) return { error: 'Bad request' }
        const parentIdIsBlank = cleanExcessWhiteSpaces(parent_id).length === 0
        const firstnameIsBlank = cleanExcessWhiteSpaces(firstname).length === 0
        const othernameIsBlank = cleanExcessWhiteSpaces(othername).length === 0
        const lastnameIsBlank = cleanExcessWhiteSpaces(lastname).length === 0
        const genderIsBlank = cleanExcessWhiteSpaces(gender).length === 0
        const relationshipIsBlank = cleanExcessWhiteSpaces(relationship).length === 0
        const phoneIsBlank = cleanExcessWhiteSpaces(phone.toString()).length === 0
        const residenceIsBlank = cleanExcessWhiteSpaces(residential_address).length === 0
        const postalAddrIsBlank = cleanExcessWhiteSpaces(postal_address).length === 0
        const occupationIsBlank = cleanExcessWhiteSpaces(occupation).length === 0
        const employerIsBlank = cleanExcessWhiteSpaces(employer).length === 0
        const workAddrIsBlank = cleanExcessWhiteSpaces(work_address).length === 0
        if (!parentIdIsBlank) {
            if (!parent_id.match(MONGOOBJECT)) return { error: 'Bad request' }
        }
        // if (!firstnameIsBlank) {
        //     if (!firstname.match(ALPHA)) return { error: 'Names must only contain English alphabets and whitespaces' }
        //     if (cleanExcessWhiteSpaces(firstname).length < 3 || cleanExcessWhiteSpaces(firstname).length > 50) return { error: 'Firstname and lastname must be in the range of 3 to 50 chars' }
        // }
        // if (!lastnameIsBlank) {
        //     if (!lastname.match(ALPHA)) return { error: 'Names must only contain English alphabets and whitespaces' }
        //     if (cleanExcessWhiteSpaces(lastname).length < 3 || cleanExcessWhiteSpaces(lastname).length > 50) return { error: 'Firstname and lastname must be in the range of 3 to 50 chars' }
        // }
        // if (!othernameIsBlank) {
        //     if (!othername.toString()
        //         .match(ALPHA)) return { error: 'Othernames must contain only English alphabets and whitespaces' }
        // }
        const pRelationship = relationship.toLowerCase(), pGender = gender.toLowerCase()
        if (!genderIsBlank) {
            if (!genderArray.includes(pGender)) return { error: 'Selected gender was rejected' }
        }
        if (!relationshipIsBlank) {
            if (!relationshipArray.includes(pRelationship)) return { error: 'Relationship type rejected' }
        }
        if (!genderIsBlank && !relationshipIsBlank) {
            if ((pRelationship === relationshipArray[0] && pGender !== genderArray[0]) ||
                (pRelationship === relationshipArray[1] && pGender !== genderArray[1])
            ) return { error: 'Gender and relationship mismatched' }
        }
        if (!phoneIsBlank) {
            if (!phone.match(NUMERICAL) ||
                cleanExcessWhiteSpaces(phone).length !== 10 ||
                parseInt(cleanExcessWhiteSpaces(phone).charAt(0)) !== 0
            ) return { error: 'Phone number must be a numerical string of 10 chars, starting with 0' }
        }
        // if (!residenceIsBlank) {
        //     if (!residential_address.match(CSVDOT_HYPHEN)) return { error: 'Unexpected characters found in residential address' }
        //     if (residential_address.length < 3) return { error: 'Residential address is blank' }
        // }
        // if (!postalAddrIsBlank) {
        //     if (!postal_address.toString()
        //         .match(CSVDOT_HYPHEN)) return { error: 'Unexpected characters found in postal address' }
        // }
        // if (!occupationIsBlank) {
        //     if (!occupation.toString().match(CSVDOT_HYPHEN)) return { error: 'Unexpected characters found in occupation field' }
        // }
        // if (!employerIsBlank) {
        //     if (!employer.toString().match(ALPHA)) return { error: 'Employer must only contain English alphabets and whitespaces' }
        // }
        // if (!workAddrIsBlank) {
        //     if (!work_address.toString()
        //         .match(CSVDOT_HYPHEN)) return { error: 'Unexpected characters found in work address' }
        // }
        next()
    }
    const parentUpdateValidator = (data, next) => {
        const {
            parent_id, firstname, othername, lastname, gender, relationship,
            phone, residential_address, postal_address, occupation, employer, work_address
        } = data
        if (!parent_id.match(MONGOOBJECT)) return { error: 'Bad request' }
        if (!firstname.match(ALPHA) ||
            !lastname.match(ALPHA)
        ) return { error: 'Names must only contain English alphabets and whitespaces' }
        if (cleanExcessWhiteSpaces(firstname).length < 3 || cleanExcessWhiteSpaces(firstname).length > 50 ||
            cleanExcessWhiteSpaces(lastname).length < 3 || cleanExcessWhiteSpaces(lastname).length > 50
        ) return { error: 'Firstname and lastname must be in the range of 3 to 50 chars' }
        let pRelationship = relationship.toLowerCase(), pGender = gender.toLowerCase()
        if (!genderArray.includes(pGender)) return { error: 'Selected gender was rejected' }
        if (!relationshipArray.includes(pRelationship)) return { error: 'Relationship type rejected' }
        pRelationship = relationship.trim().length === 0 ? 'guardian' : relationship.toLowerCase()
        if (pRelationship !== 'guardian') {
            if ((pRelationship === relationshipArray[0] || pGender !== genderArray[0]) ||
                (pRelationship === relationshipArray[1] && pGender !== genderArray[1])
            ) return { error: 'Gender and relationship mismatched' }
        }
        if (!phone.match(NUMERICAL) ||
            cleanExcessWhiteSpaces(phone).length !== 10 ||
            parseInt(cleanExcessWhiteSpaces(phone).charAt(0)) !== 0
        ) return { error: 'Phone number must be a numerical string of 10 chars, starting with 0' }
        if (!residential_address.match(CSVDOT_HYPHEN)) return { error: 'Unexpected characters found in residential address' }
        if (residential_address.length < 3) return { error: 'Residential address is blank' }
        const postalAddrIsBlank = cleanExcessWhiteSpaces(postal_address).length === 0
        const occupationIsBlank = cleanExcessWhiteSpaces(occupation).length === 0
        const employerIsBlank = cleanExcessWhiteSpaces(employer).length === 0
        const workAddrIsBlank = cleanExcessWhiteSpaces(work_address).length === 0
        const othernameIsBlank = cleanExcessWhiteSpaces(othername).length === 0
        if (!othernameIsBlank) {
            if (!othername.toString()
                .match(ALPHA)) return { error: 'Othernames must contain only English alphabets and whitespaces' }
        }
        if (!postalAddrIsBlank) {
            if (!postal_address.toString()
                .match(CSVDOT_HYPHEN)) return { error: 'Unexpected characters found in postal address' }
        }
        if (!occupationIsBlank) {
            if (!occupation.toString().match(CSVDOT_HYPHEN)) return { error: 'Unexpected characters found in occupation' }
        }
        if (!employerIsBlank) {
            if (!employer.toString().match(ALPHA)) return { error: 'Employer must only contain English alphabets and whitespaces' }
        }
        if (!workAddrIsBlank) {
            if (!work_address.toString()
                .match(CSVDOT_HYPHEN)) return { error: 'Unexpected characters found in work address' }
        }
        next()
    }
    const studentAccessValidator = (data, next) => {
        const { student_id, username, password, password_confirmation } = data
        if (!student_id.toString().match(MONGOOBJECT)) return { error: 'Bad request' }
        if (!username.match(ALPHANUMERIC)) return { error: 'Username must contain only alphanumeric entities' }
        if (username.trim().length < 3 || username.trim().length > 30) return { error: 'Username must be in the range of 3 and 30 chars' }
        if (!password.match(PASSWORD) || password.length < 8) return { error: 'Password must be a combination of at least 8 alphanumeric and special characters' }
        if (password !== password_confirmation) return { error: 'Passwords do not match' }
        next()
    }
    return {
        studentAccessValidator, parentCreatorValidator, parentUpdateValidator
    }
}