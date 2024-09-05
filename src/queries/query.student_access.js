export default function StudentAccessQuery() {
    const CHECKSTUDENT = `SELECT s.password, s.index_no, s.firstname, s.othername, s.lastname, s.school_id,
    s.current_class, s.id, ss.name, ss.country, ss.motto, ss.address, ss.logo_url, ss.school_email FROM students s 
    INNER JOIN school ss ON s.school_id = ss.id WHERE index_no = $1`

    return {
        CHECKSTUDENT
    }
}