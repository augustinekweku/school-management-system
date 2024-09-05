export default function SuperAdminUsersQuery() {
    const PAGINATE_USERS = `SELECT u.id, u.firstname, u.lastname, u.email, u.phone, 
    u.usertype, u.verified, u.gender, u.created_at, u.updated_at, urt.roles, s.name, 
    s.country, s.owner, s.school_email, s.motto, s.address, s.logo_url FROM users_role_tb urt 
    INNER JOIN users u ON urt.user_id = u.id INNER JOIN school s ON urt.school_id = s.id ORDER BY 
    u.firstname ASC LIMIT $1 OFFSET $2`
    const GET_USER = `SELECT u.id, u.firstname, u.lastname, u.email, u.phone, 
    u.usertype, u.verified, u.gender, u.created_at, u.updated_at, urt.roles, s.name, 
    s.country, s.owner, s.school_email, s.motto, s.address, s.logo_url FROM users_role_tb urt 
    INNER JOIN users u ON urt.user_id = u.id INNER JOIN school s ON urt.school_id = s.id WHERE u.id = $1`
    const CHECKDATA = `SELECT * FROM users WHERE email = $1 OR phone = $2`
    const UPDATE_USER = `UPDATE users SET firstname = $1, lastname = $2, email = $3, phone = $4, 
    usertype = $5, gender = $6, updated_at = $7, verified = $9 WHERE id = $8`
    const UPDATE_ROLES = `UPDATE users_role_tb SET roles = $1 WHERE user_id = $2`
    const GET_USERS = `SELECT u.id, u.firstname, u.lastname, u.email, u.phone, 
    u.usertype, u.verified, u.gender, u.created_at, u.updated_at, urt.roles, s.name, 
    s.country, s.owner, s.school_email, s.motto, s.address, s.logo_url FROM users_role_tb urt 
    INNER JOIN users u ON urt.user_id = u.id INNER JOIN school s ON urt.school_id = s.id ORDER BY 
    u.firstname ASC`

    return {
        PAGINATE_USERS, GET_USER, CHECKDATA, UPDATE_USER, UPDATE_ROLES, GET_USERS
    }
}