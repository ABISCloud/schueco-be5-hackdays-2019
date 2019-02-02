/**
 * A class which represents a property (e.g. a building)
 */
class Property {
    get propertyId() {
        return this._connection.propertyId;
    }

    get time() {
        return this._connection.time;
    }

    get sensors() {
        return this._sensors;
    }

    get connection() {
        return this._connection;
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

                let sensor = this._sensors[message.value_name];

                if (!sensor) {
                    sensor = new Sensor(message.value_name, self);
                    this._sensors[message.value_name] = sensor;

                    if (sensorsChanged) {
                        sensorsChanged(this._sensors);
                    }
                }

                sensor.addValue(message.value, sensor.property.time );
            });
        });
    }
}