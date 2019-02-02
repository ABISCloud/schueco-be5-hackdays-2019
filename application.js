let property = null;
let chartArea = null;
let valueNameSelect = null;
let selectedSensorName = null;
let selectedSensor = null;

$(() => {
    property = new Property(221);
    chartArea = document.getElementById("chartArea");
    valueNameSelect = document.getElementById("valueNameSelect");
    selectedSensorName = null;
    selectedSensor = null;

    function updateSensorDropDown() {
        let options = Object.keys(property.sensors);
        valueNameSelect.innerHTML = options.map(o => {
            // TODO: Duplicate code
            let label = o;
            switch (label) {
                case "userdefined_double_1": label = "rain"; break;
                case "userdefined_double_2": label = "rel_humidity"; break;
                case "userdefined_double_3": label = "air_pressure";  break;
            }
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

    property.connect(() => {
        updateSensorDropDown();
    });
});


function addChart() {
    if (!selectedSensor || !chartArea) {
        return;
    }

    let chart = new Chart(selectedSensor);
    chart.attach(chartArea.id);
}