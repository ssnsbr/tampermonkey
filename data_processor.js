// data_processor.js

const DataProcessor = (() => {
    let historicalChartData = []; // To store captured chart data

    // Processes raw WebSocket data
    function processWebSocketData(rawData) {
        // console.log('DataProcessor: Received raw WebSocket data:', rawData); // Removed this log as it's too frequent

        try {
            const data = JSON.parse(rawData);
            // console.log('DataProcessor: Parsed WebSocket data:', data); // Removed this log as it's too frequent

            const marketCap = data.marketCap || data.mc || data.market_cap;
            const volume = data.volume24h || data.vol || data.volume_24h;
            const ath = data.allTimeHigh || data.ath || data.all_time_high;

            // console.log('DataProcessor: Extracted values - MarketCap:', marketCap, 'Volume:', volume, 'ATH:', ath); // Removed this log

            return {
                marketCap: Utils.formatNumber(marketCap, { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }),
                volume: Utils.formatNumber(volume, { style: 'currency', currency: 'USD', compact: true, minimumFractionDigits: 0, maximumFractionDigits: 2 }),
                ath: Utils.formatNumber(ath, { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            };
        } catch (e) {
            console.error('DataProcessor: Error parsing or processing WebSocket data:', e, 'Raw Data:', rawData);
            return {
                marketCap: '---',
                volume: '---',
                ath: '---',
            };
        }
    }

    // Processes raw data from HTTP requests (kept for future use, but not called by main.js)
    function processRequestData(rawData) {
        // console.log('DataProcessor: Received raw Request data:', rawData); // Removed this log
        try {
            const data = JSON.parse(rawData);
            // console.log('DataProcessor: Parsed Request data:', data); // Removed this log

            if (Array.isArray(data)) {
                historicalChartData = [...new Set([...historicalChartData, ...data])];
                // console.log('DataProcessor: Updated historical chart data. Total points:', historicalChartData.length); // Removed this log
            }
            return data;
        } catch (e) {
            console.error('DataProcessor: Error parsing request data:', e, 'Raw Data:', rawData);
            return null;
        }
    }

    // Provides the collected chart data for download
    function getChartDataForDownload() {
        return JSON.stringify(historicalChartData, null, 2);
    }

    return {
        processWebSocketData: processWebSocketData,
        processRequestData: processRequestData, // Still exposed, but not called by main.js
        getChartDataForDownload: getChartDataForDownload,
    };
})();
