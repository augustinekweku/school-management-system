export default function ContactQuery() {
    const GETALLCONTACTS = `SELECT * FROM emergency_contacts WHERE school_id = $1`
    const CHECKCONTACT = `SELECT 
    (SELECT c.id FROM emergency_contacts c WHERE id = $1 LIMIT 1) AS contact_id,
    (SELECT c.school_id FROM emergency_contacts c WHERE id = $1 LIMIT 1) AS school_id,
    (SELECT COUNT(*) FROM emergency_contact_student_tb WHERE contact_id = $1 AND student_id = $2) AS student_contact_exists,
    (SELECT relationship FROM emergency_contact_student_tb WHERE contact_id = $1 LIMIT 1) AS relationship`
    const CREATE_RELATIONSHIP = `WITH inserted_row AS (INSERT INTO emergency_contact_student_tb (contact_id, student_id, relationship)
    VALUES ($1, $2, $3)) SELECT * FROM emergency_contacts WHERE id = $1 LIMIT 1`
    const GETCONTACTS = `SELECT * FROM emergency_contact_student_tb WHERE student_id = $1`
    const SAVECONTACT = `INSERT INTO emergency_contacts (id, school_id, firstname, othername, lastname,
        phone, residential_address, postal_address, occupation, employer, work_address, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)`
    const GETCONTACT = `SELECT * FROM emergency_contacts WHERE id = $1`
    const UPDATECONTACT = `UPDATE emergency_contacts SET firstname = $1, othername = $2, lastname = $3,
    phone = $4, residential_address = $5, postal_address = $6, occupation = $7, employer = $8,
    work_address = $9, updated_at = $10 WHERE id = $11 RETURNING updated_at`
    const UPDATERELATIONSHIP = `UPDATE emergency_contact_student_tb SET relationship = $1 WHERE contact_id = $2`
    const FETCHCONTACT = `SELECT s.id AS student_id, s.firstname AS s_firstname, s.othername AS s_othername,
    s.dob, s.spoken_languages, s.telephone, s.nationality, s.address, s.index_no, s.last_school_attended,
    s.is_new, s.photo_url, s.gender,
    s.lastname AS s_lastname, cs.relationship AS relationship_with_students, c.id, c.firstname, c.othername, 
    c.phone, c.residential_address, c.postal_address, c.occupation, c.employer, c.work_address, 
    c.created_at, c.updated_at, c.lastname FROM emergency_contact_student_tb cs INNER JOIN 
    emergency_contacts c ON c.id = cs.contact_id INNER JOIN students s ON s.id = cs.student_id WHERE 
    c.id = $1`
    const FETCHCONTACTS_OF_STUDENT = `SELECT s.id AS student_id, s.firstname AS s_firstname, s.othername AS s_othername,
    s.dob, s.spoken_languages, s.telephone, s.nationality, s.address, s.index_no, s.last_school_attended,
    s.is_new, s.photo_url, s.gender,
    s.lastname AS s_lastname, cs.relationship AS relationship_with_student, c.id, c.firstname, c.othername, 
    c.phone, c.residential_address, c.postal_address, c.occupation, c.employer, c.work_address, 
    c.created_at, c.updated_at, c.lastname FROM emergency_contact_student_tb cs INNER JOIN 
    emergency_contacts c ON c.id = cs.contact_id INNER JOIN students s ON s.id = cs.student_id WHERE s.id = $1`
    const REMOVECONTACT = `DELETE FROM emergency_contacts WHERE id = $1`
    const GETSTUDENTSONCONTACT = `SELECT * FROM emergency_contact_student_tb WHERE contact_id = $1`
    const DETACHSTUDENTONCONTACT = `DELETE FROM emergency_contact_student_tb WHERE student_id = $1 AND contact_id = $2`
    return {
        GETALLCONTACTS, CHECKCONTACT, CREATE_RELATIONSHIP, GETCONTACTS, SAVECONTACT, GETCONTACT, UPDATECONTACT,
        UPDATERELATIONSHIP, FETCHCONTACT, FETCHCONTACTS_OF_STUDENT, REMOVECONTACT, GETSTUDENTSONCONTACT, DETACHSTUDENTONCONTACT
    }
}