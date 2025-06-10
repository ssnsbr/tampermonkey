// ui.js
// This file is loaded via @require in main.js
// It exports an object 'UI' to the global scope.

(function() {
    'use strict';

    const HUD_ID = 'axiom-token-hud';
    let hudElement = null;

    const UI = {
        initHUD: function() {
            // Create the main HUD container if it doesn't exist
            hudElement = document.createElement('div');
            hudElement.id = HUD_ID;
            hudElement.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background-color: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 10px;
                border-radius: 8px;
                font-family: sans-serif;
                z-index: 9999;
                max-width: 300px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            `;
            hudElement.innerHTML = `
                <h3>Axiom Token Stats</h3>
                <p>Market Cap: <span id="hud-market-cap">Loading...</span></p>
                <p>Volume (24h): <span id="hud-volume">Loading...</span></p>
                <p>ATH: <span id="hud-ath">Loading...</span></p>
                <button id="download-chart-data" style="margin-top: 10px; padding: 5px 10px;">Download Chart Data</button>
            `;
            document.body.appendChild(hudElement);

            // Attach event listener for the download button (example)
            document.getElementById('download-chart-data').addEventListener('click', () => {
                const downloadData = DataProcessor.getCollectedChartData(); // Assuming DataProcessor stores this
                const tokenId = window.location.pathname.split('/').pop(); // Simple way to get token ID
                Utils.downloadDataAsJson(downloadData, `${tokenId}_chart_data_${new Date().toISOString().slice(0,10)}.json`);
                alert('Downloading chart data...');
            });
        },

        updateHUD: function(data) {
            // Update the HUD with new data
            if (!hudElement) return;

            const marketCapSpan = hudElement.querySelector('#hud-market-cap');
            const volumeSpan = hudElement.querySelector('#hud-volume');
            const athSpan = hudElement.querySelector('#hud-ath');

            if (data.marketCap !== undefined) {
                marketCapSpan.textContent = Utils.formatNumber(data.marketCap, 'currency');
            }
            if (data.volume !== undefined) {
                volumeSpan.textContent = Utils.formatNumber(data.volume, 'currency');
            }
            if (data.ath !== undefined) {
                athSpan.textContent = Utils.formatNumber(data.ath, 'currency');
            }
        },

        // Example function for rendering a chart (if you implement one)
        renderChart: function(chartData) {
            console.log("UI: Rendering chart with data:", chartData);
            // This is where you'd use a charting library like Chart.js or D3.js
            // Or simply display processed historical data in a simple table.
        },

        // You can add more UI-specific functions here, e.g., show/hide, error messages etc.
    };

    // Expose UI to the global scope for main.js to use
    window.UI = UI;

})();
