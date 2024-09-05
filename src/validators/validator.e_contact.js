import StringManipulators from "../utils/algos/StringManipulators.js"
import { ArrayData, Regex } from "../utils/static/index.js"

export default function EmergencyContactValidators() {
    const { MONGOOBJECT, ALPHA, CSVDOT_HYPHEN, NUMERICAL, PASSWORD, ALPHANUMERIC } = Regex
    const { relationshipArray } = ArrayData
    const { cleanExcessWhiteSpaces } = StringManipulators()
    const contactCreatorValidator = (data, next) => {
        const { student_id, contact_id, firstname, othername, lastname, relationship,
            phone, residential_address, postal_address, occupation, employer, work_address
        } = data
        if (!student_id.toString().match(MONGOOBJECT)) return { error: 'Bad request' }
        const contactIdIsBlank = cleanExcessWhiteSpaces(contact_id).length === 0
        const firstnameIsBlank = cleanExcessWhiteSpaces(firstname).length === 0
        const othernameIsBlank = cleanExcessWhiteSpaces(othername).length === 0
        const lastnameIsBlank = cleanExcessWhiteSpaces(lastname).length === 0
        const relationshipIsBlank = cleanExcessWhiteSpaces(relationship).length === 0
        const phoneIsBlank = cleanExcessWhiteSpaces(phone).length === 0
        const residenceIsBlank = cleanExcessWhiteSpaces(residential_address).length === 0
        const postalAddrIsBlank = cleanExcessWhiteSpaces(postal_address).length === 0
        const occupationIsBlank = cleanExcessWhiteSpaces(occupation).length === 0
        const employerIsBlank = cleanExcessWhiteSpaces(employer).length === 0
        const workAddrIsBlank = cleanExcessWhiteSpaces(work_address).length === 0
        // if (!contactIdIsBlank) {
        //     if (!contact_id.match(MONGOOBJECT)) return { error: 'Bad request' }
        // }
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
        const pRelationship = relationship.toLowerCase()
        if (!relationshipIsBlank) {
            if (!pRelationship.match(ALPHA)) return { error: 'Relationship must contain only English alphabets and whitespaces' }
            if (pRelationship.length < 3 ||
                pRelationship.length > 20
            ) return { error: 'Relationship must be in the range of 3 to 20 chars' }
        }
        if (!phoneIsBlank) {
            if (!phone.match(NUMERICAL) ||
                cleanExcessWhiteSpaces(phone).length !== 10 ||
                parseInt(cleanExcessWhiteSpaces(phone).charAt(0)) !== 0
            ) return { error: 'Telephone must be a numerical string of 10 chars, starting with 0' }
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
        //     if (!occupation.toString().match(ALPHA)) return { error: 'Occupation must only contain English alphabets and whitespaces' }
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
    const contactUpdateValidator = (data, next) => {
        const {
            contact_id, firstname, othername, lastname, relationship,
            phone, residential_address, postal_address, occupation, employer, work_address
        } = data
        if (!contact_id.match(MONGOOBJECT)) return { error: 'Bad request' }
        if (!firstname.match(ALPHA) ||
            !lastname.match(ALPHA)
        ) return { error: 'Names must only contain English alphabets and whitespaces' }
        if (cleanExcessWhiteSpaces(firstname).length < 3 || cleanExcessWhiteSpaces(firstname).length > 50 ||
            cleanExcessWhiteSpaces(lastname).length < 3 || cleanExcessWhiteSpaces(lastname).length > 50
        ) return { error: 'Firstname and lastname must be in the range of 3 to 50 chars' }
        let pRelationship = relationship.toLowerCase()
        if (!pRelationship.match(ALPHA)) return { error: 'Relationship must contain only English alphabets and whitespaces' }
        if (pRelationship.length < 3 ||
            pRelationship.length > 20
        ) return { error: 'Relationship must be in the range of 3 to 20 chars' }
        if (!phone.match(NUMERICAL) ||
            cleanExcessWhiteSpaces(phone).length !== 10 ||
            parseInt(cleanExcessWhiteSpaces(phone).charAt(0)) !== 0
        ) return { error: 'Telephone must be a numerical string of 10 chars, starting with 0' }
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
            if (!occupation.toString().match(ALPHA)) return { error: 'Occupation must only contain English alphabets and whitespaces' }
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
    return {
        contactCreatorValidator, contactUpdateValidator
    }
}