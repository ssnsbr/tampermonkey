// request_listener.js

const RequestListener = (() => {
    let originalFetch = null;
    let originalXHR = null; // Store the original XMLHttpRequest constructor
    let dataCallback = null;

    function startListening(callback) {
        dataCallback = callback;

        // Intercept Fetch API using Proxy
        if (typeof window.fetch === 'function' && !originalFetch) {
            originalFetch = window.fetch; // Store original fetch
            window.fetch = new Proxy(originalFetch, {
                async apply(target, thisArg, args) {
                    // 'target' is the original fetch function
                    // 'thisArg' is the 'this' context for fetch (usually window)
                    // 'args' are the arguments passed to 'fetch(...)'

                    const response = await Reflect.apply(target, thisArg, args); // Call the original fetch

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
                    return response; // Always return the original response so the website works normally
                }
            });
            console.log('RequestListener: Proxy-based Fetch API interception active.');
        }

        // Intercept XMLHttpRequest using Proxy
        if (typeof window.XMLHttpRequest === 'function' && !originalXHR) {
            originalXHR = window.XMLHttpRequest; // Store original XMLHttpRequest constructor

            window.XMLHttpRequest = new Proxy(originalXHR, {
                construct(target, args) {
                    // 'target' is the original XMLHttpRequest constructor
                    // 'args' are the arguments passed to 'new XMLHttpRequest(...)'

                    const xhr = new target(...args); // Create the actual XHR instance using the original constructor

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
                    // xhr.addEventListener('error', function() { /* ... */ });

                    return xhr; // Return the actual XHR instance
                }
            });
            console.log('RequestListener: Proxy-based XMLHttpRequest interception active.');
        }
    }

    function stopListening() {
        // Restore original fetch
        if (originalFetch && window.fetch instanceof Proxy) {
            window.fetch = originalFetch;
            originalFetch = null;
            console.log('RequestListener: Fetch API interception stopped.');
        }
        // Restore original XMLHttpRequest
        if (originalXHR && window.XMLHttpRequest instanceof Proxy) {
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
