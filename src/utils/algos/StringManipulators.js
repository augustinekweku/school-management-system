import slugify from "slugify"
import { Regex } from "../static/index.js"

export default function StringManipulators() {
    const { UNEXPECTED_ATTR, WHITESPACES } = Regex
    const cleanText = (string) => {
        if (typeof string === 'undefined' || string === null) return ''
        return string.trim().replace('<script>', '').replace('</script>', '')
    }
    const capitalize = (string) => {
        if (typeof string === 'undefined' || string === null) return ''
        const array = string.trim().toLowerCase().split(' ')
        const formattedString = array.map(str => `${str.charAt(0).toUpperCase()}${str.slice(1)}`)
        return cleanText(formattedString.join(' '))
    }
    const cleanSCW = (string) => {
        const format = capitalize(string.replace(UNEXPECTED_ATTR, '').replace(WHITESPACES, ' '))
        return format
    }
    const cleanExcessWhiteSpaces = (string) => {
        const format = capitalize(string.replace(WHITESPACES, ' '))
        return format
    }
    const makeSluggish = (str) => {
        const options = { lower: true, strict: true, remove: /[*+~.()'"!:@]/g, }
        return slugify(str, options)
    }
    const polishLongTexts = (string) => {
        const format = string.replace(WHITESPACES, ' ')
        return cleanText(format)
    }
    return {
        capitalize, cleanText, makeSluggish, cleanSCW, cleanExcessWhiteSpaces, polishLongTexts
    }
}