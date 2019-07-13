load("api_config.js");
load("api_gpio.js");
load("api_mqtt.js");
load("api_timer.js");
load("api_rpc.js");
load("api_esp32.js");

//Currently, no API is present for sensing ESP8266 internal temperature
let device = ESP32;

//Store config variables
let button = Cfg.get("pins.button");
let isCelsius = Cfg.get("temperature.unit") === "Celsius";
let tempOffset = Cfg.get("temperature.offset");
let sleepDuration = Cfg.get("sleep_duration");

//Set the GPIO for inbuilt LED
let led = ffi("int get_led_gpio_pin()")();
GPIO.set_mode(led, GPIO.MODE_OUTPUT);

//Function for reading the temperature and returning it in JSON format
function readTemperature() {
	let temperature = double(device.temp());
	if isCelsius
		temperature = (temperature-32)*(5/9);
	temperature -= tempOffset;
	print("The current temperature is "+temperature+"°"+(isCelsius?"C":"F")+".");
	print("Temperature offset being used is "+tempOffset+"°"+(isCelsius?"C":"F")+".";
	return JSON.stringify({
		"data": {
			"temperature": temperature
			"unit": Cfg.get("temperature.unit")
		}
  	});
}

//Function for deploying the message to MQTT server
function sendTemperature() {
	MQTT.setEventHandler(function(conn, ev, edata) {
		//Check if connection is established, and then proceed
		if (ev === MQTT.EV_CONNACK) {
			print("MQTT connection with broker successful.");
			let topic = "losant/"+Cfg.get("mqtt.client_id")+"/state";
			let message = readTemperature();		//Read the temperature and store it
			let response = MQTT.pub(topic, message, 0, true);

			//Blink LED and update console after publishing message
			Timer.set(1000, 0, GPIO.toggle(led), null);
			GPIO.toggle(led);
			print("Published:"+(response?"Yes":"No"));
		}
	}, null);
}

//Force send data using button
GPIO.set_button_handler(button, GPIO.PULL_UP, GPIO.INT_EDGE_NEG, 200, sendTemperature());

//Proceed with routine
Timer.set(sleepDuration*60*1000, Timer.REPEAT, function() {
	sendTemperature();		//Send the temperature reading to MQTT broker
}, null);
