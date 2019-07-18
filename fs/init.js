load("api_config.js");
load("api_esp32.js");
load("api_gpio.js");
load("api_mqtt.js");
load("api_sys.js");
load("api_timer.js");

// Currently, there is no API support for ESP8266 internal temperature sensor
let device = ESP32;

/* Load config variables */
let button = {
	gpio: Cfg.get("board.btn1.pin"),			// Built-in button GPIO
	hasPullUp: Cfg.get("board.btn1.pull_up")	// Does the built-in button have pull up?
};
let led = {
	gpio: Cfg.get("board.led1.pin"),						// Built-in LED GPIO
	isOnWhenHigh: Cfg.get("board.led1.active_high")			// Is the LED on when high?
};
let minutesToSleep = Cfg.get("sleep_duration");		// Duration for device device should (deep) sleep
let temperature = {									// Temperature configurations
	basis: Cfg.get("temperature.basis"),
	unit: Cfg.get("temperature.unit"),
};
// Override lib variables if provided externally
if (Cfg.get("button.gpio") !== undefined) button.gpio = Cfg.get("button.gpio");
if (Cfg.get("button.hasPullUp") !== undefined) button.hasPullUp = Cfg.get("button.hasPullUp");
if (Cfg.get("led.gpio") !== undefined) led.gpio = Cfg.get("led.gpio");
if (Cfg.get("led.isOnWhenHigh") !== undefined) led.isOnWhenHigh = Cfg.get("led.isOnWhenHigh");

/* Global variables */
let isCelsius = temperature.unit === "celsius";
let tempOffset;
if (isCelsius) {			// Calculate offset using basis temperature
	tempOffset = (device.temp() - 32)*(5/9) - temperature.basis;
} else tempOffset = device.temp() - temperature.basis;

let editMode = false;						// Is the device in edit mode?
let mustSleep = false;						// Should the device sleep?

// Set built-in LED GPIO as an output pin
GPIO.set_mode(led.gpio, GPIO.MODE_OUTPUT);

// Function for updating LED status
let setLED = function(signal) {
	let level = signal;
	if (!led.isOnWhenHigh) level = !signal;
	GPIO.write(led.gpio, level);
};

// Function for reading the device's internal temperature
let readTemperature = function() {
	let temp =  device.temp();
	if (isCelsius) {
		temp = (temp - 32)*(5/9) - tempOffset;
	} else temp -= tempOffset;
	print("The current temperature is", temp, "degrees", temperature.unit);
	return temp;
};

// Function for sending the temperature to MQTT broker
let sendTemperature = function() {
	let topic = "/losant/" + Cfg.get("mqtt.client_id") + "/state";
	let message = JSON.stringify({
		"data": {
			"temperature": readTemperature(),
			"unit": temperature.unit,
			"offset": tempOffset
		}
	});
	// Send MQTT message and store the broker's response
	let response = MQTT.pub(topic, message, 1);
	print("The MQTT message", response ? "got successfully published." : "failed to get published.");
	// Blink on successful message publishing and enter deep sleep
	if (response) {
		GPIO.write(led.gpio, 1);
		Timer.set(1000, false, function() {		//Turn LED off after a second
			GPIO.write(led.gpio, 0);	
		}, null);
	}
};

// Publish message to MQTT broker if connection has been established
MQTT.setEventHandler(function(conn, ev, edata) {
	if (ev === MQTT.EV_CONNACK) {
		print("MQTT connection established!");
		sendTemperature();
		Timer.set(10000, false, function() {	// Add a little delay to allow button press for edit mode
			mustSleep = true;
		}, null);
	}

	// Execute this block only when button.gpio has a valid value(has a fallback value of -1)
	if (button.gpio >= 0) {
		let btnPull, btnEdge;
		if (button.hasPullUp) {
			btnPull = GPIO.PULL_UP;
			btnEdge = GPIO.INT_EDGE_NEG;
		} else {
			btnPull = GPIO.PULL_DOWN;
			btnEdge = GPIO.INT_EDGE_POS;
		}

		// Enter edit mode on button press
		GPIO.set_button_handler(button.gpio, btnPull, btnEdge, 20, function() {
			print("Edit mode turned", !editMode ? "on." : "off.");
			setLED(!editMode);
			editMode = !editMode;
		}, null);
	}

	// Send the device to deep sleep if edit mode is disabled
	if (!editMode && mustSleep) {
		mustSleep = false;
		print("Entering deep sleep mode for", minutesToSleep, "minutes.");
		device.deepSleep(minutesToSleep * 60 * 1000 * 1000);
	}
}, null);
