// websocket_listener.js

const WebSocketListener = (() => {
    let originalWebSocketConstructor = null;
    let dataCallback = null;
    let allowedRooms = []; // New array to store rooms to filter by

    function startListening(roomsToAllow, callback) {
        if (typeof WebSocket === 'undefined') {
            console.warn('WebSocket is not available in this environment.');
            return;
        }

        if (originalWebSocketConstructor) {
            console.warn('WebSocketListener already started. Call stopListening first if you want to restart.');
            return;
        }

        dataCallback = callback;
        allowedRooms = Array.isArray(roomsToAllow) ? roomsToAllow : []; // Ensure it's an array
        console.log('WebSocketListener: Configured to filter for rooms:', allowedRooms);

        originalWebSocketConstructor = window.WebSocket;

        window.WebSocket = new Proxy(originalWebSocketConstructor, {
            construct(target, args) {
                const ws = new target(...args);

                ws.addEventListener('message', (event) => {
                    // --- Filtering Logic Starts Here ---
                    try {
                        const messageData = JSON.parse(event.data);
                        // Check if messageData has a 'room' property and if it's in our allowed list
                        if (messageData && messageData.room && allowedRooms.includes(messageData.room)) {
                            // If the room matches, pass the original raw event data to the callback
                            if (dataCallback) {
                                dataCallback(event.data);
                            }
                        } else {
                            // Optionally log messages that were filtered out, useful for debugging
                            // console.debug('WebSocketListener: Filtered out message from room:', messageData.room, 'Data:', messageData);
                        }
                    } catch (e) {
                        // If JSON parsing fails, it's not a message with a 'room' property (or it's malformed JSON)
                        // Decide if you want to pass these non-JSON messages or just filter them out.
                        // For now, if it's not parseable JSON, it's filtered out by default.
                        // console.warn('WebSocketListener: Could not parse WebSocket message data (likely not JSON or missing "room"). Filtering out.', event.data);
                    }
                    // --- Filtering Logic Ends Here ---
                });

                // Other event listeners (open, close, error) can remain here if useful for general debugging
                // ws.addEventListener('open', (event) => { /* ... */ });
                // ws.addEventListener('close', (event) => { /* ... */ });
                // ws.addEventListener('error', (event) => { console.error('Intercepted WebSocket error:', event.target.url, event); });

                return ws;
            }
        });

        console.log('WebSocketListener: Proxy-based interception with room filtering active.');
    }

    function stopListening() {
        if (originalWebSocketConstructor && window.WebSocket instanceof Proxy) {
            window.WebSocket = originalWebSocketConstructor;
            originalWebSocketConstructor = null;
            dataCallback = null;
            allowedRooms = []; // Clear allowed rooms on stop
            console.log('WebSocketListener: Interception stopped.');
        }
    }

    return {
        startListening: startListening,
        stopListening: stopListening,
    };
})();
