// ui.js

const UI_Manager = (() => {
    let hudContainer; // Reference to the main HUD container

    // Function to create and append the initial HUD structure
    function init() {
        if (hudContainer) return; // Prevent re-initialization

        hudContainer = document.createElement('div');
        hudContainer.id = 'axiom-token-hud';
        // Add basic styling for positioning, etc.
        hudContainer.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background-color: rgba(30, 30, 30, 0.9);
            color: #fff;
            padding: 10px;
            border-radius: 8px;
            z-index: 10000;
            font-family: sans-serif;
            font-size: 14px;
        `;

        hudContainer.innerHTML = `
            <h3>Token Stats</h3>
            <p>Market Cap: <span id="hud-marketcap">Loading...</span></p>
            <p>Volume (24h): <span id="hud-volume">Loading...</span></p>
            <p>ATH: <span id="hud-ath">Loading...</span></p>
            <button id="downloadChartDataBtn">Download Chart Data</button>
            <div id="chart-data-status"></div>
        `;

        document.body.appendChild(hudContainer);

        // Attach event listener for the download button (example)
        // This assumes main.js will provide the data for download
        // document.getElementById('downloadChartDataBtn').addEventListener('click', () => {
        //     // This click event would trigger a function in main.js or pass a signal
        //     // to get data from DataProcessor and then use Utils.downloadFile
        //     console.log('Download chart data button clicked!');
        //     // Example: You'd typically call a function passed from main.js or trigger a custom event
        //     // to ask main.js to get the data and download it.
        // });
    }

    // Function to update the HUD with new data
    function updateHUD(data) {
        if (!hudContainer) {
            init(); // Initialize if not already done (should be called from main.js)
        }

        const marketCapSpan = document.getElementById('hud-marketcap');
        const volumeSpan = document.getElementById('hud-volume');
        const athSpan = document.getElementById('hud-ath');

        if (marketCapSpan && data.marketCap) {
            marketCapSpan.textContent = data.marketCap; // Assumes data is already formatted
        }
        if (volumeSpan && data.volume) {
            volumeSpan.textContent = data.volume; // Assumes data is already formatted
        }
        if (athSpan && data.ath) {
            athSpan.textContent = data.ath; // Assumes data is already formatted
        }
    }

    // Function to update chart data status or display messages
    function updateChartDataStatus(message) {
        const statusDiv = document.getElementById('chart-data-status');
        if (statusDiv) {
            statusDiv.textContent = message;
        }
    }

    return {
        init: init,
        updateHUD: updateHUD,
        updateChartDataStatus: updateChartDataStatus,
    };
})();
