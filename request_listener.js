// request_listener.js

const RequestListener = (() => {
    let originalFetch = null;
    let originalXHR = null;
    let dataCallback = null;

    function startListening(callback) {
        dataCallback = callback;

        // Intercept Fetch API
        if (typeof window.fetch === 'function' && !originalFetch) {
            originalFetch = window.fetch;
            window.fetch = async function(...args) {
                const response = await originalFetch.apply(this, args);

                // Clone the response so we can read its body without affecting the original
                const clonedResponse = response.clone();

                // IMPORTANT: Your existing logic to filter relevant fetch responses goes here.
                // Example: if (args[0].includes('chart_data_endpoint')) { ... }
                // Check content type if needed
                if (clonedResponse.ok && clonedResponse.headers.get('content-type')?.includes('application/json')) {
                    try {
                        const data = await clonedResponse.text(); // Get raw text to pass to callback
                        // Pass the raw response data to the registered callback in main.js
                        if (dataCallback) {
                            dataCallback(data);
                        }
                    } catch (e) {
                        console.error('RequestListener: Error reading fetch response body:', e);
                    }
                }
                return response;
            };
            console.log('RequestListener: Fetch API interception active.');
        }

        // Intercept XMLHttpRequest
        if (typeof window.XMLHttpRequest === 'function' && !originalXHR) {
            originalXHR = window.XMLHttpRequest;
            window.XMLHttpRequest = function() {
                const xhr = new originalXHR();

                xhr.addEventListener('load', function() {
                    // IMPORTANT: Your existing logic to filter relevant XHR responses goes here.
                    // Example: if (xhr.responseURL.includes('historical_data_endpoint')) { ... }
                    if (xhr.readyState === 4 && xhr.status === 200) {
                        // Check content type if needed
                        const contentType = xhr.getResponseHeader('Content-Type');
                        if (contentType && contentType.includes('application/json')) {
                            // Pass the raw response text to the registered callback in main.js
                            if (dataCallback) {
                                dataCallback(xhr.responseText);
                            }
                        }
                    }
                });

                // Add other event listeners (error, etc.) if useful for debugging
                return xhr;
            };
            console.log('RequestListener: XMLHttpRequest interception active.');
        }
    }

    function stopListening() {
        if (originalFetch) {
            window.fetch = originalFetch;
            originalFetch = null;
            console.log('RequestListener: Fetch API interception stopped.');
        }
        if (originalXHR) {
            window.XMLHttpRequest = originalXHR;
            originalXHR = null;
            console.log('RequestListener: XMLHttpRequest interception stopped.');
        }
        dataCallback = null;
    }

    return {
        startListening: startListening,
        stopListening: stopListening,
    };
})();
