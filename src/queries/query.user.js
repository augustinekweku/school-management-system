export default function UserQueries() {
    const CHECKDATA = `SELECT * FROM users WHERE email = $1 OR phone = $2`
    const CREATEUSER = `INSERT INTO users (firstname, lastname, email, gender, phone, password, 
    created_at, updated_at, id) VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8) RETURNING id`
    const PUTVCODE = `INSERT INTO verifications (user_id, code, created_at, id) VALUES ($1, $2, $3, $4) RETURNING id`
    const DELETEACCOUNT = `DELETE FROM users WHERE id = $1`
    const CHECKPHONE = `SELECT * FROM users WHERE phone = $1`
    const DELETEVERIFICATIONS = `DELETE FROM verifications WHERE user_id = $1`
    const GETLINK = `SELECT v.code, v.created_at, users.phone, users.verified FROM verifications v INNER JOIN users ON v.user_id = users.id WHERE v.user_id = $1`
    const VERIFYUSER = `UPDATE users SET verified = $1 WHERE id = $2`
    const REGISTERPASSWORDRESET = `INSERT INTO password_reset (user_id, code, created_at, id) VALUES ($1, $2, $3, $4)`
    const DELETEPASSWORDRESETS = `DELETE FROM password_reset WHERE user_id = $1`
    const GETPASSWORDRESET = `SELECT * FROM password_reset WHERE user_id = $1`
    const REMOVEPASSWORDRESET = `DELETE FROM password_reset WHERE user_id = $1`
    const UPDATEPASSWORD = `UPDATE users SET password = $1 WHERE id = $2`
    const GETUSER = `SELECT * FROM users WHERE id = $1`
    const REMOVESTATEIDS = `DELETE FROM accessors WHERE user_id = $1`
    const CHECKEMAIL = `SELECT * FROM users WHERE email = $1`
    const SAVESTATEID = `INSERT INTO accessors (user_id, state_id, alive, created_at, id) VALUES ($1, $2, $3, $4, $5)`
    const GETTOKENDATA = `SELECT * FROM accessors WHERE user_id = $1`
    const UPDATETOKENS = `UPDATE accessors SET alive = $2 WHERE user_id = $1`
    const GETSCHOOLFORUSER = `SELECT s.id AS school_id, s.name AS school_name, s.slug, s.country, s.owner, s.school_email,
	s.motto, s.address, s.logo_url, s.created_at, s.updated_at FROM school s WHERE user_id = $1`
    const UPDATEUSER = `UPDATE users SET firstname = $1, lastname = $2, email = $3, phone = $4, usertype = $5, gender = $6, updated_at = $7 WHERE id = $8`
    const SAVEROLES = `INSERT INTO users_role_tb(user_id, school_id, roles) VALUES ($1, $2, $3) RETURNING user_id`

    return {
        CHECKDATA, CREATEUSER, PUTVCODE, DELETEACCOUNT, CHECKPHONE, DELETEVERIFICATIONS, GETLINK,
        VERIFYUSER, REGISTERPASSWORDRESET, DELETEPASSWORDRESETS, GETPASSWORDRESET, REMOVEPASSWORDRESET,
        UPDATEPASSWORD, GETUSER, REMOVESTATEIDS, SAVESTATEID, CHECKEMAIL, GETTOKENDATA, UPDATETOKENS,
        UPDATEUSER, GETSCHOOLFORUSER, SAVEROLES
    }
}