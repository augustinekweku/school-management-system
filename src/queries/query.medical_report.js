export default function MedicalReportQuery() {
    const CHECK_EXISTENCE = `SELECT * FROM medical_reports WHERE student_id = $1`
    const SAVE_REPORT = `INSERT INTO medical_reports (id, student_id, report, created_at, updated_at) 
    VALUES ($1, $2, $3, $4, $4)`
    const GETREPORT = `SELECT mr.id, mr.student_id, mr.report, mr.created_at, s.school_id, s.id AS student_id,
    s.firstname, s.othername, s.lastname, s.gender, s.index_no FROM medical_reports mr INNER JOIN 
    students s ON s.id = mr.student_id WHERE mr.id = $1`
    const GETREPORTBYSID = `SELECT mr.id, mr.student_id, mr.report, mr.created_at, mr.updated_at,
    s.firstname, s.othername, s.lastname, s.gender, s.index_no FROM medical_reports mr INNER JOIN 
    students s ON s.id = mr.student_id WHERE mr.student_id = $1`
    const UPDATE_REPORT = `UPDATE medical_reports SET report = $1, updated_at = $2 WHERE id = $3`
    const DELETE_REPORT = `DELETE FROM medical_reports WHERE id = $1`

    return {
        CHECK_EXISTENCE, SAVE_REPORT, GETREPORT, UPDATE_REPORT, GETREPORTBYSID, DELETE_REPORT
    }
}