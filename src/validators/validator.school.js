import { Numerical_Entity, Regex } from "../utils/static/index.js"
import moment from "moment"

export default function SchoolValidators() {
    const { ALPHA, EMAIL, NUMERICAL, CSVDOT_HYPHEN, MONGOOBJECT, ISBASE64, ISACADEMICYEAR } = Regex
    const { TWOINARRAY } = Numerical_Entity
    const configurationValidator = (data, next) => {
        const { id, school_name, country, owner, email, motto, address, logo } = data
        if (!id.toString().match(MONGOOBJECT)) return { error: 'Bad request received' }
        // if (!owner.match(ALPHA)) return { error: 'Only English alphabets and whitespaces allowed for owner' }
        if (!email.match(EMAIL)) return { error: 'Incorect email address' }
        // if (!motto.match(CSVDOT_HYPHEN) || !address.match(CSVDOT_HYPHEN)) return { error: 'Unexpected characters found in either motto or address' }
        // if (!school_name.match(CSVDOT_HYPHEN)) return { error: 'Unexpected characters found name of school' }
        if (!country.match(ALPHA)) return { error: 'Only English alphabets and whitespaces allowed for country' }
        const logo_parts = logo.split(',', 2)
        const logo_ext = logo_parts[0]
        const logo_data = logo_parts[1]
        if (logo_data !== undefined) {
            if (!logo_data.match(ISBASE64)) return { error: 'No logo files found' }
            if (logo_ext !== "data:image/png;base64" && logo_ext !== "data:image/jpeg;base64" && logo_ext !== "data:image/jpg;base64") return { error: 'Logo type is unaccepted. Choose jpeg, jpg, png files only.' }
        }
        return next()
    }
    const logoUpdateValidator = (data, next) => {
        const { id, logo } = data
        if (!id.toString().match(MONGOOBJECT)) return { error: 'Bad request received' }
        if (logo.length === 0) return { error: 'No logo files found' }
        const logo_parts = logo.split(',', 2)
        const logo_ext = logo_parts[0]
        const logo_data = logo_parts[1]
        if (logo_data === undefined) return { error: 'No logo files found' }
        if (!logo_data.match(ISBASE64)) return { error: 'No logo files found' }
        if (logo_ext !== "data:image/png;base64" && logo_ext !== "data:image/jpeg;base64" && logo_ext !== "data:image/jpg;base64") return { error: 'Logo type is unaccepted. Choose jpeg, jpg, png files only.' }
        return next()
    }
    const schoolInfoUpdateValidator = (data, next) => {
        const { id, owner, email, motto, address, name, country } = data
        if (!id.toString().match(MONGOOBJECT)) return { error: 'Bad request received' }
        // if (!owner.match(ALPHA)) return { error: 'Only English alphabets and whitespaces allowed for owner' }
        if (!email.match(EMAIL)) return { error: 'Incorect email address' }
        // if (!motto.match(CSVDOT_HYPHEN) || !address.match(CSVDOT_HYPHEN)) return { error: 'Unexpected characters found in either motto or address' }
        // if (!name.match(CSVDOT_HYPHEN)) return { error: 'Unexpected characters found name of school' }
        if (!country.match(ALPHA)) return { error: 'Only English alphabets and whitespaces allowed for country' }
        return next()
    }
    const classesValidator = (data, next) => {
        const { classes, school_id } = data
        if (!school_id.toString().match(MONGOOBJECT)) return { error: 'Bad request received' }
        let correctKeys = true
        classes.map(item => {
            if (!Object.keys(item).includes('class_name') ||
                !Object.keys(item).includes('class_shortname')
            ) correctKeys = false
            if (
                !item['class_name'].toString().match(CSVDOT_HYPHEN) ||
                !item['class_shortname'].toString().match(CSVDOT_HYPHEN)
            ) correctKeys = false
        })
        if (!correctKeys) return { error: 'Class data is incorrect' }
        return next()
    }
    const classUpdateValidator = (data, next) => {
        const { school_id, class_id, class_name, class_shortname } = data
        if (!school_id.toString().match(MONGOOBJECT) ||
            !class_id.toString().match(MONGOOBJECT)
        ) return { error: 'Bad request received' }
        // if (
        //     !class_name.toString().match(CSVDOT_HYPHEN) ||
        //     !class_shortname.toString().match(CSVDOT_HYPHEN)
        // ) return { error: 'Class data is incorrect' }
        return next()
    }
    const validateTermRegistration = (data, next) => {
        const { year_id, term_name, start_date, end_date } = data
        if (!year_id.toString().match(MONGOOBJECT)) return { error: 'Bad request received' }
        // if (!term_name.match(CSVDOT_HYPHEN)) return { error: 'Unexpected characters found in name of term' }
        // if (term_name.length < 3 || term_name.length > 30) return { error: 'Name of term must be in the range of 3 to 30 chars' }
        const checkStartDate = moment(start_date, true).isValid()
        const checkEndDate = moment(end_date, true).isValid()
        if (!checkStartDate || !checkEndDate) return { error: 'Start date or end date of term is invalid' }
        // if (moment(end_date).diff((moment(new Date()).toISOString()), 'days') <= 0) return { error: "Cannot set term's end date to today or a past date" }
        // if (moment(start_date).diff((moment(new Date()).toISOString()), 'days') < 0) return { error: "Term's start date cannot be in the past" }
        if (moment(end_date).diff(moment(start_date), 'days') <= 0) return { error: 'Start date cannot be same or days more than the end date' }
        // if (moment(end_date).diff(moment(start_date), 'months') < 2) return { error: 'Provide a reasonable time frame for the term' }
        return next()
    }
    const validateTermUpdate = (data, next) => {
        const { year_id, term_name, start_date, end_date, status, term_id } = data
        if (!year_id.toString().match(MONGOOBJECT)) return { error: 'Bad request received' }
        if (!term_id.match(MONGOOBJECT)) return { message: 'Bad request received' }
        if (![true, false].includes(status)) return { error: 'Selected status of term was rejected' }
        // if (!term_name.match(CSVDOT_HYPHEN)) return { error: 'Unexpected characters found in name of term' }
        // if (term_name.length < 3 || term_name.length > 30) return { error: 'Name of term must be in the range of 3 to 30 chars' }
        const checkStartDate = moment(start_date, true).isValid()
        const checkEndDate = moment(end_date, true).isValid()
        if (!checkStartDate || !checkEndDate) return { error: 'Start date or end date of term is invalid' }
        if (Number(status) === 2) {
            if (moment(end_date).diff((moment(new Date()).toISOString()), 'days') <= 0) return { error: "You're activating term hence, you cannot set term's end date to today or a past date" }
            if (moment(start_date).diff((moment(new Date()).toISOString()), 'days') < 0) return { error: "You're activating term hence, term's start date cannot be in the past" }
        }
        if (moment(end_date).diff(moment(start_date), 'days') <= 0) return { error: 'Start date cannot be same or days more than the end date' }
        // if (moment(end_date).diff(moment(start_date), 'months') < 2) return { error: 'Provide a reasonable time frame for the term' }
        next()
    }
    const academicYearRegistrationValidation = (data, next) => {
        const { school_id, acad_year } = data
        if (!school_id.toString().match(MONGOOBJECT)) return { error: 'Bad request received' }
        if (!acad_year.toString().match(ISACADEMICYEAR)) return { error: 'Acceptable academic year format is yyyy-yyyy' }
        const yearParts = acad_year.split('-', 2)
        if (yearParts.length !== 2) return { error: 'Acceptable academic year format is yyyy-yyyy' }
        const prevYear = yearParts[0], nextyear = yearParts[1], currentYear = (new Date()).getFullYear()
        // if (prevYear < currentYear || nextyear < currentYear) return { error: 'Academic year cannot be in the past' }
        if (Number(prevYear) === Number(nextyear) ||
            Number(prevYear) > Number(nextyear)
        ) return { error: 'We expect that the value at the left side of the hyphen be less than the right side' }
        if (Number(nextyear) - Number(prevYear) !== 1) return { error: 'Incorrect academic year' }
        return next()
    }
    const subjectRegistryValidator = (data, next) => {
        const { school_id, subject_name, subject_code, class_id } = data
        if (!school_id.toString().match(MONGOOBJECT) ||
            !class_id.toString().match(MONGOOBJECT)
        ) return { error: 'Bad request received' }
        if (!subject_name.match(CSVDOT_HYPHEN) ||
            !subject_code.match(CSVDOT_HYPHEN)
        ) return { error: 'Unexpected characters found in name of subject or code' }
        if (subject_name.length < 3 ||
            subject_name.length > 100)
            return { error: 'Name of subject must be in the range of 3 to 100 chars' }
        if (subject_code.length < 3 ||
            subject_code.length > 8
        ) return { error: 'Subject code must be in the range of 3 to 8 chars' }
        return next()
    }
    return {
        configurationValidator, logoUpdateValidator, schoolInfoUpdateValidator, classesValidator,
        classUpdateValidator, validateTermRegistration, academicYearRegistrationValidation,
        validateTermUpdate, subjectRegistryValidator
    }
}