class Chart {


    constructor(sensor) {
        let self = this;

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
                }]
            };
        } else {
            console.log("Unsupported format:", this._sensor.format);
            return;
        }

        this._sensor.registerNewValueCallback(
            (sensor, timestamp, value) => self._updateOptions(self._sensor, self._sensor.property.time, value));
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

        this._options.title.text = label;
        this._options.legend.data = [label];
        this._options.series[0].name = sensor.name;

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
            if (this._options.series[0].data.length >= 60) {
                this._options.series[0].data.shift();
                this._options.xAxis.data.shift();
            }
            this._options.series[0].data.push(value);
            this._options.series[0].data.push(value);
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