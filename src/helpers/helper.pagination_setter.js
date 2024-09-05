export default function Pagination() {
    const Setter = (params, defaultPageNumber, defaultPageDensity) => {
        const page = parseInt(params.get('page')) || parseInt(defaultPageNumber)
        const pageSize = parseInt(params.get('results-per-page')) || parseInt(defaultPageDensity)
        const offset = (page - 1) * pageSize
        return { page, pageSize, offset }
    }
    return {
        Setter
    }
}