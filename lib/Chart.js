class Chart {
    constructor(sensor) {
        let self = this;

        this._outerContainer = document.createElement("div");
        this._outerContainer.classList.add("row", "container", "chart-widget");

        this._chartContainer = document.createElement("div");
        this._outerContainer.appendChild(this._chartContainer);

        this._chartContainer.id = selectedSensor.name;
        this._chartContainer.style.width = '100%';
        this._chartContainer.className = 'container';
        this._chartContainer.style.height = '360px';
        this._chartContainer.style.left = '-4%';

        this._sensor = sensor;

        if (this._sensor.format.startsWith("number")) {
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
                series: [{
                    name: "",
                    type: 'line',
                    data: []
                },{
                    name: "",
                    type: 'line',
                    data: []
                }]
            };
        } else {
            console.log("Unsupported format:", this._sensor.format);
            return;
        }

        this._sensor.registerNewValueCallback(
            (sensor, timestamp, value) => self._updateOptions(self._sensor, self._sensor.property.time , value));

        this._blockNotificationsForXCycles = 0;
        this._cuttoffLength = 10;
    }

    getRandomArbitrary(min, max) {
        return Math.random() * (max - min) + min;
    }

    downloadCsv() {
        let i = 0;
        let self = this;
        let data = Object.keys(this._sensor.history).map(key => {
            return {
                x: key,
                y: this._sensor.history[key]
            };
        });
        let encodedUri = encodeURI("timestamp," + this._sensor.name) + "%0A" + data.map(o => encodeURI(o.x + "," + o.y)).join("%0A");
        let link = document.createElement("a");
        link.setAttribute("href", "data:application/octet-stream," + encodedUri);
        link.setAttribute("download", this._sensor.name + ".csv");
        link.innerText = "Download CSV";
        this._chartContainer.appendChild(link);
        link.click();
        link.remove();
    }

    _updateOptions(sensor, timestamp, value) {

        // TODO: Duplicate code
        let label = sensor.name;
        switch (label) {
            case "userdefined_double_1": label = "rain_intensity"; break;
            case "userdefined_double_2": label = "rel_humidity"; break;
            case "userdefined_double_3": label = "air_pressure";  break;
        }

        if (this._blockNotificationsForXCycles > 0) {
            this._blockNotificationsForXCycles--;
        }

        this._options.title.text = label;
        this._options.legend.data = ["prediction", label];
        this._options.series[0].name = "prediction";
        this._options.series[1].name = sensor.name;

        if(!value || !timestamp) {
            let keys = Object.keys(sensor.history);
            this._options.series[0].data = keys.map(key => sensor.history[key]);
            while(this._options.series[0].data.length > 60){
                // TODO: This is performance wise pretty evil and shitty
                this._options.series[0].data.shift();
                keys.shift();
            }
            this._options.xAxis.data = keys.map(o => o.substr(11, 5));
        } else {
            if (this._options.series[0].data.length >= this._cuttoffLength) {

                this._options.series[0].data.shift();
                this._options.series[1].data.shift();

                this._options.xAxis.data.shift();
            }

            this._options.series[0].data.push(value);
            this._options.series[1].data.push(value + this.getRandomArbitrary(-1,1.5));


            let minMax = (items) => {
                return items.reduce((acc, val) => {
                    acc[0] = ( acc[0] === undefined || val < acc[0] ) ? val : acc[0];
                    acc[1] = ( acc[1] === undefined || val > acc[1] ) ? val : acc[1];
                    return acc;
                }, []);
            };

            let threshold = 2;
            for (let i = 0; i < this._options.series[0].data.length; i++) {
                let s0 = this._options.series[0].data[i];
                if (this._options.series[1].data.length -1 >= i) {
                    let s1 = this._options.series[1].data[i];
                    let delta = Math.abs(s1 - s0);
                    if (delta > threshold && this._blockNotificationsForXCycles === 0) {
                        this._blockNotificationsForXCycles = this._cuttoffLength + 5;
                        console.log("Notification");
                    }
                }
            }

            this._options.xAxis.data.push(timestamp.toString().substr(11, 5));
        }

        if (this.chart) {
            this.chart.setOption(this._options);
        }
    }

    attach(containerId) {
        let container = document.getElementById(containerId);
        container.appendChild(this._outerContainer);
        this.chart = echarts.init(this._chartContainer);
        this._updateOptions(this._sensor);
    }
}