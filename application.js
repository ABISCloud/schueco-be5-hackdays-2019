let property = null;
let time = null;
let chartArea = null;
let valueNameSelect = null;
let selectedSensorName = null;
let selectedSensor = null;

let messages = {
    "rel_humidity":{

    },
    "ambient_temperature":{

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

    let tempChart = null;
    let humidChart = null;
    let windspeedChart = null;

    let notificationSensorStatus = "1";
    let indicatorEl = document.getElementsByClassName('liveIndicator')[0];

    property.connect(() => {
        updateSensorDropDown();

        setTimeout(() => {
            if (!tempChart) {
                tempChart = new Chart(property.sensors['ambient_temperature'], (notificationSensor, diff) => {
                    // alert(notificationSensor.name + " reported an issue");

                    if (diff < 0) {
                        notificationSensorStatus = '2';
                    } else if (diff > 0) {
                        notificationSensorStatus = '3';
                    }

                    switch(notificationSensorStatus) {
                        case '1':
                            Array.from(indicatorEl.classList.entries()).forEach(o => indicatorEl.classList.remove(o));
                            indicatorEl.classList.add('liveIndicator');
                            indicatorEl.classList.add('greenGood');
                        break;
                        case '2':
                            Array.from(indicatorEl.classList.entries()).forEach(o => indicatorEl.classList.remove(o));
                            indicatorEl.classList.add('liveIndicator');
                            indicatorEl.classList.add('yellowModarte');
                        break;
                        case '3':
                            Array.from(indicatorEl.classList.entries()).forEach(o => indicatorEl.classList.remove(o));
                            indicatorEl.classList.add('liveIndicator');
                            indicatorEl.classList.add('criticalRed');
                        break;
                        default:
                            Array.from(indicatorEl.classList.entries()).forEach(o => indicatorEl.classList.remove(o));
                            indicatorEl.classList.add('liveIndicator');
                            indicatorEl.classList.add('criticalRed');
                            break;
                    }
                });
                tempChart.attach(chartArea.id);
            }

            if (!humidChart) {
                humidChart = new Chart(property.sensors['userdefined_double_2'], null, 'rel_humidity');
                humidChart.attach(chartArea.id);
            }

            if (!windspeedChart) {
                windspeedChart = new Chart(property.sensors['wind_speed']);
                windspeedChart.attach(chartArea.id);
            }
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