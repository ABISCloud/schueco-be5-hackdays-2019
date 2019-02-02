/**
 * A class which represents a property (e.g. a building)
 */
class Property {
    get propertyId() {
        return this._connection.propertyId;
    }

    get sensors() {
        return this._sensors;
    }

    constructor(propertyId) {
        this._connection = new PropertyConnection(propertyId);
        this._sensors = {};
    }

    /**
     * Connects to the property and discovers its sensors.
     * @param sensorsChanged A callback which's called when a new sensor was discovered.
     */
    connect(sensorsChanged) {
        let self = this;
        this._connection.connect().then(propertyId => {
            // Register a catch-all handler for new messages
            self._connection.registerMessageCallback("", message => {
                if (!this._sensors[message.value_name]) {
                    this._sensors[message.value_name] = new Sensor(message.value_name);
                    if (sensorsChanged) {
                        sensorsChanged(this._sensors);
                    }
                }
                this._sensors[message.value_name].addValue(message.value);
            });
        });
    }
}