export default function MedicalInformationQuery() {
    const CHECK_EXISTENCE = `SELECT * FROM medical_information WHERE student_id = $1`
    const SAVE_MEDICAL_INFO = `WITH inserted_row AS (INSERT INTO medical_information (id, student_id, pediatrician,
    telephone, previous_diseases, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $6))
    SELECT s.id, s.firstname, s.othername, s.lastname, s.index_no FROM students s WHERE id = $2 LIMIT 1`
    const GETMEDICAL_BY_ID = `SELECT mi.id, s.id AS student_id, s.school_id, mi.created_at, mi.updated_at,
    mi.pediatrician, mi.telephone, mi.previous_diseases, s.firstname, s.othername, 
    s.lastname, s.index_no FROM medical_information mi INNER JOIN students s ON 
    s.id = mi.student_id WHERE mi.id = $1`
    const UPDATE_INFO = `UPDATE medical_information SET pediatrician = $1, telephone = $2, previous_diseases = $3, updated_at = $4 WHERE id = $5`
    const GETINFO_BY_SID = `SELECT mi.id, s.id AS student_id, mi.created_at, mi.updated_at,
    mi.pediatrician, mi.telephone, mi.previous_diseases, s.firstname, s.othername, 
    s.lastname, s.index_no, s.gender FROM medical_information mi INNER JOIN students s ON 
    s.id = mi.student_id WHERE s.id = $1`
    const REMOVE_INFO = `DELETE FROM medical_information WHERE id = $1`

    return {
        CHECK_EXISTENCE, SAVE_MEDICAL_INFO, GETMEDICAL_BY_ID, UPDATE_INFO, GETINFO_BY_SID, REMOVE_INFO
    }
}