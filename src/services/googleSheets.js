import Papa from 'papaparse'

const SHEET_URL = import.meta.env.VITE_GOOGLE_SHEET_URL

const CACHE_KEY = 'teachers-day-collection-data'
const CACHE_DURATION = 5 * 60 * 1000

export function getCollectionData(forceRefresh = false) {
    return new Promise((resolve, reject) => {

        if (!forceRefresh) {
            const cachedData = localStorage.getItem(CACHE_KEY)

            if (cachedData) {
                const { data, timestamp } = JSON.parse(cachedData)

                const isCacheValid =
                    Date.now() - timestamp < CACHE_DURATION

                if (isCacheValid) {
                    resolve(data)
                    return
                }
            }
        }

        const requestUrl = forceRefresh
            ? `${SHEET_URL}&_t=${Date.now()}`
            : SHEET_URL

        Papa.parse(requestUrl, {
            download: true,
            header: true,
            skipEmptyLines: true,

            complete: (results) => {
                localStorage.setItem(
                    CACHE_KEY,
                    JSON.stringify({
                        data: results.data,
                        timestamp: Date.now()
                    })
                )

                resolve(results.data)
            },

            error: (error) => {
                reject(error)
            }
        })
    })
}