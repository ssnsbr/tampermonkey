// data_processor.js

const DataProcessor = (() => {
    let historicalChartData = []; // To store captured chart data

    // Processes raw WebSocket data
    function processWebSocketData(rawData) {
        try {
            const data = JSON.parse(rawData);

            // Log the parsed data for the rooms we care about
            // This log will only trigger for messages that pass the WebSocketListener's room filter.
            console.log('DataProcessor: Successfully parsed data for HUD update:', data);

            const marketCap = data.marketCap || data.mc || data.market_cap;
            const volume = data.volume24h || data.vol || data.volume_24h;
            const ath = data.allTimeHigh || data.ath || data.all_time_high;

            return {
                marketCap: Utils.formatNumber(marketCap, { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }),
                volume: Utils.formatNumber(volume, { style: 'currency', currency: 'USD', compact: true, minimumFractionDigits: 0, maximumFractionDigits: 2 }),
                ath: Utils.formatNumber(ath, { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            };
        } catch (e) {
            console.error('DataProcessor: Error parsing or processing WebSocket data (this message was intended for HUD):', e, 'Raw Data:', rawData);
            return {
                marketCap: '---',
                volume: '---',
                ath: '---',
            };
        }
    }

    // `processRequestData` and `getChartDataForDownload` remain as they were,
    // as they are not being called by main.js in the current setup.
    function processRequestData(rawData) {
        try {
            const data = JSON.parse(rawData);
            if (Array.isArray(data)) {
                historicalChartData = [...new Set([...historicalChartData, ...data])];
            }
            return data;
        } catch (e) {
            console.error('DataProcessor: Error parsing request data:', e, 'Raw Data:', rawData);
            return null;
        }
    }

    function getChartDataForDownload() {
        return JSON.stringify(historicalChartData, null, 2);
    }

    return {
        processWebSocketData: processWebSocketData,
        processRequestData: processRequestData,
        getChartDataForDownload: getChartDataForDownload,
    };
})();
