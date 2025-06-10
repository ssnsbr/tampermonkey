// data_processor.js
// Encapsulates logic for processing WebSocket data and maintaining state.

console.log("[DataProcessor] Initializing data_processor.js");

const dataState = {
    ath: 0,
    volume24h: 0,
    txs: [], // Stores { ts: timestamp, usd: transaction_value }
    lastPrice: 0,
    lastMarketCap: 0,
    allTxData: [] // To store all processed transaction data for download
};

/**
 * Formats a number as USD with M/K suffixes or fixed 6 decimals.
 * @param {number} num The number to format.
 * @returns {string} The formatted string.
 */
function formatUSD(num) {
    if (num >= 1000000) {
        return (num / 1e6).toFixed(2) + "M";
    } else if (num >= 1000) {
        return (num / 1e3).toFixed(2) + "K";
    } else {
        return num.toFixed(6);
    }
}

/**
 * Processes a WebSocket message and updates the data state.
 * @param {object} content The 'content' part of the WebSocket message.
 * @param {string} tokenId The ID of the token being monitored.
 */
function processWebSocketMessage(content, tokenId) {
    console.log("[DataProcessor] processWebSocketMessage called."); // New log
    console.log("[DataProcessor] Incoming content:", content); // New log: inspect content

    if (!content) {
        console.warn("[DataProcessor] WebSocket content is null or undefined. Skipping processing."); // Refined log
        return;
    }
    if (content.pair_address !== tokenId) {
        console.warn(`[DataProcessor] Mismatched pair_address. Expected ${tokenId}, got ${content.pair_address}. Skipping processing.`); // Refined log
        return;
    }
    console.log(`%c[DataProcessor] Pair address matched: ${tokenId}`, 'color: #008080;'); // New log: successful match

    const now = Date.now();
    const price = content.price_usd;
    const marketCap = price * 1_000_000_000; // Assuming fixed supply leading to this calculation

    const transactionValueUsd = content.total_usd || 0;

    console.log(`[DataProcessor] Raw values: price_usd=${price}, total_usd=${transactionValueUsd}`); // New log

    dataState.txs.push({ ts: now, usd: transactionValueUsd });
    dataState.allTxData.push({ // Store for full download
        timestamp: new Date(now).toISOString(),
        price_usd: price,
        total_usd_transaction: transactionValueUsd,
        pair_address: content.pair_address,
        tx_hash: content.signature, // Use signature as tx_hash for consistency
        tx_type: content.type, // Renamed from tx_type in your sample to just 'type'
        // buyer_address and seller_address not in your sample, remove or clarify
        // For 'sell' or 'buy' type, you might have specific maker/taker addresses
        // Example: if type is 'buy', then maker_address could be seller, and vice-versa
        maker_address: content.maker_address,
        liquidity_sol: content.liquidity_sol,
        liquidity_token: content.liquidity_token
    });
    console.log(`[DataProcessor] Added live transaction to allTxData. Total live txs: ${dataState.allTxData.length}`);


    const oneDayAgo = now - 86400000;
    while (dataState.txs.length && dataState.txs[0].ts < oneDayAgo) {
        dataState.txs.shift();
    }

    dataState.volume24h = dataState.txs.reduce((sum, tx) => sum + tx.usd, 0);

    if (price > dataState.ath) {
        dataState.ath = price;
    }

    dataState.lastPrice = price;
    dataState.lastMarketCap = marketCap;
    console.log(`%c[DataProcessor] DataState updated: Price=$${formatUSD(dataState.lastPrice)}, MC=$${formatUSD(dataState.lastMarketCap)}, Vol24h=$${formatUSD(dataState.volume24h)}, ATH=$${formatUSD(dataState.ath)}`, 'color: blue; font-weight: bold;'); // New log: show updated state
}

/**
 * Gets the current formatted data for display in the HUD.
 * @param {string} tokenId The ID of the token.
 * @returns {string} HTML string with formatted data.
 */
function getFormattedHUDData(tokenId) {
    const { lastPrice, lastMarketCap, volume24h, ath } = dataState;

    // Log the values used to determine the display
    console.log(`[DataProcessor] getFormattedHUDData called. lastPrice: ${lastPrice}`); // New log

    if (lastPrice === 0) {
        console.log("[DataProcessor] getFormattedHUDData returning 'Loading...' due to lastPrice === 0."); // New log
        return `Loading live data for ${tokenId}...`;
    }

    const hudHtml = `
        <b>Token:</b> ${tokenId}<br>
        <b>Price:</b> $${formatUSD(lastPrice)}<br>
        <b>Market Cap:</b> $${formatUSD(lastMarketCap)}<br>
        <b>24h Volume:</b> $${formatUSD(volume24h)}<br>
        <b>ATH (session):</b> $${formatUSD(ath)}
    `;
    console.log("[DataProcessor] getFormattedHUDData returning formatted HTML."); // New log
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
