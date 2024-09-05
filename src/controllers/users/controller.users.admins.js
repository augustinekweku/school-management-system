import { genSaltSync, hashSync } from "bcrypt"
import UserValidator from "../../validators/validator.user.js"
import StringManipulators from "../../utils/algos/StringManipulators.js"
import DatabaseConnection from "../../config/config.db.js"
import RequestBodyChecker from "../../helpers/helper.request_checker.js"
import Eligibility_Extractor from "../../helpers/helper.account_sch_relation.js"
import UserControllers from "../controller.auth.js"
import UserQueries from "../../queries/query.user.js"
import { ObjectId } from "bson"
import { Messages, Regex } from "../../utils/static/index.js"
import needle from "needle"
import AdminManagementQuery from "../../queries/query.users.admin.js"
import url from "url"
import Pagination from "../../helpers/helper.pagination_setter.js"
import PaginationParams from "../../helpers/helper.paginator.js"

export default function AdminManagementController() {
    const { pool } = DatabaseConnection()
    const { cleanSCW, cleanExcessWhiteSpaces } = StringManipulators()
    const { isTrueBodyStructure } = RequestBodyChecker()
    const { validateRegistration } = UserValidator()
    const { removeAccount } = UserControllers()
    const SALT = genSaltSync(10)
    const { extract } = Eligibility_Extractor()
    const { localPaginator } = PaginationParams()
    const {
        CHECKDATA, SAVEROLES
    } = UserQueries()
    const { CREATEADMIN, GETADMINS, GETDATABYUSERID, UPDATEADMIN, DELETEADMIN } = AdminManagementQuery()
    const { WSWW } = Messages.General
    const { MONGOOBJECT } = Regex

    const createAdmin = async (req, res) => {
        let { school_id, firstname, lastname, email, gender, phone, password } = req.body
        const expected_payload = ['school_id', 'firstname', 'lastname', 'email', 'gender', 'phone', 'password', 'password_confirmation']
        const checkPayload = isTrueBodyStructure(req.body, expected_payload)
        if (!checkPayload) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        req.body = { ...req.body, school_name: (new ObjectId()).toString(), school_country: 'defaultcountry' }
        const validate = validateRegistration(req.body, () => {
            return extract(school_id, req, res, async () => {
                try {
                    firstname = cleanSCW(firstname)
                    lastname = cleanSCW(lastname)
                    email = email.trim()
                    gender = gender.trim().toLowerCase()
                    password = hashSync(password, SALT)
                    phone = cleanExcessWhiteSpaces(phone)
                    const result = await pool.query(CHECKDATA, [email, phone])
                    if (result.rowCount > 0) return res.status(412).json({ message: 'Email or phone has been taken', code: '412', data: {} })
                    const timestamp = (new Date()).toISOString()
                    const user_id = (new ObjectId()).toString()
                    await pool.query(CREATEADMIN, [firstname, lastname, email, gender, phone, password, timestamp, user_id, 2, true])
                    const roles = []
                    const saveRole = await pool.query(SAVEROLES, [user_id, school_id, roles])
                    if (saveRole.rowCount !== 1) return removeAccount(user_id, res)
                    const sendSMS = await needle(
                        "post", process.env.SMS_MESSENGER_URL,
                        {
                            "sender": process.env.SMS_MESSENGER_NAME,
                            "message": `Manage has approved your new role as a school administrator and by this, you have automatically accepted all terms and conditions. Thank you!`,
                            "recipients": [`233${parseInt(phone)}`]
                        }, {
                        headers: {
                            'api-key': process.env.SMS_MESSENGER_API_KEY,
                            'Content-Type': 'application/json'
                        }
                    })
                    if (sendSMS.body.status !== 'success') return removeAccount(user_id, res)
                    return res.status(201).json({
                        message: 'Successfully created an administrator', code: '201', data: {
                            id: user_id, firstname, lastname, email, phone, created_at: timestamp, updated_at: timestamp
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

    const getAdmins = async (req, res) => {
        try {
            const params = new URLSearchParams(url.parse(req.url, true).query)
            if (!params.get('school_id')) return res.status(200).json({ message: '', code: '200', data: {} })
            const school_id = params.get('school_id')
            if (!school_id.match(MONGOOBJECT)) return res.status(200).json({ message: '', code: '200', data: {} })
            const { pageSize, page } = Pagination().Setter(params, 1, 10)
            const listOfAdmins = await pool.query(GETADMINS, [school_id])
            const { total_pages, search_results, total_items } = localPaginator(listOfAdmins.rows, pageSize, page)
            return res.status(200).json({
                message: '', code: '200', data: {
                    administrators: [...search_results],
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

    const UpdateAdminData = async (res, id, firstname, lastname, email, phone, gender, usertype, timestamp, userData) => {
        try {
            await pool.query(UPDATEADMIN, [firstname, lastname, email, phone, gender, usertype, timestamp, id])
            return res.status(200).json({
                message: 'Successfully updated record', code: '200', data: {
                    ...userData,
                    firstname,
                    lastname,
                    email,
                    phone,
                    gender,
                    usertype,
                    updated_at: timestamp
                }
            })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }

    const updateAdmin = async (req, res) => {
        let { id, firstname, lastname, email, gender, phone, usertype } = req.body
        const expected_payload = ['id', 'firstname', 'lastname', 'email', 'gender', 'phone', 'usertype']
        const checkPayload = isTrueBodyStructure(req.body, expected_payload)
        if (!checkPayload) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        req.body = { ...req.body, school_name: (new ObjectId()).toString(), school_country: 'defaultcountry', password: 'defaultPassword@1234_', password_confirmation: 'defaultPassword@1234' }
        if (!id.match(MONGOOBJECT)) return res.status(412).json({ message: 'No records found', code: '412', data: {} })
        if (![parseInt(process.env.SMS_ADMIN), parseInt(process.env.SMS_BLOCK)].includes(parseInt(usertype))) return res.status(412).json({ message: 'Canoot assign this usertype', code: '412', data: {} })
        const validate = validateRegistration(req.body, async () => {
            try {
                const getUserData = await pool.query(GETDATABYUSERID, [id])
                if (getUserData.rowCount !== 1) return res.status(412).json({ message: 'No records found', code: '412', data: {} })
                const userData = getUserData.rows[0]
                return extract(userData.school_id, req, res, async () => {
                    try {
                        firstname = cleanSCW(firstname)
                        lastname = cleanSCW(lastname)
                        email = email.trim()
                        gender = gender.trim().toLowerCase()
                        phone = cleanExcessWhiteSpaces(phone)
                        usertype = parseInt(usertype)
                        const timestamp = (new Date()).toISOString()
                        const result = await pool.query(CHECKDATA, [email, phone])
                        if (result.rowCount === 0) return UpdateAdminData(res, id, firstname, lastname, email, phone, gender, usertype, timestamp, userData)
                        const isNotMine = result.rows.some(item => item.id !== id)
                        if (isNotMine) return res.status(412).json({ message: 'Email or phone has been taken', code: '412', data: {} })
                        if (userData.firstname === firstname &&
                            userData.lastname === lastname &&
                            userData.email === email &&
                            userData.phone === phone &&
                            userData.usertype === usertype &&
                            userData.gender === gender) return res.status(412).json({ message: 'No changes found', code: '412', data: {} })
                        return UpdateAdminData(res, id, firstname, lastname, email, phone, gender, usertype, timestamp, userData)
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

    const DeleteAdminData = async (res, id) => {
        try {
            await pool.query(DELETEADMIN, [id])
            return res.status(200).json({ message: 'User account successfully deleted', code: '200', data: {} })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }

    const deleteAdmin = async (req, res) => {
        try {
            const params = new URLSearchParams(url.parse(req.url, true).query)
            if (!params.get('id')) return res.status(200).json({ message: '', code: '200', data: {} })
            const id = params.get('id')
            if (!id.match(MONGOOBJECT)) return res.status(200).json({ message: '', code: '200', data: {} })
            const getUserData = await pool.query(GETDATABYUSERID, [id])
            if (getUserData.rowCount !== 1) return res.status(412).json({ message: 'No records found', code: '412', data: {} })
            const userData = getUserData.rows[0]
            return extract(userData.school_id, req, res, async () => {
                try {
                    const getMainAccount = await pool.query(`SELECT user_id FROM school WHERE id = $1`, [userData.school_id])
                    const mainAccount = getMainAccount.rows[0]
                    if (mainAccount.user_id === id) return res.status(412).json({ message: 'Cannot delete this account', code: '412', data: {} })
                    return DeleteAdminData(res, id)
                } catch (error) {
                    return res.status(500).json({ message: WSWW, code: '500', data: {} })
                }
            })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }

    return {
        createAdmin, getAdmins, updateAdmin, deleteAdmin
    }
}