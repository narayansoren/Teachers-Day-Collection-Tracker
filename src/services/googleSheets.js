import Papa from 'papaparse'

const SHEET_URL = import.meta.env.VITE_GOOGLE_SHEET_URL

export function getCollectionData() {
    return new Promise((resolve, reject) => {
        Papa.parse(SHEET_URL, {
            download: true,
            header: true,
            skipEmptyLines: true,

            complete: (results) => {
                resolve(results.data)
            },

            error: (error) => {
                reject(error)
            }
        })
    })
}