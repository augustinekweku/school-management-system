import pg from 'pg'
import dotenv from 'dotenv'

export default function DatabaseConnection() {
    dotenv.config()
    const { Pool } = pg
    const pool = new Pool({
        user: process.env.SMS_DB_USER,
        host: process.env.SMS_DB_HOST,
        database: process.env.SMS_DB_DATABASE,
        password: process.env.SMS_DB_PASSWORD,
        port: process.env.SMS_DB_PORT,
        ssl: {
          rejectUnauthorized: false
        }
    })
    return { pool }
}