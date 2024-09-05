import DatabaseConnection from "../../config/config.db.js"
import RequestInformation from "../../middlewares/middleware.request_info.js"
import SchoolQueries from "../../queries/query.school.js"
import SchoolValidators from "../../validators/validator.school.js"
import EligibilityChecker from "../../helpers/helper.eligibility_checker.js"
import StringManipulators from "../../utils/algos/StringManipulators.js"
import { ObjectId } from "bson"
import { Regex } from "../../utils/static/index.js"
import moment from "moment"
import url from "url"
import Eligibility_Extractor from "../../helpers/helper.account_sch_relation.js"
import Pagination from "../../helpers/helper.pagination_setter.js"
import PaginationParams from "../../helpers/helper.paginator.js"
import RequestBodyChecker from "../../helpers/helper.request_checker.js"
import DatabaseEngine from "../../helpers/helper.engine-db.js"

export default function ConfigureTerms() {
    const { validateTermRegistration, validateTermUpdate } = SchoolValidators()
    const { pool } = DatabaseConnection(), WSWW = 'Whoops! Something went wrong'
    const { GETYEARWITH_SCHOOL, CHECKTERMIN_DB, SAVETERM, UPDATETERM,
        DEACTIVATE_TERMS, REMOVE_TERM, GETATERM, PAGINATE_TERMS, CHECKTERM, FILTER_TERMS } = SchoolQueries()
    const { cleanSCW } = StringManipulators()
    const { MONGOOBJECT } = Regex
    const { extract } = Eligibility_Extractor()
    const { getPageParams } = PaginationParams()
    const { FilterSoftDeletedItems, ExecuteSoftDelete } = DatabaseEngine()
    const { isTrueBodyStructure } = RequestBodyChecker()
    const conformityTest = (res, data, start_date, end_date, next) => {
        const acadYearArray = data.acad_year.split('-', 2)
        if (!acadYearArray.includes(start_date.substring(0, 4)) ||
            !acadYearArray.includes(end_date.substring(0, 4))
        ) return res.status(412).json({ message: 'Start date or end date does not conform to the given academic year' })
        return next()
    }
    const dateChecker = (res, termsData, start_date, end_date, next) => {
        let errorfulDate = false
        for (let i = 0; i < termsData.length; i++) {
            const dbStartDate = termsData[i].start_date, dbEndDate = termsData[i].end_date
            const startDateIsBetween = moment(start_date).isBetween(dbStartDate, dbEndDate)
            const startDateIsSameAsDBStartDate = moment(start_date).isSame(dbStartDate)
            const startDateIsSameAsDBEndDate = moment(start_date).isSame(dbEndDate)
            const endDateIsBetween = moment(end_date).isBetween(dbStartDate, dbEndDate)
            const endDateIsSameAsDBStartDate = moment(end_date).isSame(dbStartDate)
            const endDateIsSameAsDBEndDate = moment(end_date).isSame(dbEndDate)
            if (startDateIsBetween || startDateIsSameAsDBStartDate ||
                startDateIsSameAsDBEndDate || endDateIsBetween ||
                endDateIsSameAsDBStartDate || endDateIsSameAsDBEndDate
            ) errorfulDate = true
        }
        if (errorfulDate) return res.status(412).json({ message: 'Date overlaps detected', code: '412', data: {} })
        return next()
    }
    const datesVerifierForUpdate = (termsData, start_date, end_date, term_id) => {
        let errorfulDate = false
        const newTermData = termsData.filter(item => item.id !== term_id)
        for (let i = 0; i < newTermData.length; i++) {
            const dbStartDate = newTermData[i].start_date, dbEndDate = newTermData[i].end_date
            const startDateIsBetween = moment(start_date).isBetween(dbStartDate, dbEndDate)
            const startDateIsSameAsDBStartDate = moment(start_date).isSame(dbStartDate)
            const startDateIsSameAsDBEndDate = moment(start_date).isSame(dbEndDate)
            const endDateIsBetween = moment(end_date).isBetween(dbStartDate, dbEndDate)
            const endDateIsSameAsDBStartDate = moment(end_date).isSame(dbStartDate)
            const endDateIsSameAsDBEndDate = moment(end_date).isSame(dbEndDate)
            if (startDateIsBetween || startDateIsSameAsDBStartDate ||
                startDateIsSameAsDBEndDate || endDateIsBetween ||
                endDateIsSameAsDBStartDate || endDateIsSameAsDBEndDate
            ) errorfulDate = true
        }
        return errorfulDate
    }
    const useEligibility = (req, res, data) => {
        const request_info = RequestInformation(req, res)
        let goAhead = true
        const shouldContinue = EligibilityChecker().isEligible(data, request_info)
        if (!shouldContinue) goAhead = false
        return goAhead
    }
    const saveTerms = (req, res) => {
        let { year_id, term_name, start_date, end_date } = req.body
        const expected_payload = ['year_id', 'term_name', 'start_date', 'end_date']
        const checkPayload = isTrueBodyStructure(req.body, expected_payload)
        if (!checkPayload) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const validate = validateTermRegistration(req.body, () => {
            pool.query(GETYEARWITH_SCHOOL, [year_id]).then(result => {
                if (result.rowCount === 0) return res.status(404).json({ message: 'No records found', code: '404', data: {} })
                const eligible = useEligibility(req, res, result.rows[0])
                if (!eligible) return res.status(401).json({ message: 'Unauthorized request', code: '401', data: {} })
                const timestamp = (new Date()).toISOString(), termId = (new ObjectId()).toString(), data = result.rows[0]
                return conformityTest(res, data, start_date, end_date, () => {
                    // term_name = cleanSCW(term_name)
                    pool.query(CHECKTERMIN_DB, [data.school_id]).then(terms => {
                        if (terms.rowCount >= 3) return res.status(412).json({ message: 'Maximum of three terms allowed per academic year', code: '412', data: {} })
                        const termsData = terms.rows.filter(item => item.academic_year_id === year_id), existsAlready = termsData.filter(item => item.name === term_name).length > 0 ? true : false
                        if (existsAlready) return res.status(412).json({ message: 'Term has already been registered under the academic year', code: '412', data: {} })
                        return dateChecker(res, termsData, start_date, end_date, () => {
                            pool.query(SAVETERM, [termId, term_name, year_id, start_date, end_date, data.school_id, timestamp]).then(done => {
                                const newTerm = done.rows[0]
                                return res.status(201).json({
                                    message: 'Registration of term was successful', code: '201', data: {
                                        id: termId, academic_year_id: year_id, school_id: data.school_id, name: term_name, start_date: newTerm.start_date,
                                        end_date: newTerm.end_date, created_at: timestamp, updated_at: timestamp, status: false, is_next_term: false
                                    }
                                })
                            }).catch(err => {
                                return res.status(500).json({ message: WSWW, code: '500', data: {} })
                            })
                        })
                    }).catch(err => {
                        return res.status(500).json({ message: WSWW, code: '500', data: {} })
                    })
                })
            }).catch(err => {
                return res.status(500).json({ message: WSWW, code: '500', data: {} })
            })
        })
        if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
        return validate
    }
    const deactivateTerms = async (school_id) => {
        try {
            return await pool.query(DEACTIVATE_TERMS, [false, school_id])
        } catch (error) {
            return null
        }
    }
    const setNextTerm = async (school_id) => {
        try {
            const terms = await pool.query(`SELECT id, name, start_date, end_date, status, is_next_term FROM terms WHERE is_displayable = $1 AND school_id = $2`, [true, school_id])
            if (terms.rowCount === 0) return null
            const termlist = terms.rows
            const activeTermArray = termlist.filter(term => term.status)
            if (activeTermArray.length !== 1) return null
            const arrangeTermsCloserToActive = termlist.map(term => ({ id: term.id, isActive: term.status, starting: (new Date(term.start_date)).getTime() })).sort((a, b) => {
                return a.starting - b.starting
            })
            const activeTermIndex = arrangeTermsCloserToActive.indexOf(arrangeTermsCloserToActive.filter(at => at.isActive)[0])

            const nextIndex = activeTermIndex + 1

            if (typeof arrangeTermsCloserToActive[nextIndex] === 'undefined') return null

            const nextTermId = arrangeTermsCloserToActive[nextIndex].id
            await pool.query('UPDATE terms SET is_next_term = $1 WHERE school_id = $2', [false, school_id])
            return await pool.query('UPDATE terms SET is_next_term = $1 WHERE id = $2', [true, nextTermId])
        } catch (error) {
            return null
        }
    }
    const updateTerm = (req, res) => {
        let { term_id, year_id, term_name, start_date, end_date, status } = req.body
        const expected_payload = ['term_id', 'year_id', 'term_name', 'start_date', 'end_date', 'status']
        const checkPayload = isTrueBodyStructure(req.body, expected_payload)
        if (!checkPayload) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const validate = validateTermUpdate(req.body, async () => {
            try {
                const result = await pool.query(GETYEARWITH_SCHOOL, [year_id])
                if (result.rowCount === 0) return res.status(404).json({ message: 'No records found', code: '404', data: {} })

                const eligible = useEligibility(req, res, result.rows[0])
                if (!eligible) return res.status(401).json({ message: 'Unauthorized request', code: '401', data: {} })
                const timestamp = (new Date()).toISOString()
                const data = result.rows[0]

                return conformityTest(res, data, start_date, end_date, async () => {
                    // term_name = cleanSCW(term_name)
                    const terms = await pool.query(CHECKTERMIN_DB, [data.school_id])
                    const termsData = terms.rows
                    const targetTerm = termsData.filter(item => item.id === term_id)
                    if (targetTerm.length === 0) return res.status(404).json({ message: 'No term records found', code: '404', data: {} })

                    const dbStatus = targetTerm[0].status, dbName = targetTerm[0].name, dbStart = targetTerm[0].start_date, dbEnd = targetTerm[0].end_date
                    if (dbName === term_name && status === dbStatus &&
                        moment(start_date).isSame(dbStart) &&
                        moment(end_date).isSame(dbEnd)
                    ) return res.status(412).json({ message: 'No changes found yet', code: '412', data: {} })
                    const dateError = datesVerifierForUpdate(termsData, start_date, end_date, term_id)
                    if (dateError) return res.status(412).json({ message: 'Inappropriate date(s) chosen', code: '412', data: {} })
                    if (status) {
                        const deactivate = await deactivateTerms(data.school_id)
                        if (!deactivate) return res.status(412).json({ message: 'Term update has failed', code: '412', data: {} })
                    }

                    await pool.query(UPDATETERM, [term_name, start_date, end_date, timestamp, status, term_id])
                    await setNextTerm(data.school_id)
                    return res.status(200).json({
                        message: 'Term data successfully updated', code: '200', data: {
                            id: term_id, name: term_name, start_date, end_date, academic_year_id: targetTerm[0].academic_year_id,
                            created: targetTerm[0].created_at, updated_at: timestamp, school_id: targetTerm[0].school_id, status
                        }
                    })
                })
            } catch (error) {
                return res.status(500).json({ message: 'Whoops! Something went wrong', code: '500', data: {} })
            }
        })
        if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
        return validate
    }
    const removeTerm = (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('school_id') || !params.get('term_id')) return res.status(400).json({ message: 'Bad request received', code: '400', data: {} })
        const school_id = params.get('school_id'), term_id = params.get('term_id')
        if (!school_id.match(MONGOOBJECT) ||
            !term_id.match(MONGOOBJECT)
        ) return res.status(400).json({ message: 'Bad request received', code: '400', data: {} })
        return extract(school_id, req, res, async () => {
            try {
                const getTerm = await pool.query(CHECKTERM, [term_id])
                if (getTerm.rowCount === 0) return res.status(404).json({ message: 'No records found', code: '404', data: {} })
                const lookUpInAcademicRecords = await pool.query(`SELECT COUNT(id) AS term_in_results FROM academic_records WHERE term_id = $1`, [term_id])
                if (parseInt(lookUpInAcademicRecords.rows[0].term_in_results) > 0) return ExecuteSoftDelete(res, term_id, 'terms')
                const data = getTerm.rows[0]
                if (data.school_id !== school_id) return res.status(412).json({ message: 'Access denied!', code: '412', data: {} })
                await pool.query(REMOVE_TERM, [term_id])
                return res.status(200).json({ message: 'Term removed successfully', code: '200', data: {} })
            } catch (error) {
                return res.status(500).json({ message: WSWW, code: '500', data: {} })
            }
        })
    }
    const fetchATerm = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('term_id')) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const term_id = params.get('term_id')
        if (!term_id.match(MONGOOBJECT)
        ) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        try {
            const getData = await pool.query(GETATERM, [term_id])
            if (getData.rowCount === 0) return res.status(200).json({ message: '', code: '200', data: {} })
            return res.status(200).json({
                message: '', code: '200', data: {
                    ...getData.rows[0]
                }
            })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }
    const fetchTerms = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('school_id')) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const school_id = params.get('school_id')
        try {
            const { pageSize, offset, page } = Pagination().Setter(params, 1, 10)
            const PaginationParams = getPageParams(pageSize, 'terms', `school_id = '${school_id}' AND is_displayable = true`)
            const data = await pool.query(PAGINATE_TERMS, [school_id, pageSize, offset])
            return res.status(200).json({
                message: '', code: '200', data: {
                    terms: [...data.rows],
                    page_data: {
                        ...PaginationParams, currentPage: page, pageSize
                    }
                }
            })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }
    const filterTerms = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('academic_year_id')) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const yearId = params.get('academic_year_id')
        if (!yearId.match(MONGOOBJECT)) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        try {
            const terms = await pool.query(FILTER_TERMS, [yearId])
            return res.status(200).json({ message: '', code: '200', data: { terms: terms.rows } })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }
    return {
        filterTerms, saveTerms, updateTerm, removeTerm, fetchATerm, fetchTerms, useEligibility
    }
}