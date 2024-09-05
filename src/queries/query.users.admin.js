export default function AdminManagementQuery() {
    const CREATEADMIN = `INSERT INTO users (firstname, lastname, email, gender, phone, password, 
        created_at, updated_at, id, usertype, verified) VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8, $9, $10) RETURNING id`
    const GETADMINS = `SELECT u.id, ur.school_id, u.firstname, u.lastname, u.email, u.phone, u.usertype, 
    u.gender, u.verified, u.created_at, u.updated_at FROM users_role_tb ur INNER JOIN users u 
    ON ur.user_id = u.id WHERE ur.school_id = $1`
    const GETDATABYUSERID = `SELECT u.id, ur.school_id, u.firstname, u.lastname, u.email, u.phone, u.usertype, 
    u.gender, u.verified, u.created_at, u.updated_at FROM users_role_tb ur INNER JOIN users u 
    ON ur.user_id = u.id WHERE ur.user_id = $1`
    const UPDATEADMIN = `UPDATE users SET firstname = $1, lastname = $2, email = $3, phone = $4, gender = $5, usertype = $6, created_at = $7 WHERE id = $8`
    const DELETEADMIN = `DELETE FROM users WHERE id = $1`
    return {
        CREATEADMIN, GETADMINS, GETDATABYUSERID, UPDATEADMIN, DELETEADMIN
    }
}