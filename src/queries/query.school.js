export default function SchoolQueries() {
    const SAVESCHINFO = `INSERT INTO school (user_id, name, slug, country, created_at, updated_at, id) VALUES ($1, $2, $3, $4, $5, $5, $6)`
    const GETSCHOOLBYID = `SELECT * FROM school WHERE id = $1`
    const GETSCHOOLBYACCOUNT = `SELECT * FROM school WHERE user_id = $1`
    const SETINFOS = `UPDATE school SET owner = $2, school_email = $3, motto = $4, address = $5, logo_id = $6, logo_url = $7, updated_at = $8, name = $9, country = $10 WHERE id = $1`
    const UPDATELOGO = `UPDATE school SET logo_id = $2, logo_url = $3, updated_at = $4 WHERE id = $1`
    const GETSCHOOL = `SELECT s.id AS school_id, s.name, s.slug, s.country, s.owner, s.school_email, 
    s.motto, s.address, s.logo_url, s.created_at AS school_created_at,
    s.updated_at AS school_updated_at, u.firstname AS account_firstname, u.lastname 
    AS account_lastname, u.email AS account_email, u.phone AS account_phone
    , u.gender AS account_gender FROM school s INNER JOIN users u
    ON u.id = s.user_id WHERE s.slug = $1`
    const UPDATESCHINFO = `UPDATE school SET name = $1, owner = $2, country = $3, school_email = $4, 
    motto = $5, address = $6, slug = $7, updated_at = $8 WHERE id = $9`
    const SETSCHOOLDATA = `UPDATE school SET school_email = $1, user_id = $2 WHERE id = $3`
    const REVOKESCHOOL = `DELETE FROM school WHERE id = $1`
    const GETCLASSESBYSCHOOL = `SELECT * FROM classes WHERE school_id = $1`
    const CHECKCLASS_IN_SCHOOL = `SELECT * FROM classes WHERE school_id = $1 AND id = $2`
    const GETCLASSWITHUSER_ID = `SELECT c.id, c.is_displayable, s.user_id, c.school_id, c.classname, c.shortname, c.created_at, 
    c.updated_at FROM classes c INNER JOIN school s ON s.id = c.school_id WHERE 
    c.school_id = $1`
    const PAGINATE_CLASSES = `SELECT c.id, c.school_id, c.classname, c.shortname, c.created_at, 
    c.updated_at FROM classes c WHERE c.school_id = $1 AND is_displayable = true LIMIT $2 OFFSET $3`
    const UPDATECLASSDATA = `UPDATE classes SET classname = $1, shortname = $2, updated_at = $3 WHERE id = $4`
    const DELETECLASS = `DELETE FROM classes WHERE id = $1 AND school_id = $2`
    const DELETECLASSESBYSCH_ID = `DELETE FROM classes WHERE school_id = $1`
    const CHECK_CLASS = `SELECT * FROM classes WHERE id = $1`


    const SAVEYEAR = `INSERT INTO academic_years (id, school_id, acad_year, created_at, updated_at) 
    VALUES ($1, $2, $3, $4, $4)`
    const GETAYEAR = `SELECT a.id, a.acad_year, a.created_at, a.updated_at FROM academic_years a WHERE id = $1 AND is_displayable = true`
    const CHECKYEAR = `SELECT * FROM academic_years WHERE id = $1`
    const UPDATEACADEMIC_YEAR = `UPDATE academic_years SET acad_year = $1, updated_at = $2 WHERE id = $3`
    const DELETEACADEMIC_YEAR = `DELETE FROM academic_years WHERE id = $1`
    const GETACADEMIC_YEARS = `SELECT a.id, a.acad_year, a.created_at, a.updated_at FROM academic_years a WHERE a.school_id = $1`
    const PAGINATED_ACADEMIC_YEARS = `SELECT a.id, a.acad_year, a.created_at, a.updated_at FROM academic_years a WHERE a.school_id = $1 AND is_displayable = $2 LIMIT $3 OFFSET $4`
    const CLEAR_YEARSBYSCH = `DELETE FROM academic_years WHERE school_id = $1`
    const GETALL_YEARS = `SELECT a.id, a.acad_year, a.created_at, a.updated_at FROM academic_years a WHERE a.school_id = $1`
    const GETYEARWITH_SCHOOL = `SELECT a.id AS year_id, a.acad_year, s.id AS school_id, s.user_id FROM academic_years a INNER JOIN school s ON
    a.school_id = s.id WHERE a.id = $1`
    const GETYEARSFORSEARCH = `SELECT a.id, a.acad_year, a.created_at, a.updated_at FROM academic_years a WHERE a.school_id = $1 AND is_displayable = $2`



    const REMOVE_TERMS_UNDER_YEAR = `DELETE FROM terms WHERE academic_year_id = $1`
    const SAVETERM = `INSERT INTO terms (id, name, academic_year_id, start_date, end_date, school_id, created_at, 
    updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $7) RETURNING start_date, end_date`
    const CHECKTERMIN_DB = `SELECT * FROM terms WHERE school_id = $1`
    const UPDATETERM = `UPDATE terms SET name = $1, start_date = $2, end_date = $3, updated_at = $4, status = $5 WHERE id = $6`
    const DEACTIVATE_TERMS = `UPDATE terms SET status = $1 WHERE school_id = $2`
    const CHECKTERM = `SELECT * FROM terms WHERE id = $1`
    const REMOVE_TERM = `DELETE FROM terms WHERE id = $1`
    const GETATERM = `SELECT t.id, t.name, t.start_date, t.end_date, t.status, t.academic_year_id, t.created_at,
    t.updated_at, t.is_next_term, a.acad_year FROM terms t INNER JOIN academic_years a
    ON a.id = t.academic_year_id WHERE t.id = $1 AND t.is_displayable = true`
    const PAGINATE_TERMS = `SELECT t.id, t.name, t.start_date, t.end_date, t.status, t.created_at,
    t.updated_at, t.academic_year_id, t.is_next_term, a.acad_year FROM terms t INNER JOIN academic_years a
    ON a.id = t.academic_year_id WHERE t.school_id = $1 AND t.is_displayable = true LIMIT $2 OFFSET $3`
    const CHECK_REQUIRED_ENTRIES = `SELECT
    (SELECT COUNT(*) FROM terms WHERE school_id = $1) AS t_terms,
    (SELECT COUNT(*) FROM classes WHERE school_id = $1) AS t_classes,
    (SELECT COUNT(*) FROM academic_years WHERE school_id = $1) AS t_academic_years,
    (SELECT COUNT(*) FROM subjects WHERE school_id = $1) AS t_subjects,
    (SELECT COUNT(*) FROM grading_system WHERE school_id = $1) AS t_grading_system,
    (SELECT COUNT(*) FROM immunizable_diseases WHERE school_id = $1) AS t_immunizable_diseases,
    (SELECT COUNT(*) FROM split_percentage WHERE school_id = $1) AS t_split_percentage`
    const FILTER_TERMS = `SELECT id, name, start_date, end_date, status, created_at, updated_at, is_next_term FROM terms WHERE academic_year_id = $1 AND is_displayable = true`

    const GETSUBJECTS_BY_SCHOOL = `SELECT * FROM subjects WHERE school_id = $1`
    const SAVE_SUBJECT = `INSERT INTO subjects (id, school_id, class_id, subject_code, subject_name,
        created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $6)`
    const UPDATE_SUBJECT = `UPDATE subjects SET class_id = $1, subject_code = $2, subject_name = $3, updated_at = $4 WHERE id = $5`
    const GET_SUBJECT = `SELECT s.id, c.id AS class_id, s.subject_name, s.subject_code,
    c.classname, c.shortname, s.created_at, s.updated_at FROM subjects s INNER JOIN classes c ON 
    c.id = s.class_id WHERE s.id = $1 AND is_displayable = true`
    const PAGINATE_SUBJECTS_BY_CLASS = `SELECT s.id, s.class_id, s.subject_name, s.subject_code,
    c.classname, c.shortname, s.created_at, s.updated_at FROM subjects s INNER JOIN classes c ON 
    c.id = s.class_id WHERE class_id = $1 AND s.is_displayable = true LIMIT $2 OFFSET $3`
    const PAGINATE_SUBJECTS_BY_SCHOOL = `SELECT s.id, s.class_id, s.subject_name, s.subject_code,
    c.classname, c.shortname, s.created_at, s.updated_at FROM subjects s INNER JOIN classes c ON 
    c.id = s.class_id WHERE s.school_id = $1 AND s.is_displayable = true LIMIT $2 OFFSET $3`
    const RETRIEVE_SUBJECTS_FOR_SEARCH = `SELECT s.id, s.subject_name, s.subject_code,
    c.classname, c.shortname, s.created_at, s.updated_at FROM subjects s INNER JOIN classes c ON 
    c.id = s.class_id WHERE s.school_id = $1 AND s.is_displayable = true`
    const CHECK_SUBJECT = `SELECT * FROM subjects WHERE id = $1`
    const DELETE_SUBJECT = `DELETE FROM subjects WHERE id = $1`
    const DELETE_SUBJECT_BY_CLASS = `DELETE FROM subjects WHERE class_id = $1`
    const DELETE_SUBJECT_BY_SCHOOL = `DELETE FROM subjects WHERE school_id = $1`
    // => add pagination
    const GETALLSCHOOLS = `SELECT u.id AS user_id, u.firstname, u.lastname, u.email, u.phone,
    s.id AS school_id, s.name, s.slug, s.country, s.owner, s.school_email,
    s.logo_url, s.created_at AS sch_created_at, s.updated_at AS sch_updated_at
    FROM school s INNER JOIN users u ON s.user_id = u.id`
    const GETTERMSBYSCHOOL = `SELECT t.id, t.name, t.start_date, t.end_date, t.created_at, t.updated_at FROM terms t WHERE t.school_id = $1`


    const COUNT_TERM_YEAR_ASSOC_RESOURCE = `SELECT
        (SELECT school_id FROM academic_years WHERE id = $1),
        (SELECT COUNT(*) FROM academic_years WHERE id = $1) AS resource_exists,
        (SELECT COUNT(*) FROM terms WHERE academic_year_id = $1) AS resource_shared_with_terms
    `


    return {
        SAVESCHINFO, GETSCHOOLBYID, SETINFOS, UPDATELOGO, GETSCHOOL, UPDATESCHINFO, SETSCHOOLDATA,
        GETSCHOOLBYACCOUNT, REVOKESCHOOL, GETCLASSESBYSCHOOL, GETCLASSWITHUSER_ID, UPDATECLASSDATA,
        DELETECLASS, DELETECLASSESBYSCH_ID, GETTERMSBYSCHOOL, SAVEYEAR, GETALLSCHOOLS,
        GETACADEMIC_YEARS, GETAYEAR, UPDATEACADEMIC_YEAR, DELETEACADEMIC_YEAR, PAGINATED_ACADEMIC_YEARS,
        GETYEARWITH_SCHOOL, CHECKTERMIN_DB, SAVETERM, UPDATETERM, DEACTIVATE_TERMS, REMOVE_TERM, GETATERM,
        CHECK_REQUIRED_ENTRIES, GETALL_YEARS, PAGINATE_CLASSES, PAGINATE_TERMS, CLEAR_YEARSBYSCH,
        REMOVE_TERMS_UNDER_YEAR, GETSUBJECTS_BY_SCHOOL, SAVE_SUBJECT, CHECKCLASS_IN_SCHOOL, UPDATE_SUBJECT,
        GET_SUBJECT, PAGINATE_SUBJECTS_BY_CLASS, PAGINATE_SUBJECTS_BY_SCHOOL, RETRIEVE_SUBJECTS_FOR_SEARCH,
        CHECKTERM, CHECKYEAR, CHECK_CLASS, CHECK_SUBJECT, DELETE_SUBJECT, DELETE_SUBJECT_BY_CLASS, DELETE_SUBJECT_BY_SCHOOL,
        FILTER_TERMS, COUNT_TERM_YEAR_ASSOC_RESOURCE, GETYEARSFORSEARCH
    }
}