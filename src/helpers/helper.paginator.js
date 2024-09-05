import DatabaseConnection from "../config/config.db.js"

export default function PaginationParams() {
    const { pool } = DatabaseConnection()
    const getPageParams = async (pageSize, model, conditions) => {
        const query = `SELECT total_count,
            CEIL(total_count::float / ${pageSize}) AS total_pages
                FROM (
                    SELECT COUNT(*) AS total_count
                FROM ${model} ${conditions.length > 0 ? `WHERE ${conditions}` : ''}
            ) AS subquery`
        try {
            const countResult = await pool.query(query)
            return {
                totalCount: parseInt(countResult.rows[0].total_count),
                totalPages: countResult.rows[0].total_pages
            }
        } finally {
            console.log('finally')
        }
    }
    const localPaginator = (array, resultPerPage, pageNumber) => {
        const startIndex = (pageNumber - 1) * resultPerPage
        const endIndex = startIndex + resultPerPage
        const paginatedArray = array.slice(startIndex, endIndex)
        const totalPages = Math.ceil(array.length / resultPerPage)
        return {
            search_results: paginatedArray,
            total_pages: totalPages,
            total_items: array.length
        }
    }
    return {
        getPageParams, localPaginator
    }
}