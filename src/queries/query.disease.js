export default function DiseaseQuery() {
    const CHECK_EXISTENCE = `SELECT * FROM immunizable_diseases WHERE school_id = $1 AND disease = $2`
    const SAVE_DISEASE = `INSERT INTO immunizable_diseases (id, school_id, disease, description, created_at, updated_at) 
    VALUES ($1, $2, $3, $4, $5, $5)`
    const GETDISEASE = `SELECT * FROM immunizable_diseases WHERE id = $1`
    const UPDATE_DISEASE = `UPDATE immunizable_diseases SET disease = $1, description = $2, updated_at = $3 WHERE id = $4 RETURNING created_at`
    const REMOVE_DISEASE = `DELETE FROM immunizable_diseases WHERE id = $1`
    const PAGINATE_DISEASES = `SELECT id, disease, description, created_at, updated_at FROM 
    immunizable_diseases WHERE school_id = $1 AND is_displayable = $2 LIMIT $3 OFFSET $4`
    const CHECK_RESOURCE_INUSE = `SELECT COUNT(id) AS resource_in_use FROM immunization_records WHERE disease_id = $1`
    const GET_DISEASES_FOR_SEARCH = `SELECT disease, description FROM immunizable_diseases WHERE school_id = $1 AND is_displayable = $2`
    return {
        CHECK_RESOURCE_INUSE, CHECK_EXISTENCE, SAVE_DISEASE, GETDISEASE, UPDATE_DISEASE, REMOVE_DISEASE, PAGINATE_DISEASES, GET_DISEASES_FOR_SEARCH
    }
}