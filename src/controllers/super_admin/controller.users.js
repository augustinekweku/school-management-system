import DatabaseConnection from "../../config/config.db.js"
import url from "url"
import Pagination from "../../helpers/helper.pagination_setter.js"
import PaginationParams from "../../helpers/helper.paginator.js"
import SuperAdminUsersQuery from "../../queries/query.users.super_admin.js"
import { Regex } from "../../utils/static/index.js"
import RequestBodyChecker from "../../helpers/helper.request_checker.js"
import UserValidator from "../../validators/validator.user.js"
import StringManipulators from "../../utils/algos/StringManipulators.js"

export default function UserAccountControllers() {
    const { pool } = DatabaseConnection()
    const paginations = Pagination()
    const paginationParams = PaginationParams()
    const queries = SuperAdminUsersQuery()
    const WSWW = 'Whoops! Something went wrong'
    const regex = Regex
    const bodyChecker = RequestBodyChecker()
    const validations = UserValidator()
    const stringMethods = StringManipulators()

    const getUsers = async (req, res) => {
        try {
            const params = new URLSearchParams(url.parse(req.url, true).query)
            const { pageSize, page } = paginations.Setter(params, 1, 10)
            const getUsers = await pool.query(queries.GET_USERS)
            const { total_pages, search_results, total_items } = paginationParams.localPaginator(getUsers.rows, pageSize, page)
            return res.status(200).json({
                message: '', code: '200', data: {
                    users: [...search_results],
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

    const getUser = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('user_id')) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const userId = params.get('user_id')
        if (!userId.match(regex.MONGOOBJECT)) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        try {
            const user = await pool.query(queries.GET_USER, [userId])
            if (user.rowCount !== 1) return res.status(200).json({ message: 'User could not found', code: '200', data: {} })
            return res.status(200).json({
                message: '', code: '200', data: {
                    ...user.rows[0]
                }
            })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }

    const searchUsers = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('q')) return res.status(200).json({ message: '', code: '200', data: {} })
        const { pageSize, page } = paginations.Setter(params, 1, 10)
        const q = params.get('q').toLowerCase()
        const getUsers = await pool.query(queries.GET_USERS)
        const data = getUsers.rows.filter(item => JSON.stringify(item).toLowerCase().includes(q))
        const { total_pages, search_results, total_items } = paginationParams.localPaginator(data, pageSize, page)
        return res.status(200).json({
            message: '', code: '200', data: {
                users: [...search_results],
                page_data: {
                    totalCount: total_items,
                    totalPages: total_pages,
                    currentPage: page,
                    pageSize: pageSize
                }
            }
        })
    }

    const UpdateUser = async (res, user, id, firstname, lastname, email, phone, usertype, gender, roles, verification_status) => {
        try {
            const timestamp = (new Date()).toISOString()
            await pool.query(queries.UPDATE_USER, [firstname, lastname, email, phone, usertype, gender, timestamp, id, verification_status])
            await pool.query(queries.UPDATE_ROLES, [roles, id])
            return res.status(200).json({
                message: 'User updated successfully', code: '200', data: {
                    ...user,
                    firstname,
                    lastname,
                    email,
                    phone,
                    usertype,
                    gender,
                    updated_at: timestamp,
                    roles,
                    verified: verification_status
                }
            })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }

    const updateUser = async (req, res) => {
        let { id, firstname, lastname, email, phone, usertype, gender, roles, verification_status } = req.body
        const expected_payload = ['id', 'firstname', 'lastname', 'email', 'phone', 'usertype', 'gender', 'roles', 'verification_status']
        const checkPayload = bodyChecker.isTrueBodyStructure(req.body, expected_payload)
        if (!checkPayload) return res.status(412).json({ message: 'Bad request', code: '412', data: {} })
        if (typeof verification_status !== 'boolean') return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const validate = validations.userUpdateValidator(req.body, async () => {
            try {
                const getUser = await pool.query(queries.GET_USER, [id])
                if (getUser.rowCount !== 1) return res.status(412).json({ message: 'User could not found', code: '412', data: {} })
                const user = getUser.rows[0]
                // firstname = stringMethods.cleanSCW(firstname)
                // lastname = stringMethods.cleanSCW(lastname)
                // email = email.trim()
                gender = gender.trim().toLowerCase()
                phone = stringMethods.cleanExcessWhiteSpaces(phone)
                const checkUserExistence = await pool.query(queries.CHECKDATA, [email, phone])
                if (checkUserExistence.rowCount === 0) return UpdateUser(res, user, id, firstname, lastname, email, phone, usertype, gender, roles, verification_status)
                const isNotMine = checkUserExistence.rows.some(item => item.id !== id)
                if (isNotMine) return res.status(412).json({ message: 'Email or phone has been taken', code: '412', data: {} })
                return UpdateUser(res, user, id, firstname, lastname, email, phone, usertype, gender, roles, verification_status)
            } catch (error) {
                return res.status(500).json({ message: WSWW, code: '500', data: {} })
            }
        })
        if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
    }

    const deleteUser = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('user_id')) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const userId = params.get('user_id')
        if (!userId.match(regex.MONGOOBJECT)) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        try {
            const user = await pool.query(queries.GET_USER, [userId])
            // if (user.rowCount !== 1) return res.status(200).json({ message: 'User could not found', code: '200', data: {} })
            // const empString = ""
            // const usertype = Number(process.env.SMS_BLOCK)
            // await 
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }


    return {
        getUsers, getUser, updateUser, searchUsers
    }
}