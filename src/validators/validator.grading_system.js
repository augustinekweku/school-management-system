import { Regex } from "../utils/static/index.js"

export default function GradingSystemValidations() {
    const { MONGOOBJECT, ALPHA, DECIMAL_NUM } = Regex
    const verifyOverlaps = (array) => {
        const isOverlapping = (range_1, range_2) => {
            const low_range_1 = parseFloat(range_1.lowest)
            const high_range_1 = parseFloat(range_1.highest)
            const low_range_2 = parseFloat(range_2.lowest)
            const high_range_2 = parseFloat(range_2.highest)
            return !(high_range_1 < low_range_2 || low_range_1 > high_range_2)
        }
        for (let i = 0; i < array.length; i++) {
            for (let j = i + 1; j < array.length; j++) {
                if (isOverlapping(array[i], array[j])) {
                    return false
                }
            }
        }
        return true // true means no-overlap
    }
    const gradingSystemValidations = (data, next) => {
        const { school_id, grading_system } = data
        if (!school_id.match(MONGOOBJECT)) return { error: 'Bad request' }
        if (grading_system.length < 6 || grading_system.length > 9) return { error: 'Enter all grades, A-F or A1-F9' }
        const acceptableKeys = ['grade', 'lowest_mark', 'highest_mark', 'remark']
        if (!grading_system.every(obj => acceptableKeys.every(prop => prop in obj))) return { error: 'Inappropriate data representation' }
        const gradesArray = [...new Set(grading_system.map(grade => grade.grade))]
        if (gradesArray.length !== grading_system.length) return { error: 'Grade repetition found' }
        const lowestMarksArray = [...new Set(grading_system.map(grade => parseInt(grade.lowest_mark.toString())))]
        const highestMarkArray = [...new Set(grading_system.map(grade => parseInt(grade.highest_mark.toString())))]
        if (lowestMarksArray.length !== grading_system.length ||
            highestMarkArray.length !== grading_system.length
        ) return { error: 'Incorrect grading system' }
        if (!lowestMarksArray.includes(0)) return { error: 'Incomplete grading system. Expecting a lowest mark of 0' }
        if (!highestMarkArray.includes(100)) return { error: 'Incomplete grading system. Expecting a highest mark of 100' }
        const rangeList = grading_system.map(item => ({ lowest: item.lowest_mark.toString(), highest: item.highest_mark.toString() }))
        const checkOverlaps = verifyOverlaps(rangeList)
        if (!checkOverlaps) return { error: 'Overlapping grades detected' }
        // check margins around the ranges
        let marginsPresent = false
        const sortedGradingSystem = grading_system.sort((a, b) => a.lowest_mark - b.lowest_mark)
        for (let i = 0; i < sortedGradingSystem.length - 1; i++) {
            const currentObj = sortedGradingSystem[i]
            const nextObj = sortedGradingSystem[i + 1]
            if (nextObj.lowest_mark - currentObj.highest_mark !== 1) {
                marginsPresent = true
                break
            }
        }
        if (marginsPresent) return { error: 'Grading system fails to capture some possible marks' }
        let statement = ''
        const possibleGrades = [
            "1",
            "a",
            "a1",
            "2",
            "b",
            "b2",
            "3",
            "b3",
            "c",
            "4",
            "c4",
            "6",
            "5",
            "d",
            "d7",
            "7",
            "e",
            "e8",
            "8",
            "9",
            "f",
            "f9"
        ]

        for (let j = 0; j < grading_system.length; j++) {
            const item = grading_system[j]
            const grade = item['grade']
            const remark = item['remark']
            if (!item['lowest_mark'].toString().match(DECIMAL_NUM) || !item['highest_mark'].toString().match(DECIMAL_NUM)) {
                statement = 'Invalid grades found'
                break
            }
            if (!remark.match(ALPHA)) {
                statement = 'Incorrect remarks assigned'
                break
            }
            if (!possibleGrades.includes(grade.toLowerCase())) {
                statement = 'Incorrect grades'
                break
            }
        }
        if (statement.length > 0) return { error: statement }
        next()
    }
    return {
        gradingSystemValidations
    }
}