/**
         * A class which represents a property (e.g. a building)
         */
        class SchuecoProperty {

            /**
             * Connects either to an existing property or creates a new one in the simulated environment
             * @param propertyId
             */
            constructor(propertyId) {
                this._endpoint = "ws://schuecobe5hackdays.azurewebsites.net/WebSocketServer.ashx?";
                this._webSocket = new WebSocket(this._endpoint);
                this._history = [];
                this._waitCallbacks = {};

                let self = this;

                if (!propertyId || propertyId === "") {
                    this._propertyId = 0;
                } else {
                    this._propertyId = propertyId;
                }

                this._webSocket.onmessage = function (e) {
                    let message = JSON.parse(e.data.toString());

                    if (message.type === "property_update" && message.value_name === "prop_number") {
                        self._propertyId = message.value;
                        console.log("Websocket connection to property " + self._propertyId + " is initialized.");
                    }

                    if (self._waitCallbacks[""]) {
                        self._waitCallbacks[""].forEach(o => o("", o));
                    }

                    let waitCallbacks = self._waitCallbacks[message.value_name];
                    if (waitCallbacks && waitCallbacks.length > 0) {
                        waitCallbacks.forEach(callback => callback(message, callback));
                    }

                    self._history.push({
                        timestamp: new Date(),
                        type: message.value_name,
                        payload: message
                    });

                    console.log(message);
                };

                this._webSocket.onopen = function () {
                    console.log("Websocket connection to property " + self._propertyId +
                        " is open. Sending init message...");

                    let initializeConnectionMessage = {
                        "type": "connection_request",
                        "request_type": "connect_to_prop",
                        "prop_id": self._propertyId
                    };
                    var initializeConnectionMessageJson = JSON.stringify(initializeConnectionMessage);
                    self._webSocket.send(initializeConnectionMessageJson);
                };

                this._webSocket.onclose = function () {
                    console.log("Websocket connection to property " + self._propertyId + " is closed.");
                };

                this._webSocket.onerror = function (e) {
                    console.log("Websocket error: ", e);
                };
            }

            /**
             * Registers a callback for a specific message type.
             * @param valueName The name of the sensor/value
             * @param callback f(message,callback) - The callback itself is supplied to the callback invocation so that it can remove itself if necessary
             * @return {*[]}
             */
            _registerWaitCallback(valueName, callback) {
                let callbackList = this._waitCallbacks[valueName];
                if (!callbackList) {
                    this._waitCallbacks[valueName] = [];
                }
                this._waitCallbacks[valueName].push(callback);
            }

            /**
             * Tries to set a target value and returns a promise which either succeeds when the value
             * was reached or fails when the value cannot be reached.
             * @param valueName The name of the sensor/value
             * @param value The target value
             * @return Promise A promise which either succeeds when the target value was reached or fails if the
             *                 value cannot be reached.
             */
            changeValue(valueName, value) {
                let changeMessage = {
                    "type": "set_value",
                    "value_name": valueName,
                    "value": value
                };

                var changeMessageJson = JSON.stringify(changeMessage);
                this._webSocket.send(changeMessageJson);

                return new Promise((a, r) => {
                    a();
                    // r();
                });
            }

            /**
             * Gets the history of a sensor.
             * @param valueName The name of the sensor/value
             * @return {*[]}
             */
            getHistory(valueName) {
                return this._history.filter(o => o.type === valueName);
            }

            /**
             * Gets a list of all occured value names.
             * @return {string[]}
             */
            getValueNames() {
                let map = {};
                this._history.forEach(o => map[o.payload.value_name] = null);
                return Object.keys(map);
            }
        }

        function refresh() {
            let axis = window.currentProperty.getHistory(window.chartValueName).map(entry => entry.timestamp);
            let values = window.currentProperty.getHistory(window.chartValueName).map(entry => entry.payload.value);
            // specify chart configuration item and data
            window.chart.___option = {
                title: {
                    text: window.chartValueName
                },
                tooltip: {},
                legend: {
                    data: [window.chartValueName]
                },
                xAxis: {
                    data: axis
                },
                yAxis: {},
                series: [{
                    name: window.chartValueName,
                    type: 'line',
                    data: values
                }]
            };

            window.chart = echarts.init(document.getElementById('chart'));
            // use configuration item and data specified to show chart
            window.chart.setOption(window.chart.___option);

            let valueNameSelect = document.getElementById("valueNameSelect");
            let options = window.currentProperty.getValueNames();
            valueNameSelect.innerHTML = options.map(o => {
                if (o === window.chartValueName) {
                    return "<option disabled selected value=\"\">" + o + "</option>"
                } else {
                    return "<option value=\"" + o + "\">" + o + "</option>"
                }
            });
        }

        function download() {
            let data = window.chart.___option.series[0].data;
            let encodedUri = encodeURI(window.chartValueName) + "%0A" + data.map(o => encodeURI(o)).join("%0A");
            let link = document.createElement("a");
            link.setAttribute("href", "data:application/octet-stream," + encodedUri);
            link.setAttribute("download", window.chartValueName + ".csv");
            document.body.appendChild(link); // Required for FF
            link.click(); // This will download the data file named "my_data.csv".
        }

        function chartValueNameChanged() {
            let valueNameSelect = document.getElementById("valueNameSelect");
            window.chartValueName = valueNameSelect.options[valueNameSelect.selectedIndex].value;

            let options = window.currentProperty.getValueNames();
            valueNameSelect.innerHTML = options.map(o => {
                if (o === window.chartValueName) {
                    return "<option disabled selected value=\"\">" + o + "</option>"
                } else {
                    return "<option value=\"" + o + "\">" + o + "</option>"
                }
            });

            refresh();
        }

        $(function () {
            window.currentProperty = new SchuecoProperty(221);
            window.currentProperty._registerWaitCallback("", o => refresh());
            window.chartValueName = "ambient_temperature";
        });