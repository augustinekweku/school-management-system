export default function IndexNumberGenerator() {
    const generate = (students, row_id) => {
        const rowIdLength = Number(row_id.toString().length)
        let currentYear = new Date().getFullYear() % 100
        const existingIndexNos = students.map(student => parseInt(`${student.index_no.toString().slice(rowIdLength)}`))
        const rearrange = existingIndexNos.sort((a, b) => {
            return b - a
        })

        const checkYear = rearrange.filter(item => currentYear - parseInt(item.toString().slice(1, 2)) === 1)
        let serialNumber = rearrange.length === 0 ? 1 : checkYear.length === 0 ? 1 : parseInt(rearrange[0].toString().slice(2))
        while (existingIndexNos.includes(currentYear * 1000 + serialNumber)) {
            serialNumber++
        }
        const indexNumber = currentYear * 1000 + serialNumber
        const realIndexNumber = `${row_id}${indexNumber.toString().padStart(5, '0')}`
        return realIndexNumber
    }
    return {
        generate
    }
}