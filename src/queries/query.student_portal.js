export default function StudentPortalQuery() {
    const GETTERMS = `SELECT t.id, t.name, t.start_date, t.end_date, t.status, t.academic_year_id, t.is_next_term, ay.acad_year FROM terms t
    INNER JOIN academic_years ay ON t.academic_year_id = ay.id WHERE t.school_id = $1 AND ay.is_displayable = true AND t.is_displayable = true`
    const GETSTUDENT = `SELECT s.id, s.firstname, s.othername, s.lastname, s.current_class,
    s.gender, s.dob, s.spoken_languages, s.telephone, s.nationality, s.address, s.index_no,
    s.last_school_attended, s.created_at, s.updated_at, s.photo_url, s.photo_id, c.classes FROM student_class_tb c 
    INNER JOIN students s ON s.id = c.student_id WHERE s.id = $1`
    const GETSTUDENTFORUPDATE = `SELECT s.id, s.firstname, s.othername, s.lastname, s.current_class,
    s.gender, s.dob, s.spoken_languages, s.telephone, s.nationality, s.address, s.index_no,
    s.last_school_attended, s.created_at, s.updated_at, s.photo_url, s.password, s.photo_id, c.classes FROM student_class_tb c 
    INNER JOIN students s ON s.id = c.student_id WHERE s.id = $1`

    const UPDATEPASSWORD = `UPDATE students SET password = $1, updated_at = $2 WHERE id = $3`
    const UPDATEPASSPORTPHOTO = `UPDATE students SET photo_id = $1, photo_url = $2, updated_at = $3 WHERE id = $4`
    const ACCOUNTSETTINGS = `UPDATE students SET photo_id = $1, photo_url = $2, password = $3, updated_at = $4 WHERE id = $5`
    const GETSTUDENTCLASSES = `SELECT classes FROM student_class_tb WHERE student_id = $1`
    const VERIFYTERM = `SELECT COUNT(id) AS term_presence FROM terms WHERE id = $1 AND school_id = $2 AND is_displayable = true`
    const GETGRADINGSYSTEM = `SELECT id, lowest_mark, highest_mark, grade, remark FROM grading_system WHERE school_id = $1`
    const GETSPLITPERCENTAGE = `SELECT total_class_score, total_exam_score FROM split_percentage WHERE school_id = $1`
    const GETSUBJECTSINCLASS = `SELECT id, subject_name, subject_code FROM subjects WHERE class_id = $1 AND is_displayable = true`


    return {
        GETTERMS, GETSTUDENT, UPDATEPASSWORD, UPDATEPASSPORTPHOTO, ACCOUNTSETTINGS, GETSTUDENTFORUPDATE,
        GETSTUDENTCLASSES, VERIFYTERM, GETGRADINGSYSTEM, GETSPLITPERCENTAGE, GETSUBJECTSINCLASS
    }
}