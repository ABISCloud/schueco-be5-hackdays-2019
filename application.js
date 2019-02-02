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
            if (o === selectedSensorName) {
                return "<option disabled selected value=\"\">" + o + "</option>"
            } else {
                return "<option value=\"" + o + "\">" + o + "</option>"
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