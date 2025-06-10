// data_processor.js
// Encapsulates logic for processing WebSocket data and maintaining state.

console.log("[DataProcessor] Initializing data_processor.js");

const dataState = {
    // Live Data (from WebSockets)
    lastPrice: 0,
    lastMarketCap: 0,
    volume24h: 0,       // Sum of transaction USD values over 24 hours
    athMarketCapSession: 0, // All-Time High Market Cap observed in current session from WS
    txs: [],            // Stores { ts: timestamp, usd: transaction_value } for 24h volume calc
    allTxData: [],      // To store all raw processed transaction data for download

    // Chart Data (from XHR/Fetch)
    chartAthMarketCap: 0 // All-Time High Market Cap calculated from historical chart data
};

/**
 * Gets the current All-Time High Market Cap from chart data.
 * @returns {number} The chart ATH Market Cap.
 */
function getChartAthMarketCap() {
    return dataState.chartAthMarketCap;
}

// Assuming a fixed total supply of 1 billion tokens for Market Cap calculation
const TOTAL_SUPPLY_BILLION = 1_000_000_000;

/**
 * Formats a number as USD with M/K suffixes or fixed decimals.
 * @param {number} num The number to format.
 * @param {number} [decimalPlaces=6] Optional: Number of decimal places for small numbers.
 * @returns {string} The formatted string.
 */
function formatUSD(num, decimalPlaces = 6) {
    if (typeof num !== 'number' || isNaN(num)) {
        return "N/A";
    }
    if (num >= 1000000) {
        return "$" + (num / 1e6).toFixed(2) + "M";
    } else if (num >= 1000) {
        return "$" + (num / 1e3).toFixed(2) + "K";
    } else if (num >= 1) {
        return "$" + num.toFixed(2); // For values between $1 and $1000
    } else {
        return "$" + num.toFixed(decimalPlaces); // For small values
    }
}

/**
 * Processes a WebSocket message and updates the live data state.
 * @param {object} content The 'content' part of the WebSocket message.
 * @param {string} tokenId The ID of the token being monitored.
 */
function processWebSocketMessage(content, tokenId) {
    // console.log("[DataProcessor] processWebSocketMessage called.");
    // console.log("[DataProcessor] Incoming content:", content);

    if (!content) {
        // console.warn("[DataProcessor] WebSocket content is null or undefined. Skipping processing.");
        return;
    }
    if (content.pair_address !== tokenId) {
        // console.warn(`[DataProcessor] Mismatched pair_address. Expected ${tokenId}, got ${content.pair_address}. Skipping processing.`);
        return;
    }
    // console.log(`%c[DataProcessor] Pair address matched: ${tokenId}`, 'color: #008080;');

    const now = Date.now();
    const price = parseFloat(content.price_usd); // Ensure price is a number
    if (isNaN(price)) {
        console.warn("[DataProcessor] Invalid price_usd received:", content.price_usd);
        return;
    }

    const marketCap = price * TOTAL_SUPPLY_BILLION;
    const transactionValueUsd = parseFloat(content.total_usd) || 0; // Ensure number

    // console.log(`[DataProcessor] Raw values: price_usd=${price}, total_usd=${transactionValueUsd}`);

    // Update 24h Volume and Transaction history
    dataState.txs.push({ ts: now, usd: transactionValueUsd });
    // Filter out old transactions for 24h volume calculation
    const oneDayAgo = now - 86400000; // 24 hours in milliseconds
    while (dataState.txs.length && dataState.txs[0].ts < oneDayAgo) {
        dataState.txs.shift();
    }
    dataState.volume24h = dataState.txs.reduce((sum, tx) => sum + tx.usd, 0);

    // Update session ATH Market Cap
    if (marketCap > dataState.athMarketCapSession) {
        dataState.athMarketCapSession = marketCap;
    }

    // Update last known price and market cap
    dataState.lastPrice = price;
    dataState.lastMarketCap = marketCap;

    // Store raw transaction data for full download
    dataState.allTxData.push({
        timestamp: new Date(now).toISOString(),
        price_usd: price,
        total_usd_transaction: transactionValueUsd,
        pair_address: content.pair_address,
        tx_hash: content.signature,
        tx_type: content.type,
        maker_address: content.maker_address,
        liquidity_sol: content.liquidity_sol,
        liquidity_token: content.liquidity_token
    });
    // console.log(`[DataProcessor] Added live transaction to allTxData. Total live txs: ${dataState.allTxData.length}`);

    // console.log(`%c[DataProcessor] Live DataState updated: Price=${formatUSD(dataState.lastPrice)}, MC=${formatUSD(dataState.lastMarketCap)}, Vol24h=${formatUSD(dataState.volume24h)}, Session ATH MC=${formatUSD(dataState.athMarketCapSession)}`, 'color: blue; font-weight: bold;');
}

/**
 * Calculates and updates the All-Time High Market Cap from collected chart bars.
 * This should be called whenever allChartBars is updated.
 * @param {Array<object>} allChartBars The array of historical chart bars.
 */
function updateChartAthMarketCap(allChartBars) {
    let maxChartMarketCap = 0;
    if (Array.isArray(allChartBars) && allChartBars.length > 0) {
        // Find the maximum 'high' price from all bars, then convert to market cap
        const maxPrice = Math.max(...allChartBars.map(bar => bar.high || 0));
        maxChartMarketCap = maxPrice * TOTAL_SUPPLY_BILLION;
    }

    // Only update if the new calculated ATH is higher
    if (maxChartMarketCap > dataState.chartAthMarketCap) {
        dataState.chartAthMarketCap = maxChartMarketCap;
        console.log(`%c[DataProcessor] Chart ATH Market Cap updated: ${formatUSD(dataState.chartAthMarketCap)}`, 'color: darkorange; font-weight: bold;');
    }
}


/**
 * Gets the current formatted data for display in the HUD.
 * @param {string} tokenId The ID of the token.
 * @returns {string} HTML string with formatted data.
 */
function getFormattedHUDData(tokenId) {
    const { lastPrice, lastMarketCap, volume24h, athMarketCapSession, chartAthMarketCap } = dataState;

    // console.log(`[DataProcessor] getFormattedHUDData called. lastPrice: ${lastPrice}`);

    if (lastPrice === 0 && volume24h === 0 && athMarketCapSession === 0 && chartAthMarketCap === 0) {
        // console.log("[DataProcessor] getFormattedHUDData returning 'Loading...' due to all zeros.");
        return `Loading live data for ${tokenId}...`;
    }

    const hudHtml = `
        <b>Token:</b> ${tokenId}<br>
        <b>Current Price:</b> ${formatUSD(lastPrice)}<br>
        <b>Live Market Cap:</b> ${formatUSD(lastMarketCap)}<br>
        <b>24h Live Volume:</b> ${formatUSD(volume24h)}<br>
        <b>Session ATH MC:</b> ${formatUSD(athMarketCapSession)}<br>
        <b>Chart ATH MC:</b> ${formatUSD(chartAthMarketCap)}
    `;
    // console.log("[DataProcessor] getFormattedHUDData returning formatted HTML.");
    return hudHtml;
}

/**
 * Gets all collected transaction data.
 * @returns {Array<object>} An array of raw transaction objects.
 */
function getAllTransactionData() {
    console.log(`[DataProcessor] Providing all live transaction data. Count: ${dataState.allTxData.length}`);
    return dataState.allTxData;
}
