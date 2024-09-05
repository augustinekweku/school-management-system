export default function GradingSystemQuery() {
    const RETRIEVE_GRADINGS = `SELECT id, lowest_mark, highest_mark, grade, remark, created_at, updated_at 
    FROM grading_system WHERE school_id = $1`
    const REMOVE_GRADINGS = `DELETE FROM grading_system WHERE school_id = $1`
    const UPDATE_GRADINGS = `UPDATE grading_system SET lowest_mark = $1, highest_mark = $2, grade = $3, remark = $4, updated_at = $5 WHERE id = $6`
    const ENTERSPLIT_PERCENTAGE = `INSERT INTO split_percentage (school_id, total_class_score, total_exam_score) VALUES ($1, $2, $3)`
    const CHECKSPLIT_PERCENTAGE = `SELECT total_class_score, total_exam_score FROM split_percentage WHERE school_id = $1`
    const UPDATESPLIT_PERCENTAGE = `UPDATE split_percentage SET total_class_score = $1, total_exam_score = $2 WHERE school_id = $3`

    return {
        RETRIEVE_GRADINGS, REMOVE_GRADINGS, UPDATE_GRADINGS, ENTERSPLIT_PERCENTAGE, CHECKSPLIT_PERCENTAGE, UPDATESPLIT_PERCENTAGE
    }
}