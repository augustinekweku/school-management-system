import { compareSync } from "bcrypt"
import DatabaseConnection from "../../config/config.db.js"
import RequestBodyChecker from "../../helpers/helper.request_checker.js"
import StudentAccessQuery from "../../queries/query.student_access.js"
import StudentAccessValidations from "../../validators/validator.student_access.js"
import * as JWT from 'jsonwebtoken'

export default function StudentAccessControllers() {
    const { isTrueBodyStructure } = RequestBodyChecker()
    const { pool } = DatabaseConnection()
    const { loginValidator } = StudentAccessValidations()
    const { CHECKSTUDENT } = StudentAccessQuery()
    const WSWW = 'Whoops! Something went wrong'
    const { sign } = JWT.default

    const login = async (req, res) => {
        let { username, password } = req.body
        const expected_payload = ['username', 'password']
        const checkPayload = isTrueBodyStructure(req.body, expected_payload)
        if (!checkPayload) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const validate = loginValidator(req.body, async () => {
            try {
                username = Number(username)
                const checkStudent = await pool.query(CHECKSTUDENT, [username])
                if (checkStudent.rowCount !== 1) return res.status(412).json({ message: 'Incorrect credentials', code: '412', data: {} })
                const data = checkStudent.rows[0]
                const isTruePassword = compareSync(password, data.password)
                if (!isTruePassword) return res.status(412).json({ message: 'Incorrect credentials', code: '412', data: {} })
                const signedInStudent = {
                    id: data.id, index_no: data.index_no, usertype: parseInt(process.env.SMS_STUDENT),
                    firstname: data.firstname, othername: data.othername,
                    lastname: data.lastname, current_class: data.current_class,
                    school_id: data.school_id, school_name: data.name, school_country: data.country, school_motto: data.motto, school_address: data.address, school_logo_url: data.logo_url, school_email: data.school_email
                }
                const token = sign({ ...signedInStudent }, process.env.SMS_JWT_SECRET, { expiresIn: '2h' })
                if (!token) return res.status(500).json({ message: WSWW, code: '500', data: {} })
                return res.status(200).json({
                    message: 'Successful login',
                    code: '200', data: {
                        user: {
                            ...signedInStudent,
                            token
                        }
                    }
                })
            } catch (error) {
                return res.status(500).json({ message: WSWW, code: '500', data: {} })
            }
        })
        if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
    }

    return {
        login
    }
}