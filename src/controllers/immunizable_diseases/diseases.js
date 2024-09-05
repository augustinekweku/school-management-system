import { ObjectId } from "bson"
import DatabaseConnection from "../../config/config.db.js"
import Eligibility_Extractor from "../../helpers/helper.account_sch_relation.js"
import DiseaseQuery from "../../queries/query.disease.js"
import StringManipulators from "../../utils/algos/StringManipulators.js"
import DiseaseValidations from "../../validators/validator.disease.js"
import url from "url"
import { Regex } from "../../utils/static/index.js"
import Pagination from "../../helpers/helper.pagination_setter.js"
import PaginationParams from "../../helpers/helper.paginator.js"
import RequestBodyChecker from "../../helpers/helper.request_checker.js"
import DatabaseEngine from "../../helpers/helper.engine-db.js"

export default function ImmunizableDiseases() {
    const { createDiseaseValidator, updateDiseaseValidator } = DiseaseValidations()
    const { cleanExcessWhiteSpaces, polishLongTexts } = StringManipulators()
    const { extract } = Eligibility_Extractor()
    const { localPaginator } = PaginationParams()
    const { isTrueBodyStructure } = RequestBodyChecker()
    const { pool } = DatabaseConnection()
    const { ExecuteSoftDelete, FilterSoftDeletedItems } = DatabaseEngine()
    const { CHECK_RESOURCE_INUSE, CHECK_EXISTENCE, SAVE_DISEASE, GETDISEASE, UPDATE_DISEASE, REMOVE_DISEASE, PAGINATE_DISEASES, GET_DISEASES_FOR_SEARCH } = DiseaseQuery()
    const { MONGOOBJECT } = Regex
    const WSWW = 'Whoops! Something went wrong'

    const CheckExistence = async (disease, school_id) => {
        try {
            const check = await pool.query(CHECK_EXISTENCE, [school_id, disease])
            return check
        } finally {
            console.log(true)
        }
    }
    const createDisease = (req, res) => {
        let { disease, description, school_id } = req.body
        const expected_payload = ['disease', 'description', 'school_id']
        const checkPayload = isTrueBodyStructure(req.body, expected_payload)
        if (!checkPayload) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const validate = createDiseaseValidator(req.body, () => {
            return extract(school_id, req, res, async () => {
                try {
                    // disease = cleanExcessWhiteSpaces(disease)
                    const exists = await CheckExistence(disease, school_id)
                    if (exists.rowCount === 1) return res.status(412).json({ message: 'Immunizable disease already created', code: '412', data: {} })
                    description = polishLongTexts(description)
                    const timestamp = (new Date()).toISOString()
                    const id = (new ObjectId()).toString()
                    await pool.query(SAVE_DISEASE, [id, school_id, disease, description, timestamp])
                    return res.status(201).json({
                        message: 'Immunizable disease created successfully', code: '201', data: {
                            id, school_id, disease, description, created_at: timestamp, updated_at: timestamp
                        }
                    })
                } catch (error) {
                    return res.status(500).json({ message: WSWW, code: '500', data: {} })
                }
            })
        })
        if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
        return validate
    }
    const update = async (res, disease_id, disease, description, timestamp) => {
        try {
            const updateDisease = await pool.query(UPDATE_DISEASE, [disease, description, timestamp, disease_id])
            if (updateDisease.rowCount === 0) return res.status(500).json({ message: 'Action could not be executed', code: '500', data: {} })
            return res.status(200).json({
                message: 'Immunizable disease was updated successfully', code: '200', data: {
                    id: disease_id,
                    disease,
                    description,
                    created_at: updateDisease.rows[0].created_at,
                    updated_at: timestamp
                }
            })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }
    const updateDisease = (req, res) => {
        let { disease_id, disease, description } = req.body
        const expected_payload = ['disease_id', 'disease', 'description']
        const checkPayload = isTrueBodyStructure(req.body, expected_payload)
        if (!checkPayload) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const validate = updateDiseaseValidator(req.body, async () => {
            try {
                const diseaseData = await pool.query(GETDISEASE, [disease_id])
                if (diseaseData.rowCount !== 1) return res.status(412).json({ message: 'No records found', code: '412', data: {} })
                const data = diseaseData.rows[0]
                if (!data.is_displayable) return res.status(412).json({ message: 'Cannot update a hidden record', code: '412', data: {} })
                // disease = cleanExcessWhiteSpaces(disease)
                description = polishLongTexts(description)
                const timestamp = (new Date()).toISOString()
                return extract(data.school_id, req, res, async () => {
                    if (data.disease === disease) return update(res, disease_id, disease, description, timestamp)
                    const exists = await CheckExistence(disease, data.school_id)
                    if (exists.rowCount === 0) return update(res, disease_id, disease, description, timestamp)
                    const existingRow = exists.rows[0]
                    if (existingRow.id === disease_id) return update(res, disease_id, disease, description, timestamp)
                    return res.status(412).json({ message: 'This disease already exists', code: '412', data: {} })
                })
            } catch (error) {
                return res.status(500).json({ message: WSWW, code: '500', data: {} })
            }
        })
        if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
        return validate
    }
    const removeDisease = async (req, res) => {
        try {
            const params = new URLSearchParams(url.parse(req.url, true).query)
            if (!params.get('disease_id')) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
            const disease_id = params.get('disease_id')
            if (!disease_id.match(MONGOOBJECT)) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
            // Retrieve school info for testing
            const disease = await pool.query(GETDISEASE, [disease_id])
            if (disease.rowCount !== 1) return res.status(412).json({ message: 'No records found', code: '412', data: {} })
            const data = disease.rows[0]
            if (!data.is_displayable) return res.status(412).json({ message: 'No records found', code: '412', data: {} })
            return extract(data.school_id, req, res, async () => {
                try {
                    // Check resources using this record
                    const resourseInUse = await pool.query(CHECK_RESOURCE_INUSE, [disease_id])
                    if (parseInt(resourseInUse.rows[0].resource_in_use) > 0) return ExecuteSoftDelete(res, disease_id, 'immunizable_diseases')
                    await pool.query(REMOVE_DISEASE, [disease_id])
                    return res.status(200).json({ message: 'Immunizable disease was removed successfully', code: '200', data: {} })
                } catch (error) {
                    return res.status(500).json({ message: WSWW, code: '500', data: {} })
                }
            })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }
    const getDisease = async (req, res) => {
        try {
            const params = new URLSearchParams(url.parse(req.url, true).query)
            if (!params.get('disease_id')) return res.status(200).json({ message: '', code: '200', data: {} })
            const disease_id = params.get('disease_id')
            if (!disease_id.match(MONGOOBJECT)) return res.status(200).json({ message: '', code: '200', data: {} })
            const diseaseInfo = await pool.query(GETDISEASE, [disease_id])
            if (diseaseInfo.rowCount === 0) return res.status(200).json({ message: '', code: '200', data: {} })
            const collection = FilterSoftDeletedItems(diseaseInfo.rows)
            if (collection.length === 0) return res.status(200).json({ message: '', code: '200', data: {} })
            const { school_id, disease, description, created_at, updated_at } = collection[0]
            return res.status(200).json({
                message: '', code: '200', data: {
                    id: disease_id,
                    school_id,
                    disease,
                    description,
                    created_at,
                    updated_at
                }
            })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }
    const getDiseases = async (req, res) => {
        try {
            const params = new URLSearchParams(url.parse(req.url, true).query)
            if (!params.get('school_id')) return res.status(200).json({ message: '', code: '200', data: {} })
            const school_id = params.get('school_id')
            if (!school_id.match(MONGOOBJECT)) return res.status(200).json({ message: '', code: '200', data: {} })
            const { pageSize, offset, page } = Pagination().Setter(params, 1, 10)
            const paginationData = await PaginationParams().getPageParams(pageSize, 'immunizable_diseases', `school_id = '${school_id}' AND is_displayable = true`)
            const collection = await pool.query(PAGINATE_DISEASES, [school_id, true, pageSize, offset])
            return res.status(200).json({
                message: '', code: '200', data: {
                    immunizable_diseases: [...collection.rows],
                    page_data: {
                        ...paginationData, currentPage: page, pageSize
                    }
                }
            })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }
    const searchDiseases = async (req, res) => {
        try {
            const params = new URLSearchParams(url.parse(req.url, true).query)
            if (!params.get('school_id') || !params.get('q')) return res.status(200).json({ message: '', code: '200', data: {} })
            const school_id = params.get('school_id')
            const q = cleanExcessWhiteSpaces(params.get('q')).toLowerCase()
            if (!school_id.match(MONGOOBJECT) || q.length === 0) return res.status(200).json({ message: '', code: '200', data: {} })
            const { pageSize, page } = Pagination().Setter(params, 1, 10)
            const collection = await pool.query(GET_DISEASES_FOR_SEARCH, [school_id, true])
            const matches = collection.rows.filter(item => JSON.stringify(item).toLowerCase().includes(q))
            const { total_pages, search_results, total_items } = localPaginator(matches, pageSize, page)
            return res.status(200).json({
                message: '', code: '200', data: {
                    immunizable_diseases: [...search_results],
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
    return {
        createDisease, updateDisease, removeDisease, getDisease, getDiseases, searchDiseases
    }
}