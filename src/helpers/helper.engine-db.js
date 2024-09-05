import DatabaseConnection from "../config/config.db.js"

export default function DatabaseEngine() {
    const { pool } = DatabaseConnection()
    const WSWW = 'Whoops! Something went wrong'
    const ExecuteSoftDelete = async (res, id, model) => {
        try {
            const q = `UPDATE ${model} SET is_displayable = false WHERE id = '${id}' RETURNING row_id`
            const softlyRemoveResource = await pool.query(q)
            if (softlyRemoveResource.rowCount > 0) return res.status(200).json({ message: 'Resource is in use', code: '200', data: {} })
            return res.status(412).json({ message: 'Action failed', code: '412', data: {} })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }
    const FilterSoftDeletedItems = (dbResult) => {
        const displayableData = dbResult.filter(obj => obj.is_displayable)
        return displayableData
    }

    return {
        ExecuteSoftDelete, FilterSoftDeletedItems
    }
}