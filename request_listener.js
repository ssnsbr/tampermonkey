// request_listener.js

const RequestListener = (() => {
    let originalFetch = null;
    let originalXHR = null;
    let dataCallback = null;

    function startListening(callback) {
        dataCallback = callback;

        // Intercept Fetch API using Proxy
        if (typeof window.fetch === 'function' && !originalFetch) {
            originalFetch = window.fetch;
            window.fetch = new Proxy(originalFetch, {
                async apply(target, thisArg, args) {
                    const url = args[0] instanceof Request ? args[0].url : String(args[0]); // Get the request URL

                    const response = await Reflect.apply(target, thisArg, args);
                    const clonedResponse = response.clone();

                    // You can add filtering here based on the URL or response headers
                    // For example, only process/log responses from specific endpoints
                    // if (!url.includes('/api/v1/some-specific-data')) {
                    //     return response; // Skip processing/logging for irrelevant requests
                    // }

                    if (clonedResponse.ok && clonedResponse.headers.get('content-type')?.includes('application/json')) {
                        try {
                            const data = await clonedResponse.text();
                            if (dataCallback) {
                                // Pass the URL along with the data
                                dataCallback(data, url);
                            }
                        } catch (e) {
                            console.error('RequestListener: Error reading fetch response body for URL:', url, e);
                        }
                    }
                    return response;
                }
            });
            console.log('RequestListener: Proxy-based Fetch API interception active.');
        }

        // Intercept XMLHttpRequest using Proxy
        if (typeof window.XMLHttpRequest === 'function' && !originalXHR) {
            originalXHR = window.XMLHttpRequest;

            window.XMLHttpRequest = new Proxy(originalXHR, {
                construct(target, args) {
                    const xhr = new target(...args);

                    xhr.addEventListener('load', function() {
                        const url = this.responseURL; // Get the response URL

                        // You can add filtering here based on the URL
                        // if (!url.includes('/api/v1/another-specific-data')) {
                        //     return; // Skip processing/logging for irrelevant XHRs
                        // }

                        if (this.readyState === 4 && this.status === 200) {
                            const contentType = this.getResponseHeader('Content-Type');
                            if (contentType && contentType.includes('application/json')) {
                                if (dataCallback) {
                                    // Pass the URL along with the data
                                    dataCallback(this.responseText, url);
                                }
                            }
                        }
                    });

                    return xhr;
                }
            });
            console.log('RequestListener: Proxy-based XMLHttpRequest interception active.');
        }
    }

    function stopListening() {
        if (originalFetch && window.fetch instanceof Proxy) {
            window.fetch = originalFetch;
            originalFetch = null;
            console.log('RequestListener: Fetch API interception stopped.');
        }
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
