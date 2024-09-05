export default function StudentImmunityQuery() {
    const CHECK_RECORD = `SELECT * FROM immunization_records WHERE student_id = $1 AND disease_id = $2`
    const SAVE_RECORD = `INSERT INTO immunization_records (id, student_id, disease_id, date, created_at,
    updated_at) VALUES ($1, $2, $3, $4, $5, $5) RETURNING date`
    const GETRECORD = `SELECT ir.id, s.school_id FROM immunization_records ir INNER JOIN students s
    ON ir.student_id = s.id WHERE ir.id = $1`
    const DELETE_RECORD = `DELETE FROM immunization_records WHERE id = $1`
    const GETRECORDS = `SELECT ir.id, ir.date, d.id AS disease_id, d.disease, d.description, 
    s.id AS student_id, s.firstname, s.othername, s.lastname, s.gender, s.index_no FROM 
    immunization_records ir INNER JOIN immunizable_diseases d ON d.id = ir.disease_id
    INNER JOIN students s ON s.id = ir.student_id WHERE ir.student_id = $1 LIMIT $2
    OFFSET $3`
    const FETCHRECORD = `SELECT ir.id, ir.date, d.id AS disease_id, d.disease, d.description, 
    s.id AS student_id, s.firstname, s.othername, s.lastname, s.gender, s.index_no FROM 
    immunization_records ir INNER JOIN immunizable_diseases d ON d.id = ir.disease_id
    INNER JOIN students s ON s.id = ir.student_id WHERE ir.id = $1`

    return {
        CHECK_RECORD, SAVE_RECORD, GETRECORD, DELETE_RECORD, GETRECORDS, FETCHRECORD
    }
}