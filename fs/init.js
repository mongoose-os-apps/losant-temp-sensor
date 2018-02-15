load('api_config.js');
load('api_gpio.js');
load('api_mqtt.js');
load('api_net.js');
load('api_sys.js');
load('api_timer.js');
load('api_esp32.js');
load('api_rpc.js');

let button = Cfg.get('pins.button');
let topic = '/losant/' + Cfg.get('mqtt.client_id') + '/state';
let device;

//Set to true to convert temperature to Celsius
let enableConv = true;

//Setting the GPIO for in-built LED
let led = Cfg.get('pins.led');

//Set the deepSleep time for your device in minutes
let minToSleep = 20; 

let otaMode = false;

//Set the temperature difference between your room and ESP32
let tempOffset = 17;

//Storing device info
RPC.call(RPC.LOCAL, 'Sys.GetInfo', null, function(resp, ud) {
  device = resp.arch;
},null);

//Toggle OTA mode on button press
GPIO.set_button_handler(0, GPIO.PULL_UP, GPIO.INT_EDGE_NEG, 200, function(){
  otaMode = !otaMode;
  print(otaMode ? "OTA Mode on!" : "OTA Mode off!");
}, null);

//Convert the temperature from Fahrenheit to Celsius
function convTemp(){
  return ( (5/9)*(ESP32.temp() - 32) - tempOffset); 
}

//Basic initialization function
function init(){
  GPIO.set_mode(led, GPIO.MODE_OUTPUT);
  GPIO.toggle(led);
  print('Uptime:', Sys.uptime());
  if(enableConv)
    print('Current Temperature: ',convTemp(),' Celsius');
  if(!enableConv)
    print('Current Temperature: ',(ESP32.temp()-tempOffset),' Fahrenheit');
}

//Read the temperature and return it in JSON format
function getTemp() {
  return JSON.stringify({
    data:{
      temp:(enableConv?convTemp():ESP32.temp())
    }
  });
}

//Deploy the message to Losant
function sendTemp() {
  let message = getTemp();
  let ok = MQTT.pub(topic, message, 1);
  print('Published:', ok, topic, '->', message);
}

//Run the initialization function
init();

//MQTT and deep sleep
MQTT.setEventHandler(function (conn, ev, edata) {
    // Wait for MQTT.EV_CONNACK to ensure the mqtt connection is established
    if (MQTT.EV_CONNACK === ev) {
        print('=== MQTT event handler: got MQTT.EV_CONNACK');
        sendTemp();
        // Wait a moment to ensure the message has really been sent 
        // The timing might be different if using a WAN broker
        Timer.set(1000, false, function () {
          if( !otaMode ){
            if(device === "esp32")
              ESP32.deepSleep(minToSleep * 60 * 1000 * 1000);
            if(device === "esp8266")
              ESP8266.deepSleep(minToSleep * 60 * 1000 * 1000);
          }
        }, null);
    }
}, null);