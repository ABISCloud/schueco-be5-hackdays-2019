class Sensor {
    /**
     * Returns one of the following values:
     * number, enum_sun, number_meterspersecond, number_degrees, number_celsius, enum_presence, enum_airstate, enum_onoff, enum_openclosed
     */
    get format() {
        switch (this.name) {
            // Environmental data
            case "prop_number": return "number";
            case "sun_state": return "enum_sun";
            case "wind_speed": return "number_meterspersecond";
            case "wind_direction": return "number_degrees";
            case "ambient_temperature":
            // Room data
            case "room2nd_temperature":
            case "room4th_temperature": return "number_celsius";
            case "room2nd_presence_state":
            case "room4nd_presence_state": return "enum_presence";
            case "room2nd_air_state":
            case "room4nd_air_state": return "enum_airstate";
            case "room2nd_light_state":
            case "room4th_light_state":
            case "room2nd_heater_state":
            case "room4th_heater_state": return "enum_onoff";
            case "room2nd_window_state":
            case "room4th_window_state":
            case "room2nd_blind_state":
            case "room4th_blind_state": return "enum_openclosed";

        }
    }

    get name() {
        return this._name;
    }

    get history() {
        return this._history;
    }

    constructor(name) {
        this._name = name;
        this._history = {};
        this._callbacks = [];
    }

    addValue(value) {
        let timestamp = new Date().getTime();
        this._history[timestamp] = value;
        let self = this;
        this._callbacks.forEach(o => o(self, timestamp, value));
    }

    registerNewValueCallback(callback) {
        this._callbacks.push(callback);
    }
}