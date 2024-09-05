import cryptoRandomString from "crypto-random-string"
import DatabaseConnection from "../config/config.db.js"

export default function GenerateStudentUsername() {
    const { pool } = DatabaseConnection()
    const GETDATA = `SELECT sc.row_id, s.index_no FROM students s 
    INNER JOIN school sc ON sc.id = s.school_id WHERE s.id = $1`
    const UsernameGenerator = async (student_id) => {
        let username = ''
        try {
            const getData = await pool.query(GETDATA, [student_id])
            if (getData.rowCount === 0) return username
            const { row_id, index_no } = getData.rows[0]
            username = `${row_id}${cryptoRandomString({ length: 3, type: 'alphanumeric' })}-${index_no}`
            return username
        } finally {
            console.log('name_generated')
        }
    }
    return { UsernameGenerator }
}