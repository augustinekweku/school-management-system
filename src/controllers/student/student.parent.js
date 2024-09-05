import { ObjectId } from "bson"
import DatabaseConnection from "../../config/config.db.js"
import Eligibility_Extractor from "../../helpers/helper.account_sch_relation.js"
import ParentQuery from "../../queries/query.parent.js"
import StringManipulators from "../../utils/algos/StringManipulators.js"
import ParentValidator from "../../validators/validator.parent.js"
import { ArrayData, Regex } from "../../utils/static/index.js"
import url from "url"
import format from "pg-format"
import Pagination from "../../helpers/helper.pagination_setter.js"
import PaginationParams from "../../helpers/helper.paginator.js"
import RequestBodyChecker from "../../helpers/helper.request_checker.js"

export default function ConfigureParents() {
    const { parentCreatorValidator, parentUpdateValidator } = ParentValidator()
    const { extract } = Eligibility_Extractor()
    const { isTrueBodyStructure } = RequestBodyChecker()
    const { localPaginator } = PaginationParams()
    const { cleanSCW, cleanExcessWhiteSpaces } = StringManipulators()
    const { GETSTUDENT, STUDENT_PARENT_REL, GETPARENTS, SAVEPARENT, CREATE_RELATIONS, GETALLPARENTS, CHECKPARENT, GETPARENT, GETSTUDENTBY_PARENT, UPDATE_PARENT, UPDATE_RELATIONSHIP, FETCHPARENT, FETCHPARENTS_OF_STUDENT, REMOVEPARENT, DETACHSTUDENTONPARENT } = ParentQuery()
    const { pool } = DatabaseConnection()
    const { relationshipArray } = ArrayData
    const { MONGOOBJECT } = Regex
    const WSWW = 'Whoops! Something went wrong'

    const searchRelatedParents = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('school_id') || !params.get('q')) return res.status(200).json({
            message: '', code: '200', data: {
                parent_lists: []
            }
        })
        const school_id = params.get('school_id')
        const q = params.get('q').toLowerCase()
        if (!school_id.match(MONGOOBJECT)) return res.status(200).json({ message: '', code: '200', data: {} })
        try {
            const results = await pool.query(GETALLPARENTS, [school_id])
            if (results.rowCount === 0) return res.status(200).json({ message: '', code: '200', data: {} })
            const list = results.rows.map(({ row_id, ...rest }) => rest).
                filter(e => JSON.stringify(e).toLowerCase().includes(q))
            const { pageSize, page } = Pagination().Setter(params, 1, 10)
            const { total_pages, search_results, total_items } = localPaginator(list, pageSize, page)
            return res.status(200).json({
                message: '', code: '200', data: {
                    parent_lists: [...search_results],
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

    const ParentInstance = async (
        parent_id, school_id, firstname, othername, lastname, gender, phone,
        residential_address, postal_address, occupation, employer, work_address, timestamp
    ) => {
        try {
            const save = await pool.query(SAVEPARENT, [
                parent_id, school_id, firstname, othername, lastname, gender, phone,
                residential_address, postal_address, occupation, employer, work_address, timestamp
            ])
            return save
        } finally {
            console.log('saved')
        }
    }
    const ParentStudentRelationship = async (parent_id, student_id, relationship) => {
        try {
            const makeRelations = await pool.query(CREATE_RELATIONS, [parent_id, student_id, relationship])
            return makeRelations
        } finally {
            console.log('relationship created')
        }
    }
    const GetParentRelationsOnStudent = async (student_id) => {
        try {
            const result = await pool.query(STUDENT_PARENT_REL, [student_id])
            return result
        } finally {
            console.log(true)
        }
    }
    const saveParent = async (
        res, school_id, index_no, student_id, firstname, othername, lastname, gender, relationship,
        phone, residential_address, postal_address, occupation, employer, work_address
    ) => {
        const id = (new ObjectId()).toString()
        const timestamp = (new Date()).toISOString()
        try {
            await ParentInstance(
                id, school_id, firstname, othername, lastname, gender,
                phone, residential_address, postal_address,
                occupation, employer, work_address, timestamp
            )
            const parentData = {
                id, student_id, firstname, othername,
                lastname, gender, relationship, phone, residential_address, postal_address, occupation,
                employer, work_address, created_at: timestamp, updated_at: timestamp
            }
            await ParentStudentRelationship(id, student_id, relationship)
            return res.status(201).json({ message: 'Parent information created successfully', code: '201', data: { ...parentData } })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }
    const createParent = (req, res) => {
        let { student_id, parent_id, firstname, othername, lastname, gender, relationship,
            phone, residential_address, postal_address, occupation, employer, work_address
        } = req.body
        const expected_payload = ['student_id', 'parent_id', 'firstname', 'othername', 'lastname', 'gender', 'relationship',
            'phone', 'residential_address', 'postal_address', 'occupation', 'employer', 'work_address']
        const checkPayload = isTrueBodyStructure(req.body, expected_payload)
        if (!checkPayload) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const validate = parentCreatorValidator(req.body, async () => {
            try {
                const student = await pool.query(GETSTUDENT, [student_id])
                if (student.rowCount !== 1) return res.status(412).json({ message: 'No student records found', code: '412', data: {} })
                const sData = student.rows[0]
                return extract(sData.school_id, req, res, async () => {
                    try {
                        const parentIdIsBlank = cleanExcessWhiteSpaces(parent_id).length === 0
                        if (!parentIdIsBlank) {
                            if (!parent_id.match(MONGOOBJECT)) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
                            const parent = await pool.query(CHECKPARENT, [parent_id, student_id])
                            const existingParentData = parent.rows[0]
                            if (existingParentData.parent_id === null) return res.status(412).json({ message: 'Selected parent could not be found', code: '412', data: {} })
                            const pInfo = { data_exists: existingParentData.student_parent_exists, parent_id: existingParentData.parent_id, school_id: existingParentData.school_id, relationship: existingParentData.relationship }
                            if (Number(pInfo.data_exists) === 1) return res.status(412).json({ message: `The student already has the selected parent as ${pInfo.relationship}`, code: '412', data: {} })
                            if (pInfo.school_id !== sData.school_id) return res.status(412).json({ message: 'Parent does not exists in this school', code: '412', data: {} })
                            const getRelationship = await GetParentRelationsOnStudent(student_id)
                            const studentsExistingRelationships = getRelationship.rows
                            const hasParentTypeAlready = studentsExistingRelationships.filter(parentType => ['father', 'mother'].includes(parentType.relationship))
                                .some(type => type.relationship === pInfo.relationship)
                            if (hasParentTypeAlready) return res.status(412).json({ message: `Student's ${pInfo.relationship} already created`, code: '412', data: {} })
                            const buildRelationship = await ParentStudentRelationship(parent_id, student_id, pInfo.relationship)
                            const parentInfo = { ...buildRelationship.rows[0], row_id: undefined }
                            return res.status(201).json({ message: 'Parent information created successfully.', code: '201', data: { ...parentInfo } })
                        }
                        // firstname = cleanSCW(firstname)
                        // othername = cleanSCW(othername)
                        // lastname = cleanSCW(lastname)
                        gender = gender.toLowerCase()
                        relationship = relationship.trim().length === 0 ? 'guardian' : relationship.toLowerCase()
                        phone = cleanExcessWhiteSpaces(phone)
                        // residential_address = cleanExcessWhiteSpaces(residential_address)
                        // postal_address = cleanExcessWhiteSpaces(postal_address)
                        // occupation = cleanSCW(occupation)
                        // employer = cleanSCW(employer)
                        // work_address = cleanExcessWhiteSpaces(work_address)
                        let blankFound = false
                        const obj = { firstname, lastname, relationship, phone, residential_address, gender }
                        Object.keys(obj).map(item => {
                            if (obj[item].length === 0) blankFound = true
                        })
                        if (blankFound) return res.status(412).json({ message: 'Essential fields are required', code: '412', data: {} })
                        const getParents = await pool.query(GETPARENTS, [student_id])
                        if (getParents.rowCount === 0) return saveParent(
                            res, sData.school_id, sData.index_no, student_id, firstname, othername, lastname, gender, relationship,
                            phone, residential_address, postal_address, occupation, employer, work_address
                        )
                        const pData = getParents.rows
                        if (pData.length === 3) return res.status(412).json({ message: 'Cannot create additional parent information for the student', code: '412', data: {} })
                        const parentExists = pData.some(e => (e.relationship === relationshipArray[1] && relationship === relationshipArray[1]) || (
                            e.relationship === relationshipArray[0] && relationship === relationshipArray[0]
                        ))
                        if (parentExists) return res.status(412).json({ message: `Student's ${relationship} already created`, code: '412', data: {} })
                        return saveParent(
                            res, sData.school_id, sData.index_no, student_id, firstname, othername, lastname, gender, relationship,
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
    const UpdateParent = async (
        firstname, othername, lastname, gender, phone, residential_address, postal_address,
        occupation, employer, work_address, parent_id
    ) => {
        const timestamp = (new Date()).toISOString()
        try {
            await pool.query(UPDATE_PARENT, [
                firstname, othername, lastname, gender, phone, residential_address, postal_address,
                occupation, employer, work_address, timestamp, parent_id
            ])
            return timestamp
        } finally {
            console.log(true);
        }
    }
    const UpdateRelationship = async (relationship, parent_id) => {
        try {
            const update = await pool.query(UPDATE_RELATIONSHIP, [relationship, parent_id])
            return update
        } finally {
            console.log(true);
        }
    }
    const Update = async (res, firstname, othername, lastname, gender, phone, residential_address, postal_address, occupation, employer, work_address, parent_id, relationship, data) => {
        try {
            const timestamp = await UpdateParent(firstname, othername, lastname, gender, phone, residential_address, postal_address,
                occupation, employer, work_address, parent_id
            )
            await UpdateRelationship(relationship, parent_id)
            return res.status(200).json({
                message: 'Parent data updated successfully', code: '200', data: {
                    id: parent_id, firstname, othername,
                    lastname, gender, relationship, phone, residential_address, postal_address, occupation,
                    employer, work_address, created_at: data.created_at, updated_at: timestamp
                }
            })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }
    const updateParent = async (req, res) => {
        let { parent_id, firstname, othername, lastname, gender, relationship,
            phone, residential_address, postal_address, occupation, employer, work_address
        } = req.body
        const expected_payload = ['parent_id', 'firstname', 'othername', 'lastname', 'gender', 'relationship',
            'phone', 'residential_address', 'postal_address', 'occupation', 'employer', 'work_address']
        const checkPayload = isTrueBodyStructure(req.body, expected_payload)
        if (!checkPayload) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const validate = parentUpdateValidator(req.body, async () => {
            try {
                const parent = await pool.query(GETPARENT, [parent_id])
                if (parent.rowCount === 0) return res.status(412).json({ message: 'Parent could not be found', code: '412', data: {} })
                const data = parent.rows[0]
                return extract(data.school_id, req, res, async () => {
                    try {
                        // firstname = cleanSCW(firstname)
                        // othername = cleanSCW(othername)
                        // lastname = cleanSCW(lastname)
                        gender = gender.toLowerCase()
                        relationship = relationship.trim().length === 0 ? 'guardian' : relationship.toLowerCase()
                        phone = cleanExcessWhiteSpaces(phone)
                        // residential_address = cleanExcessWhiteSpaces(residential_address)
                        // postal_address = cleanExcessWhiteSpaces(postal_address)
                        // occupation = cleanSCW(occupation)
                        // employer = cleanSCW(employer)
                        // work_address = cleanExcessWhiteSpaces(work_address)
                        const students = await pool.query(GETSTUDENTBY_PARENT, [parent_id])
                        if (students.rowCount === 0) return Update(res, firstname, othername, lastname, gender, phone, residential_address, postal_address, occupation, employer, work_address, parent_id, relationship, data)
                        const sData = students.rows
                        const isNotSameRelationship = sData.some(psrItem => (relationshipArray.includes(psrItem.relationship) && psrItem.relationship !== relationship))
                        if (!isNotSameRelationship) return Update(res, firstname, othername, lastname, gender, phone, residential_address, postal_address, occupation, employer, work_address, parent_id, relationship, data)
                        const queryFormat = format('%L', sData.map(item => item.student_id))
                        const stmt = `SELECT parent_id, relationship FROM parent_student_tb WHERE student_id IN (${queryFormat})`
                        const dBSRD = await pool.query(stmt)
                        const dBSRDDataWithoutParent = dBSRD.rows.filter(item => item.parent_id !== parent_id)
                        if (dBSRDDataWithoutParent.length === 0) return Update(res, firstname, othername, lastname, gender, phone, residential_address, postal_address, occupation, employer, work_address, parent_id, relationship, data)
                        if (dBSRDDataWithoutParent.some(e => e.relationship === relationship)) return res.status(412).json({ message: `Students that belong to this parent have already been assigned a ${relationship}`, code: '412', data: {} })
                        return Update(res, firstname, othername, lastname, gender, phone, residential_address, postal_address, occupation, employer, work_address, parent_id, relationship, data)
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
        const parentData = data.map(({
            student_id, s_firstname, s_othername, dob, spoken_languages,
            telephone, nationality, address, index_no, last_school_attended,
            is_new, photo_url, s_gender, s_lastname, ...rest
        }) => rest)
        const studentsData = data.map(({
            id, firstname, othername, gender, phone, residential_address, postal_address, relationship_with_students,
            occupation, employer, work_address, created_at, updated_at, lastname, ...rest
        }) => rest).map(({ student_id, s_firstname, s_othername, s_gender, s_lastname, ...rest }) => ({
            ...rest, id: student_id, firstname: s_firstname, othername: s_othername,
            lastname: s_lastname, gender: s_gender
        }))
        return { parentData, studentsData }
    }
    const getParent = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('parent_id')) return res.status(200).json({ message: 'No parent data found', code: '200', data: {} })
        const parent_id = params.get('parent_id')
        if (!parent_id.match(MONGOOBJECT)) return res.status(200).json({ message: 'No parent data found', code: '200', data: {} })
        try {
            const results = await pool.query(FETCHPARENT, [parent_id])
            if (results.rowCount === 0) return res.status(200).json({ message: 'Parent data could not be found', code: '200', data: {} })
            const data = results.rows
            const { parentData, studentsData } = processData(data)
            return res.status(200).json({ message: '', code: '200', data: { ...parentData[0], children: [...studentsData] } })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }
    const getParentsOfStudent = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('student_id')) return res.status(200).json({ message: 'No parent data found', code: '200', data: {} })
        const student_id = params.get('student_id')
        if (!student_id.match(MONGOOBJECT)) return res.status(200).json({ message: 'No parent data found', code: '200', data: {} })
        try {
            const results = await pool.query(FETCHPARENTS_OF_STUDENT, [student_id])
            if (results.rowCount === 0) return res.status(200).json({ message: 'Parent data could not be found', code: '200', data: {} })
            const data = results.rows
            const { parentData, studentsData } = processData(data)
            return res.status(200).json({ message: '', code: '200', data: { ...studentsData[0], parents: [...parentData] } })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }
    const DeleteParent = async (res, student_id, parent_id, action) => {
        try {
            const remove = action === 'DELETE__PARENT' ?
                await pool.query(REMOVEPARENT, [parent_id]) :
                action === 'DETACH__STUDENT' ? await pool.query(DETACHSTUDENTONPARENT, [student_id, parent_id]) :
                    null
            if (!remove) return res.status(412).json({ message: 'Action could not be executed', code: '412', data: {} })
            return res.status(200).json({ message: `Student's parent information removed successfully`, code: '200', data: {} })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }
    const deleteParent = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('parent_id') || !params.get('student_id')) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const parent_id = params.get('parent_id')
        const student_id = params.get('student_id')
        if (!parent_id.match(MONGOOBJECT) || !student_id.match(MONGOOBJECT)) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        try {
            const getParent = await pool.query(GETPARENT, [parent_id])
            if (getParent.rowCount === 0) return res.status(412).json({ message: 'Parent could not be found', code: '412', data: {} })
            const data = getParent.rows[0]
            return extract(data.school_id, req, res, async () => {
                try {
                    const studentsOnParent = await pool.query(GETSTUDENTBY_PARENT, [parent_id])
                    if (studentsOnParent.rowCount === 0) return DeleteParent(res, student_id, parent_id, 'DELETE__PARENT')
                    const list = studentsOnParent.rows
                    const checkStudentInList = list.some(item => item.student_id === student_id)
                    if (!checkStudentInList) return res.status(412).json({ message: 'The student is not a child of the parent', code: '412', data: {} })
                    if (list.length === 1) return DeleteParent(res, student_id, parent_id, 'DELETE__PARENT')
                    return DeleteParent(res, student_id, parent_id, 'DETACH__STUDENT')
                } catch (error) {
                    return res.status(500).json({ message: WSWW, code: '500', data: {} })
                }
            })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }
    return {
        GetParentRelationsOnStudent, createParent, searchRelatedParents, updateParent, getParent, getParentsOfStudent, deleteParent
    }
}