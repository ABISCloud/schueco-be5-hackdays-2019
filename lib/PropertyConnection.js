class PropertyConnection {
    get waitCallbacks() {
        return this._waitCallbacks;
    }

    get propertyId() {
        return this._propertyId;
    }

    get time() {
        return this._time;
    }

    /**
     * Creates a websocket connection for a specific or new property.
     * @param propertyId (Optional)
     */
    constructor(propertyId) {
        if (!propertyId) {
            this._propertyId = 0;
        } else {
            this._propertyId = propertyId;
        }
        this._valueNames = {};
    }

    /**
     * Connects to the schueco api and processes incoming messages.
     * @returns A promise that resolves to the propertyId of the connected property or fails.
     */
    connect() {
        let self = this;

        return new Promise((resolve,reject) => {
            try {
                this._endpoint = "ws://192.168.1.21:7009/data";
                this._webSocket = new WebSocket(this._endpoint);
                this._waitCallbacks = {};

                this._webSocket.onmessage = function (e) {
                    let message = JSON.parse(e.data.toString());

                    if (message.value_name) {
                        self._valueNames[message.value_name] = null;
                    }

                    // Receive the init response
                    if (message.type === "property_update" && message.value_name === "userdefined_string_1") {
                        self._time = message.value;
                    }
                    if (message.type === "property_update" && message.value_name === "prop_number") {
                        self._propertyId = message.value;
                        console.log("Websocket connection to property " + self._propertyId + " is initialized.");

                        // Initialized -> resolve promise
                        resolve(self.propertyId);
                    }

                    // Process the 'all messages' callbacks if present
                    if (self._waitCallbacks[""]) {
                        self._waitCallbacks[""].forEach(o => o(message, o));
                    }

                    // Process the value_name bound callbacks if present
                    let waitCallbacks = self._waitCallbacks[message.value_name];
                    if (waitCallbacks && waitCallbacks.length > 0) {
                        waitCallbacks.forEach(callback => callback(message, callback));
                    }
                };

                this._webSocket.onopen = function () {
                    // Websocket ready, send initiaregisterCallbackl connection request
                    let initializeConnectionMessage = {
                        "type": "connection_request",
                        "request_type": "connect_to_prop",
                        "prop_id": self._propertyId
                    };
                    var initializeConnectionMessageJson = JSON.stringify(initializeConnectionMessage);
                    self._webSocket.send(initializeConnectionMessageJson);
                };
                this._webSocket.onclose = function () {
                    console.log("Connection to property" + self.propertyId + " was closed.");
                };
                this._webSocket.onerror = function (e) {
                    console.log("Error in connection to property" + self.propertyId + ":", e);
                    reject(e);
                };
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Registers a callback for a specific message type.
     * @param valueName The name of the sensor/value or "" for every message
     * @param callback f(message,callback) - The callback itself is supplied to the callback invocation so that it can remove itself if necessary
     * @return {*[]}
     */
    registerMessageCallback(valueName, callback) {
        let callbackList = this._waitCallbacks[valueName];
        if (!callbackList){
            this._waitCallbacks[valueName] = [];
        }
        this._waitCallbacks[valueName].push(callback);
    }
}