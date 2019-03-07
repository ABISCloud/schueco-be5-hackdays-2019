let property = null;
let time = null;
let chartArea = null;
let valueNameSelect = null;
let selectedSensorName = null;
let selectedSensor = null;

let messages = {
    "rel_humidity":{

    },
    "moisture_level":{

    },
    "noise":{

    }
};

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

$(() => {
    property = new Property(221);
    time = document.getElementById("time");
    chartArea = document.getElementById("chartArea");
    valueNameSelect = document.getElementById("valueNameSelect");
    selectedSensorName = null;
    selectedSensor = null;

    function updateSensorDropDown() {
        let options = Object.keys(property.sensors);
        valueNameSelect.innerHTML = options.map(o => {
            // TODO: Duplicate code
            let label = o;
            if (o === selectedSensorName) {
                return "<option disabled selected value=\"\">" + label + "</option>"
            } else {
                return "<option value=\"" + o + "\">" + label + "</option>"
            }
        });
        // Set a default value for the dropdown
        if (!selectedSensorName) {
            selectedSensorName = options.length > 0 ? options[0] : null;
            selectedSensor = property.sensors[selectedSensorName];
        }
    }

    valueNameSelect.onchange = (e) => {
        selectedSensorName = valueNameSelect.options[valueNameSelect.selectedIndex].value;
        selectedSensor = property.sensors[selectedSensorName];
        updateSensorDropDown();
    };

    let moistureChart = null;
    let humidChart = null;
    let tempChart = null;

    let notificationSensorStatus = "1";
    let indicatorEl = document.getElementsByClassName('liveIndicator')[0];

    property.connect(() => {
        updateSensorDropDown();

        setTimeout(() => {
            if (!moistureChart) {
                moistureChart = new Chart(property.sensors['moisture_level'], (notificationSensor, diff) => {
                    // alert(notificationSensor.name + " reported an issue");

                    if (diff < 0) {
                        notificationSensorStatus = '2';
                    } else if (diff > 0) {
                        notificationSensorStatus = '3';
                    }

                    $(".panel-collapse").collapse("show");

                    setTimeout(() => {
                        let mapframe = document.getElementById('mapframe');
                        mapframe.src = "https://dbianalytics.github.io/schueco-be5-hackdays-2019/bim/examples/gltf.html";

                        //selectionChanged(window.bimSurfer, '47#product-6b61ce71-1a7a-473c-8f87-4262e0bdb448-body.entity.0.0', Utils);
                    }, 5000)
                });
                moistureChart.attach(chartArea.id);
            }

            if (!humidChart) {
                humidChart = new Chart(property.sensors['light'], null, 'light');
                humidChart.attach(chartArea.id);
            }

            if (!tempChart) {
                tempChart = new Chart(property.sensors['temp'], null, 'temp');
                tempChart.attach(chartArea.id);
            }
/*
            if (!windspeedChart) {
                windspeedChart = new Chart(property.sensors['wind_speed']);
                windspeedChart.attach(chartArea.id);
            }
            */
        }, 75);
    });
});

function addChart() {
    if (!selectedSensor || !chartArea) {
        return;
    }

    let chart = new Chart(selectedSensor);
    chart.attach(chartArea.id);
}