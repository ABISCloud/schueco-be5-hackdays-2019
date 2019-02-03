class Chart {
    constructor(sensors, notificationCallback) {
        let self = this;
        this.notificationCallback = notificationCallback;

        this._outerContainer = document.createElement("div");
        this._outerContainer.classList.add("chart-widget");

        this._headerContainer = document.createElement("span");
        this._headerContainer.className = "downloadWrapper";
        this._headerContainer.style.position = "relative";
        this._headerContainer.style.top = "25px";
        this._headerContainer.style.left = "85%";
        this._headerContainer.style.letterSpacing = "2px";
        this._headerContainer.style.zIndex = "999";
        this._headerContainer.style.height = "33px";
        this._headerContainer.style.fontSize = "12px";
        this._headerContainer.style.padding = "8px";
        this._headerContainer.style.background = "#78b928";
        this._headerContainer.style.color = "#f5f5f5";

        this._outerContainer.appendChild(this._headerContainer);

        this._chartContainer = document.createElement("div");
        this._outerContainer.appendChild(this._chartContainer);

        this._downloadLink = document.createElement("a");
        this._headerContainer.appendChild(this._downloadLink);

        this._headerContainer.appendChild(document.createTextNode(" | "));

        this._downloadLink.innerText = "Download";
        this._downloadLink.innerHTML = "<i style='font-size:1.4em;' class='fas fa-download'></i>";
        this._downloadLink.style.cursor = "pointer";
        this._downloadLink.onclick = (e) => {
            self.downloadCsv();
        };

        this._closeLink = document.createElement("a");
        this._headerContainer.appendChild(this._closeLink);

        this._closeLink.innerHTML = "<i style='font-size:1.4em;' class='far fa-times-circle'>";
        this._closeLink.style.color = "red";
        this._closeLink.style.cursor = "pointer";
        this._closeLink.style["font-weight"] = "bold";
        this._closeLink.onclick = (e) => {
            self._outerContainer.remove();
        };

        this._chartContainer.id = selectedSensor.name;
        this._chartContainer.style.width = '100%';
        this._chartContainer.className = 'container';
        this._chartContainer.style.height = '360px';
        this._chartContainer.style.padding = 'unset';

        this._sensors = sensors;

        this._options = {
            title: {
                text: ""
            },
            tooltip: {},
            legend: {
                data: []
            },
            xAxis: {
                data: []
            },
            yAxis: {},
            series: []
        };

        this._sensors.forEach(sensor => {
            this._options.legend.data.push(sensor.name);
            this._options.series.push(
            {
                name: sensor.name,
                type: 'line',
                data: []
            });
        });

        this._sensors.registerNewValueCallback(
            (sensor, timestamp, value) => self._updateOptions(self._sensor, self._sensor.property.time, value));

        this._blockNotificationsForXCycles = 0;
        this._cuttoffLength = 10;
    }

    getRandomArbitrary(min, max) {
        return Math.random() * (max - min) + min;
    }

    downloadCsv() {
        let i = 0;
        let self = this;
        let data = Object.keys(this._sensors.history).map(key => {
            return {
                x: key,
                y: this._sensors.history[key]
            };
        });
        let encodedUri = encodeURI("timestamp," + this._sensors.name) + "%0A" + data.map(o => encodeURI(o.x + "," + o.y)).join("%0A");
        let link = document.createElement("a");
        link.setAttribute("href", "data:application/octet-stream," + encodedUri);
        link.setAttribute("download", this._sensors.name + ".csv");
        link.innerText = "Download CSV";
        this._chartContainer.appendChild(link);
        link.click();
        link.remove();
    }

    setIntersection(a, b) {
        var setA = new Set(a);
        var setB = new Set(b);
        var intersection = new Set([...setA].filter(x => setB.has(x)));
        return Array.from(intersection);
    }

    setUnion (...sets) {
        let X = new Set();
        sets.forEach( S => S.forEach( e => X.add(e)));
        return X;
    };


    _updateOptions(sensor, timestamp, value) {

        // Find the series that corresponds to the sensor
        let series = this._options.series.filter(series => series.name === sensor.name);
        if (series.length !== 1) {
            return;
        }

        if (!value || !timestamp) {
            // Not an update, but a initialization.
            // Fill the chart from the sensor's history.
            series.data = [];
            let xAxisValues = new Set();

            let keys = Object.keys(sensor.history);
            for(let i = keys.length - 1; i > -1; i--) {
                if (keys.length - 1 - i > this._cuttoffLength) {
                    break;
                }
                series.data.unshift(sensor.history[keys[i]]);
                xAxisValues.unshift(keys[i].substr(11, 5));
            }

            let existingXAxis = new Set(this._options.xAxis.data);
            let unionAxis = this.setUnion(xAxisValues, existingXAxis);
            this._options.xAxis.data = Array.from(unionAxis);

            console.log("Existing axis: ", existingXAxis);
            console.log("New axis: ", xAxisValues);
            console.log("Union axis: ", unionAxis);

        } else {
            // Regular update.
            // Push the new data to the series
            while (series.data.length >= this._cuttoffLength) {
                series.data.shift();
            }
            while (this._options.xAxis.data.length >= this._cuttoffLength) {
                this._options.xAxis.data.shift();
            }
            series.data.push(value);
        }

        // TODO: Duplicate code
        let label = sensor.name;

        if (this._blockNotificationsForXCycles > 0) {
            this._blockNotificationsForXCycles--;
        }

        this._options.title.text = label;
        if(this.notificationCallback) {
            this._options.legend.data = ["prediction", label];
            this._options.series[0].name = "prediction";
            this._options.series[1].name = sensor.name;
        } else {
            this._options.legend.data = [label];
            this._options.series[0].name = label;
        }

        if (!value || !timestamp) {
            let keys = Object.keys(sensor.history);
            this._options.series[0].data = keys.map(key => sensor.history[key]);
            while (this._options.series[0].data.length > this._cuttoffLength) {
                // TODO: This is performance wise pretty evil and shitty
                this._options.series[0].data.shift();
                keys.shift();
            }
            this._options.xAxis.data = keys.map(o => o.substr(11, 5));
        } else {

            if (this._options.series[0].data.length >= this._cuttoffLength) {
                this._options.series[0].data.shift();
                this._options.xAxis.data.shift();

                if (this.notificationCallback) {
                    this._options.series[1].data.shift();
                }
            }

            this._options.series[0].data.push(value);
            this._options.xAxis.data.push(timestamp.toString().substr(11, 5));

            if (this.notificationCallback) {
                this._options.series[1].data.push(value + this.getRandomArbitrary(-1, 1.5));
            }

            if (this.notificationCallback) {
                let threshold = 2;
                for (let i = 0; i < this._options.series[0].data.length; i++) {
                    let s0 = this._options.series[0].data[i];
                    if (this._options.series[1].data.length - 1 >= i) {
                        let s1 = this._options.series[1].data[i];
                        let delta = Math.abs(s1 - s0);
                        if (delta > threshold && this._blockNotificationsForXCycles === 0) {
                            this._blockNotificationsForXCycles = this._cuttoffLength + 5;
                            console.log("Notification");
                            if (this.notificationCallback) {
                                this.notificationCallback(sensor);
                            }
                        }
                    }
                }
            }
        }

        if (this.chart) {
            this.chart.setOption(this._options);
        }
    }

    attach(containerId) {
        let container = document.getElementById(containerId);
        container.appendChild(this._outerContainer);
        this.chart = echarts.init(this._chartContainer);
        this._updateOptions(this._sensors);
    }
}