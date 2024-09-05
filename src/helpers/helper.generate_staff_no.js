import cryptoRandomString from "crypto-random-string"
import DatabaseConnection from "../config/config.db.js"
import StaffQuery from "../queries/query.staff.js"

export default function StaffNoGenerator() {
    const { pool } = DatabaseConnection()
    const { FETCH_STAFF_NO } = StaffQuery()
    const FetchStaffNumbers = async (id) => {
        try {
            const staff = await pool.query(FETCH_STAFF_NO, [id])
            return staff
        } finally {
            console.log(true)
        }
    }
    const generate = async (school_id) => {
        let staff_no = 0
        let isAlreadyExisting = true
        let trial = 0
        try {
            const list = await FetchStaffNumbers(school_id)
            const data = list.rows
            staff_no = parseInt(cryptoRandomString({ length: 8, type: 'numeric' }))
            while (isAlreadyExisting && trial <= data.length) {
                staff_no = parseInt(cryptoRandomString({ length: 8, type: 'numeric' }))
                isAlreadyExisting = data.includes(staff_no)
                trial++
            }
            if (!isAlreadyExisting) return staff_no
        } catch (error) {
            console.log(error)
        }
    }
    return { generate }
}