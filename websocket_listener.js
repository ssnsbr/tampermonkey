// websocket_listener.js

const WebSocketListener = (() => {
    let originalWebSocket;
    let dataCallback = null;

    function startListening(callback) {
        if (typeof WebSocket === 'undefined') {
            console.warn('WebSocket is not available in this environment.');
            return;
        }

        if (originalWebSocket) {
            console.warn('WebSocketListener already started.');
            return;
        }

        dataCallback = callback; // Store the callback to send data to main.js

        // Store the original WebSocket constructor
        originalWebSocket = window.WebSocket;

        // Override the WebSocket constructor
        window.WebSocket = function(url, protocols) {
            const ws = new originalWebSocket(url, protocols);

            // Intercept messages
            ws.addEventListener('message', (event) => {
                // IMPORTANT: Your existing logic to filter relevant WebSocket messages goes here.
                // Only pass relevant data to the callback.
                // Example: if (url.includes('some_relevant_endpoint')) { ... }
                // or if (event.data.includes('some_identifying_string')) { ... }

                // Pass the raw message data to the registered callback in main.js
                if (dataCallback) {
                    dataCallback(event.data);
                }
            });

            // You can also add listeners for 'open', 'close', 'error' if needed for logging/debugging
            ws.addEventListener('open', (event) => {
                // console.log('WebSocket opened:', event.target.url);
            });
            ws.addEventListener('close', (event) => {
                // console.log('WebSocket closed:', event.target.url, event.code, event.reason);
            });
            ws.addEventListener('error', (event) => {
                console.error('WebSocket error:', event.target.url, event);
            });

            return ws; // Return the original WebSocket instance
        };

        console.log('WebSocketListener: Interception active.');
    }

    function stopListening() {
        if (originalWebSocket && window.WebSocket !== originalWebSocket) {
            window.WebSocket = originalWebSocket; // Restore original WebSocket
            originalWebSocket = null;
            dataCallback = null;
            console.log('WebSocketListener: Interception stopped.');
        }
    }

    return {
        startListening: startListening,
        stopListening: stopListening,
    };
})();
