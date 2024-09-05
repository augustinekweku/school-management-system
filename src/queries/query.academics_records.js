export default function AcademicRecordQuery() {
    const GETSCHOOLBYUSER = `SELECT id AS school_id FROM school WHERE user_id = $1`
    const GETADMINREQUIREMENT = `SELECT c.id AS class_id, c.classname, c.shortname, s.subject_name, 
    s.subject_code, s.id AS subject_id FROM subjects s INNER JOIN
    classes c ON s.class_id = c.id WHERE c.school_id = $1`
    const GETSTAFF = `SELECT staff_type, accessible_subjects, school_id FROM staff WHERE user_id = $1`
    const GETSCHOOLBYCLASS = `SELECT id, classname, shortname, school_id FROM classes WHERE id = $1`
    const GETCLASSANDSUBJECTCORRELATION = `SELECT COUNT(s.id) AS class_has_subj FROM subjects s INNER JOIN classes c ON
    c.id = s.class_id WHERE s.id = $1 AND c.id = $2`
    const GETSTUDENTSINCLASS = `SELECT id, firstname, othername, lastname, index_no FROM students WHERE current_class = $1 LIMIT $2 OFFSET $3`
    const GETGRADINGSYSTEM = `SELECT id, lowest_mark, highest_mark, grade, remark FROM grading_system WHERE school_id = $1`
    const GETSPLITPERCENTAGE = `SELECT total_class_score, total_exam_score FROM split_percentage WHERE school_id = $1`
    const GETEXISTINGRECORD = `SELECT * FROM academic_records WHERE id = $1`
    const SAVERECORD = `INSERT INTO academic_records (id, student_id, term_id, subject_id, class_score_num, class_score_denom,
        exam_score_num, exam_score_denom, feedback, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10) RETURNING id`
    const GETRESULT = `SELECT ar.id, ar.class_score_num, ar.class_score_denom, ar.exam_score_num,
        ar.exam_score_denom, ar.feedback, ar.created_at, ar.updated_at,
        ss.firstname, ss.othername, ss.lastname, ss.index_no, ss.id AS student_id,
        t.name, ay.acad_year, s.subject_code, s.subject_name FROM academic_records ar INNER JOIN
        students ss ON ss.id = ar.student_id INNER JOIN terms t ON 
        t.school_id = ss.school_id INNER JOIN subjects s ON s.id = ar.subject_id 
        INNER JOIN academic_years ay ON ay.id = t.academic_year_id WHERE ar.id = $1 AND s.is_displayable = true LIMIT 1`
    const UPDATERECORD = `UPDATE academic_records SET term_id = $1, subject_id = $2, class_score_num = $3, class_score_denom = $4, exam_score_num = $5, exam_score_denom = $6, feedback = $7, updated_at = $8 WHERE id = $9`
    const GETACTIVETERM = `SELECT status FROM terms WHERE id = $1 AND is_displayable = true`
    const GETSTUDENTANDSUBJECTCORRELATION = `
        SELECT COUNT(s.id) AS class_has_subj FROM subjects s INNER JOIN classes c ON
        c.id = s.class_id INNER JOIN students ss ON ss.current_class = c.id WHERE 
        s.id = $1 AND ss.id = $2 AND s.is_displayable = true
    `
    const GETSCHFORVERIFICATION = `SELECT
        (SELECT school_id FROM terms WHERE id = $1 AND is_displayable = true) AS t_school_id,
        (SELECT school_id FROM students WHERE id = $2) AS s_school_id,
        (SELECT school_id FROM subjects WHERE id = $3 AND is_displayable = true) AS subj_school_id
    `
    const GETSCHBYRESULTID = `SELECT s.school_id, r.subject_id FROM academic_records r INNER JOIN students s
    ON s.id = r.student_id WHERE r.id = $1`
    const REMOVERECORD = `DELETE FROM academic_records WHERE id = $1`
    const GETTERMLIST = `SELECT a.id AS academic_year_id, a.acad_year, t.status, t.name, t.id FROM
    terms t INNER JOIN academic_years a ON t.academic_year_id = a.id WHERE
    a.is_displayable = true AND a.school_id = $1 AND t.is_displayable = true`
    const CHECKRESULTEXISTENCE = `SELECT COUNT(*) AS result_exists FROM academic_records WHERE student_id = $1 AND term_id = $2 AND subject_id = $3`
    return {
        GETSCHOOLBYUSER, GETADMINREQUIREMENT, GETSTAFF, GETSCHOOLBYCLASS, GETCLASSANDSUBJECTCORRELATION,
        GETSTUDENTSINCLASS, GETGRADINGSYSTEM, GETSPLITPERCENTAGE, GETEXISTINGRECORD, SAVERECORD,
        GETRESULT, UPDATERECORD, GETACTIVETERM, GETSTUDENTANDSUBJECTCORRELATION, GETSCHFORVERIFICATION,
        GETSCHBYRESULTID, REMOVERECORD, CHECKRESULTEXISTENCE, GETTERMLIST
    }
}