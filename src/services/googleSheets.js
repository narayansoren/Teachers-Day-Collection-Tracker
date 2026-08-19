import Papa from 'papaparse'

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTI_AXiz8-fie7T66clYCFmk5SRjvKjGIuzUz4wJYPS0E-3gAP3klDAUTGZO6XUhtFvS3YnMsPMSitg/pub?output=csv"

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