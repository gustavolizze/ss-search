const deburr = require("lodash/deburr")
const escapeRegExp = require("lodash/escapeRegExp")
const memoize = require("lodash/memoize")
const get = require("lodash/get")

export function normalize(text: string) {
    return deburr(text)
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase()
        .trim()
}

export function tokenize(searchText: string): string[] {
    return normalize(escapeRegExp(searchText)).match(/\w+/gim) || []
}

export const convertToSearchableStrings = memoize((elements: any[], searchableKeys: string[]) => {
    if (!elements || elements.length === 0 || !searchableKeys || searchableKeys.length === 0) {
        return []
    }

    const arraySelectorRegex = /\[(.*)\]/
    return elements
        .map((element) =>
            searchableKeys
                .map((key) => {
                    const arraySelector = get(arraySelectorRegex.exec(key), "1")

                    const value = get(element, key.replace(arraySelectorRegex, ""))
                    if (!arraySelector && (value === null || value === undefined || typeof value === "function")) {
                        return ""
                    }

                    if (arraySelector) {
                        return value.map((x: any) => get(x, arraySelector))
                    }

                    if (Array.isArray(value) || typeof value === "object") {
                        return JSON.stringify(value)
                    }

                    return value
                })
                .reduce((a, b) => a + b, ""),
        )
        .map((x) => normalize(x))
})

export function search<T>(elements: T[], searchableKeys: string[], searchText: string) {
    const searchWords = tokenize(searchText)

    const searchableDataStrings: string[] = convertToSearchableStrings(elements, searchableKeys)

    return searchableDataStrings
        .map((x, i) => {
            const matchesAllSearchWords = searchWords.filter((searchWord) => x.indexOf(searchWord) > -1).length === searchWords.length
            return matchesAllSearchWords ? elements[i] : null
        })
        .filter((x) => x)
}
