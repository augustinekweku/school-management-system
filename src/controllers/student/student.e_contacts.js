import { ObjectId } from "bson"
import DatabaseConnection from "../../config/config.db.js"
import Eligibility_Extractor from "../../helpers/helper.account_sch_relation.js"
import ContactQuery from "../../queries/query.e_contacts.js"
import StringManipulators from "../../utils/algos/StringManipulators.js"
import { ArrayData, Regex } from "../../utils/static/index.js"
import EmergencyContactValidators from "../../validators/validator.e_contact.js"
import url from "url"
import ParentQuery from "../../queries/query.parent.js"
import Pagination from "../../helpers/helper.pagination_setter.js"
import PaginationParams from "../../helpers/helper.paginator.js"
import RequestBodyChecker from "../../helpers/helper.request_checker.js"

export default function EmergencyContactsConfigurations() {
    const { contactCreatorValidator, contactUpdateValidator } = EmergencyContactValidators()
    const { cleanSCW, cleanExcessWhiteSpaces } = StringManipulators()
    const { extract } = Eligibility_Extractor()
    const { localPaginator } = PaginationParams()
    const { isTrueBodyStructure } = RequestBodyChecker()
    const { GETALLCONTACTS, CREATE_RELATIONSHIP, CHECKCONTACT, GETCONTACTS, GETSTUDENTSONCONTACT, SAVECONTACT, GETCONTACT, UPDATECONTACT, UPDATERELATIONSHIP, FETCHCONTACT, FETCHCONTACTS_OF_STUDENT, REMOVECONTACT, DETACHSTUDENTONCONTACT } = ContactQuery()
    const { GETSTUDENT } = ParentQuery()
    const { pool } = DatabaseConnection()
    const { relationshipArray } = ArrayData
    const { MONGOOBJECT } = Regex
    const WSWW = 'Whoops! Something went wrong'

    const searchRelatedContactPersons = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('school_id') || !params.get('q')) return res.status(200).json({ message: '', code: '200', data: {} })
        const school_id = params.get('school_id')
        const q = cleanSCW(params.get('q')).toLowerCase()
        if (!school_id.match(MONGOOBJECT)) return res.status(200).json({ message: '', code: '200', data: {} })
        try {
            const results = await pool.query(GETALLCONTACTS, [school_id])
            const list = results.rows.map(({ row_id, ...rest }) => rest).
                filter(e => JSON.stringify(e).toLowerCase().includes(q))
            const { pageSize, page } = Pagination().Setter(params, 1, 10)
            const { total_pages, search_results, total_items } = localPaginator(list, pageSize, page)
            return res.status(200).json({
                message: '', code: '200', data: {
                    contact_lists: [...search_results],
                    page_data: {
                        totalCount: total_items,
                        totalPages: total_pages,
                        currentPage: page,
                        pageSize: pageSize
                    }
                }
            })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }
    const ContactPersonStudentRelationship = async (contact_id, student_id, relationship) => {
        try {
            const relate = await pool.query(CREATE_RELATIONSHIP, [contact_id, student_id, relationship])
            return relate
        } finally {
            console.log(true);
        }
    }
    const ContactPersonInstance = async (
        id, school_id, firstname, othername, lastname,
        phone, residential_address, postal_address,
        occupation, employer, work_address, timestamp
    ) => {
        try {
            const create = await pool.query(SAVECONTACT, [
                id, school_id, firstname, othername, lastname,
                phone, residential_address, postal_address,
                occupation, employer, work_address, timestamp
            ])
            return create
        } finally {
            console.log(true);
        }
    }
    const saveContact = async (
        res, school_id, student_id, firstname, othername, lastname, relationship,
        phone, residential_address, postal_address, occupation, employer, work_address
    ) => {
        try {
            const id = (new ObjectId()).toString()
            const timestamp = (new Date()).toISOString()
            await ContactPersonInstance(
                id, school_id, firstname, othername, lastname,
                phone, residential_address, postal_address,
                occupation, employer, work_address, timestamp
            )
            const contactInfo = await ContactPersonStudentRelationship(id, student_id, relationship)
            return res.status(201).json({ message: 'Emergency contact information created successfully.', code: '201', data: { ...contactInfo.rows[0], relationship_with_student: relationship, row_id: undefined } })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }
    const createContacts = (req, res) => {
        let { student_id, contact_id, firstname, othername, lastname, relationship,
            phone, residential_address, postal_address, occupation, employer, work_address
        } = req.body
        const expected_payload = [
            'student_id', 'contact_id', 'firstname', 'othername', 'lastname', 'relationship',
            'phone', 'residential_address', 'postal_address', 'occupation', 'employer', 'work_address'
        ]
        const checkPayload = isTrueBodyStructure(req.body, expected_payload)
        if (!checkPayload) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const validate = contactCreatorValidator(req.body, async () => {
            try {
                const student = await pool.query(GETSTUDENT, [student_id])
                if (student.rowCount !== 1) return res.status(412).json({ message: 'No student records found', code: '412', data: {} })
                const sData = student.rows[0]
                return extract(sData.school_id, req, res, async () => {
                    try {
                        const contactIdIsBlank = cleanExcessWhiteSpaces(contact_id).length === 0
                        if (!contactIdIsBlank) {
                            if (!contact_id.match(MONGOOBJECT)) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
                            const contact = await pool.query(CHECKCONTACT, [contact_id, student_id])
                            const existingContactData = contact.rows[0]
                            if (existingContactData.contact_id === null) return res.status(412).json({ message: 'Selected contact person could not be found', code: '412', data: {} })
                            const cInfo = { data_exists: existingContactData.student_contact_exists, contact_id: existingContactData.contact_id, school_id: existingContactData.school_id, relationship: existingContactData.relationship }
                            if (Number(cInfo.data_exists) === 1) return res.status(412).json({ message: `The selected contact person has already been assigned to the student`, code: '412', data: {} })
                            if (cInfo.school_id !== sData.school_id) return res.status(412).json({ message: 'Contact person does not exists in this school', code: '412', data: {} })
                            const cds = await ContactPersonStudentRelationship(contact_id, student_id, cInfo.relationship)
                            const contactInfo = { ...cds.rows[0], row_id: undefined }
                            return res.status(201).json({ message: 'Emergency contact information created successfully.', code: '201', data: { ...contactInfo, relationship_with_student: cInfo.relationship } })
                        }
                        // firstname = cleanSCW(firstname)
                        // othername = cleanSCW(othername)
                        // lastname = cleanSCW(lastname)
                        relationship = relationship.toLowerCase()
                        phone = cleanExcessWhiteSpaces(phone)
                        // residential_address = cleanExcessWhiteSpaces(residential_address)
                        // postal_address = cleanExcessWhiteSpaces(postal_address)
                        // occupation = cleanSCW(occupation)
                        // employer = cleanSCW(employer)
                        // work_address = cleanExcessWhiteSpaces(work_address)
                        let blankFound = false
                        const obj = { firstname, lastname, relationship, phone, residential_address }
                        Object.keys(obj).map(item => {
                            if (obj[item].length === 0) blankFound = true
                        })
                        if (blankFound) return res.status(412).json({ message: 'Essential fields are required', code: '412', data: {} })
                        if (relationshipArray.includes(relationship)) return res.status(412).json({ message: `Do not use ${relationship} as an emergency contact. You might have already saved a similar data as parent`, code: '412', data: {} })
                        const contacts = await pool.query(GETCONTACTS, [student_id])
                        if (contacts.rowCount === 0) return saveContact(
                            res, sData.school_id, student_id, firstname, othername, lastname, relationship,
                            phone, residential_address, postal_address, occupation, employer, work_address
                        )
                        const cData = contacts.rows
                        if (cData.length === 3) return res.status(412).json({ message: 'Cannot create additional contact persons for the student', code: '412', data: {} })
                        return saveContact(
                            res, sData.school_id, student_id, firstname, othername, lastname, relationship,
                            phone, residential_address, postal_address, occupation, employer, work_address
                        )
                    } catch (error) {
                        return res.status(500).json({ message: WSWW, code: '500', data: {} })
                    }
                })
            } catch (error) {
                return res.status(500).json({ message: WSWW, code: '500', data: {} })
            }
        })
        if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
        return validate
    }
    const ContactUpdateSystem = async (
        contact_id, firstname, othername, lastname, relationship, phone,
        residential_address, postal_address, occupation, employer, work_address
    ) => {
        const timestamp = (new Date()).toISOString()
        try {
            const update = await pool.query(UPDATECONTACT, [
                firstname, othername, lastname, phone, residential_address,
                postal_address, occupation, employer, work_address, timestamp, contact_id
            ])
            return timestamp
        } finally {
            console.log(true)
        }
    }
    const ContactPersonStudentRelationshipUpdator = async (contact_id, relationship) => {
        try {
            const update = await pool.query(UPDATERELATIONSHIP, [relationship, contact_id])
            return update
        } finally {
            console.log(true)
        }
    }
    const updateContact = (req, res) => {
        let { contact_id, firstname, othername, lastname, relationship,
            phone, residential_address, postal_address, occupation, employer, work_address
        } = req.body
        const expected_payload = [
            'contact_id', 'firstname', 'othername', 'lastname', 'relationship',
            'phone', 'residential_address', 'postal_address', 'occupation', 'employer', 'work_address'
        ]
        const checkPayload = isTrueBodyStructure(req.body, expected_payload)
        if (!checkPayload) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const validate = contactUpdateValidator(req.body, async () => {
            try {
                const contact = await pool.query(GETCONTACT, [contact_id])
                if (contact.rowCount === 0) return res.status(412).json({ message: 'Contact person could not be found', code: '412', data: {} })
                const data = contact.rows[0]
                return extract(data.school_id, req, res, async () => {
                    try {
                        // firstname = cleanSCW(firstname)
                        // othername = cleanSCW(othername)
                        // lastname = cleanSCW(lastname)
                        relationship = relationship.toLowerCase()
                        phone = cleanExcessWhiteSpaces(phone)
                        // residential_address = cleanExcessWhiteSpaces(residential_address)
                        // postal_address = cleanExcessWhiteSpaces(postal_address)
                        // occupation = cleanSCW(occupation)
                        // employer = cleanSCW(employer)
                        // work_address = cleanExcessWhiteSpaces(work_address)
                        if (relationshipArray.includes(relationship)) return res.status(412).json({ message: `Do not use ${relationship} as an emergency contact. You might have already saved a similar data as parent`, code: '412', data: {} })
                        const timestamp = await ContactUpdateSystem(
                            contact_id, firstname, othername, lastname, relationship, phone,
                            residential_address, postal_address, occupation, employer, work_address
                        )
                        await ContactPersonStudentRelationshipUpdator(contact_id, relationship)
                        return res.status(200).json({
                            message: 'Emergency contact details updated successfully', code: '200', data: {
                                ...data, firstname, othername, lastname, phone, residential_address,
                                postal_address, occupation, employer, work_address, updated_at: timestamp,
                                relationship_with_student: relationship, row_id: undefined
                            }
                        })
                    } catch (error) {
                        return res.status(500).json({ message: WSWW, code: '500', data: {} })
                    }
                })
            } catch (error) {
                return res.status(500).json({ message: WSWW, code: '500', data: {} })
            }
        })
        if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
        return validate
    }
    const processData = (data) => {
        const contactData = data.map(({
            student_id, s_firstname, s_othername, dob, spoken_languages,
            telephone, nationality, address, index_no, last_school_attended,
            is_new, photo_url, gender, s_lastname, ...rest
        }) => rest)
        const studentsData = data.map(({
            id, firstname, othername, gender, phone, residential_address, postal_address, relationship_with_students,
            occupation, employer, work_address, created_at, updated_at, lastname, ...rest
        }) => rest).map(({ student_id, s_firstname, s_othername, s_lastname, ...rest }) => ({
            ...rest, id: student_id, firstname: s_firstname, othername: s_othername,
            lastname: s_lastname
        }))
        return { contactData, studentsData }
    }
    const getContactPerson = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('contact_id')) return res.status(200).json({ message: 'No contact person data found', code: '200', data: {} })
        const contact_id = params.get('contact_id')
        if (!contact_id.match(MONGOOBJECT)) return res.status(200).json({ message: 'No contact person data found', code: '200', data: {} })
        try {
            const results = await pool.query(FETCHCONTACT, [contact_id])
            if (results.rowCount === 0) return res.status(200).json({ message: 'Emergency contact data could not be found', code: '200', data: {} })
            const data = results.rows
            const { contactData, studentsData } = processData(data)
            return res.status(200).json({ message: '', code: '200', data: { ...contactData[0], students: [...studentsData] } })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }
    const getContactPersonsOfStudent = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('student_id')) return res.status(200).json({ message: 'No parent data found', code: '200', data: {} })
        const student_id = params.get('student_id')
        if (!student_id.match(MONGOOBJECT)) return res.status(200).json({ message: 'No parent data found', code: '200', data: {} })
        try {
            const results = await pool.query(FETCHCONTACTS_OF_STUDENT, [student_id])
            if (results.rowCount === 0) return res.status(200).json({ message: 'Parent data could not be found', code: '200', data: {} })
            const data = results.rows
            const { contactData, studentsData } = processData(data)
            return res.status(200).json({ message: '', code: '200', data: { ...studentsData[0], emergency_contacts: [...contactData], relationship_with_student: undefined } })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }
    const DeleteContact = async (res, student_id, contact_id, action) => {
        try {
            const remove = action === 'DELETE__CONTACT' ?
                await pool.query(REMOVECONTACT, [contact_id]) :
                action === 'DETACH__STUDENT' ? await pool.query(DETACHSTUDENTONCONTACT, [student_id, contact_id]) :
                    null
            if (!remove) return res.status(412).json({ message: 'Action could not be executed', code: '412', data: {} })
            return res.status(200).json({ message: `Student's emergency contact person removed successfully`, code: '200', data: {} })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }
    const deleteContactPerson = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('contact_id') || !params.get('student_id')) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const contact_id = params.get('contact_id')
        const student_id = params.get('student_id')
        if (!contact_id.match(MONGOOBJECT) || !student_id.match(MONGOOBJECT)) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        try {
            const contactPerson = await pool.query(GETCONTACT, [contact_id])
            if (contactPerson.rowCount === 0) return res.status(412).json({ message: 'Contact person could not be found', code: '412', data: {} })
            const data = contactPerson.rows[0]
            return extract(data.school_id, req, res, async () => {
                try {
                    const studentsOnContact = await pool.query(GETSTUDENTSONCONTACT, [contact_id])
                    if (studentsOnContact.rowCount === 0) return DeleteContact(res, student_id, contact_id, 'DELETE__CONTACT')
                    const list = studentsOnContact.rows
                    const checkStudentInList = list.some(item => item.student_id === student_id)
                    if (!checkStudentInList) return res.status(412).json({ message: 'The student is not assigned to the contact person', code: '412', data: {} })
                    if (list.length === 1) return DeleteContact(res, student_id, contact_id, 'DELETE__CONTACT')
                    return DeleteContact(res, student_id, contact_id, 'DETACH__STUDENT')
                } catch (error) {
                    return res.status(500).json({ message: WSWW, code: '500', data: {} })
                }
            })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }
    return {
        createContacts, searchRelatedContactPersons, updateContact, getContactPerson, getContactPersonsOfStudent, deleteContactPerson
    }
}