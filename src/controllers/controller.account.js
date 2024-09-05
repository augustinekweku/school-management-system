import url from 'url'
import DatabaseConnection from '../config/config.db.js'
import UserQueries from '../queries/query.user.js'
import { ObjectId } from 'bson'
import SchoolQueries from '../queries/query.school.js'
import UserValidator from '../validators/validator.user.js'
import StringManipulators from '../utils/algos/StringManipulators.js'
import { Regex } from '../utils/static/index.js'

export default function AccountControllers() {
    const { pool } = DatabaseConnection(), WSWW = 'Whoops! Something went wrong.'
    const { DELETEACCOUNT, CHECKDATA, GETUSER, UPDATEUSER } = UserQueries()
    const { SETSCHOOLDATA, GETSCHOOLBYACCOUNT, REVOKESCHOOL } = SchoolQueries()
    const { MONGOOBJECT } = Regex
    const { userUpdateValidator } = UserValidator()
    const { capitalize } = StringManipulators()
    const deleteAccount = (data, message, res) => {
        const { account, school_id } = data
        pool.query(DELETEACCOUNT, [account]).then(function () {
            return res.status(200).json({ message, code: '200', data: { school_id } })
        }).catch(err => {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        })
    }
    const revokeAccount = (req, res) => {
        const param = new URLSearchParams(url.parse(req.url, true).query)
        if (!param.get('account')) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const account = param.get('account')
        if (!account.match(MONGOOBJECT)) return res.status(400).json({
            message: 'Bad request', code: '400', data: {}
        })
        pool.query(DELETEACCOUNT, [account]).then(() => {
            return res.status(200).json({ message: 'Account deleted successfully!', code: '200', data: {} })
        }).catch(err => {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        })
        // pool.query(GETSCHOOLBYACCOUNT, [account]).then(result => {
        //     if (result.rowCount === 0) return deleteAccount({ account, school_id: undefined }, 'Account removed successfully', res)
        //     const data = result.rows[0]
        //     const rand_email = `${(new ObjectId()).toString()}@sample.net`
        //     pool.query(SETSCHOOLDATA, [rand_email, null, data.id]).then(() => {
        //         return deleteAccount({ account, school_id: data.id }, 'Account revoked! Contact the system administrator for any other concerns', res)
        //     }).catch(err => {
        //         return res.status(500).json({ message: WSWW, code: '500', data: {} })
        //     })
        // }).catch(err => {
        //     return res.status(500).json({ message: WSWW, code: '500', data: {} })
        // })
    }
    const removeSchoolData = (req, res) => {
        const param = new URLSearchParams(url.parse(req.url, true).query)
        if (!param.get('school')) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const school = param.get('school')
        if (school.length === 0) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        pool.query(REVOKESCHOOL, [school]).then(result => {
            if (result.rowCount > 0) return res.status(200).json({ message: 'School data cleared successfully', code: '200', data: {} })
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }).catch(err => {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        })
    }

    // super-admin
    const userUpdate = (req, res) => {
        let { firstname, lastname, email, phone, usertype, gender, id } = req.body
        const validate = userUpdateValidator(req.body, () => {
            firstname = capitalize(firstname), lastname = capitalize(lastname), email = email.trim(), gender = Number(gender)
            const timestamp = (new Date()).toISOString()
            const update = (user_data) => {
                pool.query(UPDATEUSER, [firstname, lastname, email, phone, usertype, gender, timestamp, id]).then(() => {
                    return res.status(200).json({
                        message: 'Account update was successful', code: '200', data: {
                            user: {
                                ...user_data, firstname, lastname, email,
                                phone: parseInt(phone), usertype: Number(usertype), gender: Number(gender), updated_at: timestamp, password: undefined
                            }
                        }
                    })
                }).catch(err => {
                    return res.status(500).json({ message: WSWW, code: '500', data: {} })
                })
            }
            pool.query(GETUSER, [id]).then(user => {
                if (user.rowCount === 0) return res.status(404).json({ message: 'Sorry, no records found', code: '404', data: {} })
                const userObj = user.rows[0]
                if (!userObj.verified && [2, 3, 5].includes(Number(usertype))) return res.status(412).json({ message: 'Cannot assign administrative role to unverified account', data: {} })
                if (userObj.firstname === firstname && userObj.lastname === lastname && userObj.email === email && Number(userObj.phone) === parseInt(phone) && Number(userObj.usertype) === Number(usertype)) return res.status(412).json({ message: 'No changes found yet', code: '412', data: {} })
                pool.query(CHECKDATA, [email, phone]).then(result => {
                    if (result.rowCount === 0) return update({ ...userObj })
                    const isNotMine = result.rows.some(item => item.id !== id)
                    if (isNotMine) return res.status(412).json({ message: 'Email or phone has been taken', code: '412', data: {} })
                    return update({ ...userObj })
                }).catch(err => {
                    return res.status(500).json({ message: WSWW, code: '500', data: {} })
                })
            })
        })
        if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
        return validate
    }

    return {
        revokeAccount, removeSchoolData, userUpdate
    }
}