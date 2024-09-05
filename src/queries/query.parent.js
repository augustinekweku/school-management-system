export default function ParentQuery() {
    const GETSTUDENT = `SELECT * FROM students WHERE id = $1`
    const GETPARENTS = `SELECT * FROM parent_student_tb WHERE student_id = $1`
    const SAVEPARENT = `INSERT INTO parents (id, school_id, firstname, othername, lastname, gender,
    phone, residential_address, postal_address, occupation, employer, work_address, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $13) RETURNING id`
    const CREATE_RELATIONS = `WITH inserted_row AS (INSERT INTO parent_student_tb (parent_id, student_id, relationship)
    VALUES ($1, $2, $3)) SELECT * FROM parents WHERE id = $1 LIMIT 1`
    const GETALLPARENTS = `SELECT * FROM parents WHERE school_id = $1`
    const CHECKPARENT = `SELECT 
    (SELECT p.id FROM parents p WHERE id = $1 LIMIT 1) AS parent_id,
    (SELECT p.school_id FROM parents p WHERE id = $1 LIMIT 1) AS school_id,
    (SELECT COUNT(*) FROM parent_student_tb WHERE parent_id = $1 AND student_id = $2) AS student_parent_exists,
    (SELECT relationship FROM parent_student_tb WHERE parent_id = $1 LIMIT 1) AS relationship`
    const GETPARENT = `SELECT * FROM parents WHERE id = $1`
    const GETSTUDENTBY_PARENT = `SELECT * FROM parent_student_tb WHERE parent_id = $1`
    const UPDATE_PARENT = `UPDATE parents SET firstname = $1, othername = $2, lastname = $3, gender = $4, phone = $5,
    residential_address = $6, postal_address = $7, occupation = $8, employer = $9, work_address = $10, updated_at = $11 
    WHERE id = $12`
    const UPDATE_RELATIONSHIP = `UPDATE parent_student_tb SET relationship = $1 WHERE parent_id = $2`
    const FETCHPARENT = `SELECT s.id AS student_id, s.firstname AS s_firstname, s.othername AS s_othername,
    s.dob, s.spoken_languages, s.telephone, s.nationality, s.address, s.index_no, s.last_school_attended,
    s.is_new, s.photo_url, s.gender AS s_gender,
    s.lastname AS s_lastname, ps.relationship AS relationship_with_students, p.id, p.firstname, p.othername, p.gender, 
    p.phone, p.residential_address, p.postal_address, p.occupation, p.employer, p.work_address, 
    p.created_at, p.updated_at, p.lastname FROM parent_student_tb ps INNER JOIN 
    parents p ON p.id = ps.parent_id INNER JOIN students s ON s.id = ps.student_id WHERE 
    p.id = $1`
    const FETCHPARENTS_OF_STUDENT = `SELECT s.id AS student_id, s.firstname AS s_firstname, s.othername AS s_othername,
    s.dob, s.spoken_languages, s.telephone, s.nationality, s.address, s.index_no, s.last_school_attended,
    s.is_new, s.photo_url, s.gender AS s_gender,
    s.lastname AS s_lastname, ps.relationship, p.id, p.firstname, p.othername, p.gender, 
    p.phone, p.residential_address,
    p.postal_address, p.occupation, p.employer, p.work_address, 
    p.created_at, p.updated_at, p.lastname FROM parent_student_tb ps INNER JOIN 
    parents p ON p.id = ps.parent_id INNER JOIN students s ON s.id = ps.student_id WHERE 
    s.id = $1`
    const STUDENT_PARENT_REL = `SELECT * FROM parent_student_tb WHERE student_id = $1`
    const REMOVEPARENT = `DELETE FROM parents WHERE id = $1`
    const DETACHSTUDENTONPARENT = `DELETE FROM parent_student_tb WHERE student_id = $1 AND parent_id = $2`
    return {
        GETSTUDENT, GETPARENTS, SAVEPARENT, CREATE_RELATIONS, GETALLPARENTS, CHECKPARENT,
        GETPARENT, GETSTUDENTBY_PARENT, UPDATE_PARENT, UPDATE_RELATIONSHIP, FETCHPARENT, FETCHPARENTS_OF_STUDENT, REMOVEPARENT, STUDENT_PARENT_REL,
        DETACHSTUDENTONPARENT
    }
}