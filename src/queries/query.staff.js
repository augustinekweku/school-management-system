export default function StaffQuery() {
    const CREATE_STAFF_ACCOUNT = `INSERT INTO users (id, firstname, lastname, email, phone, password, 
    gender, usertype, verified, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10) RETURNING id`
    const FETCH_STAFF_NO = `SELECT staff_no FROM staff WHERE school_id = $1`
    const SAVE_STAFF = `INSERT INTO staff (user_id, school_id, staff_no, staff_type, net_salary, position, accessible_subjects, date_joined, created_at, updated_at, photo_id, photo_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, $10, $11)`
    const GETSTAFF = `SELECT u.firstname, u.lastname, u.email, u.phone, u.gender, s.school_id,
    s.staff_no, s.staff_type, s.net_salary, s.position, s.accessible_subjects, s.date_joined, s.photo_id, s.photo_url FROM staff s
    INNER JOIN users u ON u.id = s.user_id WHERE s.user_id = $1`
    const UPDATE_ACCOUNT = `UPDATE users SET firstname = $1, lastname = $2, email = $3, phone = $4, gender = $5, updated_at = $6 WHERE id = $7`
    const UPDATE_STAFF = `UPDATE staff SET staff_type = $1, net_salary = $2, position = $3, accessible_subjects = $4,
    date_joined = $5, updated_at = $6, photo_id = $7, photo_url = $8 WHERE user_id = $9 RETURNING user_id`
    const CHECKSTAFF = `SELECT u.id, u.firstname, u.lastname, u.email, u.phone, u.gender FROM users u WHERE u.email = $1 OR u.phone = $2`
    const PAGINATED_STAFF = `SELECT u.id, u.firstname, u.lastname, u.email, u.phone, u.gender,
    s.staff_no, s.staff_type, s.net_salary, s.position, s.accessible_subjects, s.date_joined, s.photo_url FROM staff s
    INNER JOIN users u ON u.id = s.user_id WHERE s.school_id = $1 LIMIT $2 OFFSET $3`
    const STAFFBYSCHOOL_ID = `SELECT u.id, u.firstname, u.lastname, u.email, u.phone, u.gender,
    s.staff_no, s.staff_type, s.net_salary, s.position, s.accessible_subjects, s.date_joined, s.photo_url FROM staff s
    INNER JOIN users u ON u.id = s.user_id WHERE s.school_id = $1`
    const DELETESTAFF = `DELETE FROM users WHERE id = $1`
    const STAFFCOUNTER = `SELECT u.gender, s.staff_type FROM staff s INNER JOIN users u ON u.id = s.user_id WHERE s.school_id = $1 AND u.usertype = $2`
    return {
        CREATE_STAFF_ACCOUNT, FETCH_STAFF_NO, SAVE_STAFF, GETSTAFF, UPDATE_ACCOUNT, UPDATE_STAFF, CHECKSTAFF, PAGINATED_STAFF, STAFFBYSCHOOL_ID, DELETESTAFF, STAFFCOUNTER
    }
}