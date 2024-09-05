export default function StudentsQuery() {
    const GETSTUDENTS = `SELECT * FROM students WHERE school_id = $1`
    const SAVESTUDENT = `INSERT INTO students (id, school_id, firstname, lastname, othername,
        gender, dob, spoken_languages, telephone, nationality, address, index_no, last_school_attended,
        created_at, updated_at, is_new, photo_id, photo_url, current_class, password) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $14, $15, $16, $17, $18, $19)`
    const PAGINATED_STUDENTS = `SELECT s.id, s.firstname, s.othername, s.lastname,
    s.gender, s.dob, s.spoken_languages, s.telephone, s.nationality, s.address, s.index_no,
    s.last_school_attended, s.created_at, s.updated_at, s.photo_url, s.current_class FROM students s WHERE s.school_id = $1 ORDER BY s.index_no ASC
    LIMIT $2 OFFSET $3`
    const GETSTUDENT = `SELECT s.id, s.current_class, s.school_id, s.firstname, s.othername, s.lastname,
    s.gender, s.dob, s.spoken_languages, s.telephone, s.nationality, s.address, s.index_no,
    s.last_school_attended, s.created_at, s.updated_at, s.photo_url, s.photo_id, pi.classes FROM student_class_tb pi 
    INNER JOIN students s ON s.id = pi.student_id WHERE s.id = $1`
    const PUTSTUDENT_IN_CLASS = `INSERT INTO student_class_tb (student_id, classes) VALUES ($1, $2)`
    const UPDATE_PIVOT_TB = `UPDATE student_class_tb SET classes = $1 WHERE student_id = $2`
    const COUNT_STUDENTS = `SELECT SUM(CASE WHEN gender = $1 THEN 1 ELSE 0 END) AS total_male_students,
    SUM(CASE WHEN gender = $2 THEN 1 ELSE 0 END) AS total_female_students,
    COUNT(*) AS student_count FROM students WHERE school_id = $3
    AND gender IN ($1, $2)`
    const UPDATE_STUDENT = `UPDATE students SET firstname = $1, othername = $2, lastname = $3,
    nationality = $4, gender = $5, spoken_languages = $6, address = $7, last_school_attended = $8,
    is_new = $9, telephone = $10, dob = $11, updated_at = $12, photo_id = $13, photo_url = $14, current_class = $15 WHERE id = $16`
    const REMOVE_STUDENT = `DELETE FROM students WHERE id = $1`

    return {
        GETSTUDENTS, SAVESTUDENT, PAGINATED_STUDENTS, GETSTUDENT, PUTSTUDENT_IN_CLASS, COUNT_STUDENTS, UPDATE_STUDENT,
        UPDATE_PIVOT_TB, REMOVE_STUDENT
    }
}