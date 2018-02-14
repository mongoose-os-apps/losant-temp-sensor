#  Sending ESP Temperature to Losant using Mongoose OS

![My Graph](/graph.png)

This app lets you configure your device to publish its **temperature readings** to **Losant** via MQTT periodically. The above picture shows the graph of my ESP32 temperature readings recorded via this app.

## Tested Hardware
- ESP32
- ESP8266

---

# Installation & Flashing

For installing this app, it is necessary that you already have the `mos` tool installed on your machine. If not, then do so by following the instructions given here: [mos Installation Guide](https://mongoose-os.com/software.html)

## 1. Cloning the `esp-temp` app
```
git clone https://github.com/UtkarshVerma/esp-temp
```

## 2. Building the firmware
Open the cloned repository directory in your CLI and run the following command.
```
mos build --arch <your device> 
```

The device may either be **esp32** or **esp8266**.
For example:
```
mos build --arch esp32
```

## 3. Flashing the device
Now flash your device using the below stated command.
```
mos flash 
```

## 4. Configuring WiFi
Configure WiFi on your device using the following command. Ignore '<' and '>'.
```
mos wifi "<your WiFi SSID>" "<your WiFi password>"
```
For example:
```
mos wifi "Home WiFi" "home@123"
```

## 5. Setting up Losant
To use this app, you are required to have a **device** as well as an **application** set up on Losant. To do so, you may refer to these Losant documentations:

[Creating A Device](https://docs.losant.com/devices/overview/)

[Generating Access Keys](https://docs.losant.com/applications/access-keys/)

While creating the device, be sure to add a device attribute with the following properties:
- **Name**: temp
- **Data Type**: Number

## 6. Configuring the MQTT connection to Losant
Set up the MQTT credentials on your Mongoose OS flashed device using the following command.
```
mos config-set mqtt.client_id= <your Losant device id> \
  mqtt.user= <your Losant access key token> \
  mqtt.pass= <your Losant access key secret>
```  
The **Device ID** can be obtained on Losant. 
The **Access Key** and **Access Secret** can be obtained on Losant. If you don't already have one at your disposal, you may generate one by following the official instructions stated in the [Losant Docs](https://docs.losant.com/applications/access-keys/).

Once these are set up, your device should now be sending data to Losant.

## 7. Additional Losant Set-up
Once you've done all the above steps, you may use the temperature readings for doing anything by accessing the `temp` attribute values. I used them to plot a graph.

---

# Some App Features

This app comes with some integrated features for usage convenience. They are as stated below:

## `otaMode`

Since this app, that is `esp-temp`, has **deep sleep enabled**, therefore passing commands via the console isn't possible as deep sleep is enabled within few seconds of booting. So, to make this app support **over the air** updates as well as quick code editing via the UI, an **OTA Mode** has been implemented which disables deep sleep mode for **one boot cycle**. 
To enable **OTA Mode**, the `Flash` or `Boot` button on the development board has to be pressed right after the device has booted up. 

> The best way to check if the device has booted or not is by seeing the device logs via the `mos console` command.

As a response, a message will be displayed in the logs saying **OTA Mode on!**  and the device LED will start to **glow** on successful enabling of the OTA mode.

## `enableConv`
This app has the facility to send temperature to Losant in either **Celsius** or **Fahrenheit**. By default, the temperature will be sent in **Celsius** but it may be changed to **Fahrenheit** by setting the `enableConv` value as `false` in the app code.


## `tempOffset`
Since this app relies on the **internal temperature sensor** of ESP32/8266, which reads the temperature of the MCU, therefore the temperature readings are bound to be **off by a certain value** from the ambient temperature. To make the readings **approximately** equal to the ambient temperature, we may subtract a specific value from the readings. That additional value is the `tempOffset`.

> The graph of MCU temperature and ambient temperature are almost alike if not for the upward shifting due to the additional MCU internal heat. The `tempOffset` value compensates for it and that is the core concept of this app.

This app subtracts `tempOffset` value from the temperature readings so a positive value represents decrement and vice versa.

It is set to **17** by default.

## `minToSleep` 
It is up to you to set the interval between to consistent temperature readings, or in other words, the period. `minToSleep` variable contains the value which decides the **sleep time** of the device, that is the amount of time(in minutes) after which it has to wake and send another temperature reading to Losant.

It is set to **20** by default, meaning that a temperature reading will be sent to Losant every 20 minutes.