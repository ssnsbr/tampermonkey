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

        dataCallback = callback;

        // Store the original WebSocket constructor
        originalWebSocket = window.WebSocket;

        // Override the WebSocket constructor
        window.WebSocket = new Proxy(originalWebSocket, {
            construct(target, args) {
                // This ensures the original constructor is called with the correct 'this' context
                const ws = new target(...args);

                // Intercept messages
                ws.addEventListener('message', (event) => {
                    // Your existing logic to filter relevant WebSocket messages goes here.
                    if (dataCallback) {
                        dataCallback(event.data);
                    }
                });

                // Add other event listeners (open, close, error) if useful
                ws.addEventListener('open', (event) => {
                    // console.log('WebSocket opened:', event.target.url);
                });
                ws.addEventListener('close', (event) => {
                    // console.log('WebSocket closed:', event.target.url, event.code, event.reason);
                });
                ws.addEventListener('error', (event) => {
                    console.error('WebSocket error:', event.target.url, event);
                });

                return ws;
            }
        });

        console.log('WebSocketListener: Interception active.');
    }

    function stopListening() {
        if (originalWebSocket && window.WebSocket instanceof Proxy) { // Check if it's our proxy
            window.WebSocket = originalWebSocket;
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
