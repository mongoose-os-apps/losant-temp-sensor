# losant-temp-sensor

#### A [Mongoose OS](https://mongoose-os.com) app for sending temperature readings to [Losant](https://www.losant.com). 

<p align="center"><img src="/graph.png" alt="Demo graph"/></p>

This app lets you configure your device so that it can **publish its temperature readings to Losant via MQTT periodically**.  
This app is good for you if you're a beginner with IoT since it *allows quick testing of [Mongoose OS](https://mongoose-os.com) and MQTT brokers*(here, [Losant](https://www.losant.com)). I emphasize on the **quick testing** part because *to get this app to work, **all you need is a USB cable and an ESP32 development board.***
The above picture shows the graph of my ESP32 temperature readings recorded via this app and plotted on the server-side using [Losant's dashboards](https://docs.losant.com/dashboards/overview).

### Theory
This app relies on the **internal temperature sensor** of IoT devices, which gives the temperature of the MCU.
Throughout this app, **it has been assumned that the MCU temperature must be greater than the actual temperature by a fixed quantity**, an "offset" if you like. Therefore, *the app first finds this "offset" by initially comparing the MCU temperature with a [reference temperature](#temperaturebasis)(the actual ambient temperature) specified by the user at the time of flashing the firmware*. Once the offset has been calculated by the app, it will publish the approximated temperature(`mcu_temperature - offset`).
Since the device simply repeats the cycle in roughly the same time every time and  then sleeps, therefore variations get minimised and the approximated temperature resembles the ambient temperatue.

### Supported Hardware
- ESP32

---

## Installation

For installing this app, it is necessary that you already have the `mos` tool installed on your machine. If not, then do so by following the instructions given here: [mos Installation Guide](https://mongoose-os.com/software.html).  
Once installed, launch the mos tool or CLI, whatever you prefer, and proceed with the steps.

### 1. Clone the `losant-temp-sensor` app
```bash
mos clone https://github.com/mongoose-os-apps/losant-temp-sensor
```

### 2. Build the firmware and flash it
Open the cloned repository directory in your CLI and run the following command.
```bash
mos build --platform esp32 && mos flash
```

### 3. Configure WiFi
After successful flashing, **wait for five seconds** to allow the device to boot and then configure wifi for the device using the given command.
```bash
mos wifi "<your WiFi SSID>" "<your WiFi password>"
```
For example:
```
mos wifi "Home WiFi" "home@123"
```

### 4. Configure the app
This app requires a little configuration before using to suit the user. The configurations can be made to the app using the `mos config-set` command.
```bash
mos config-set temperature.basis=<basis temperature> \
    temperature.unit="<temperature unit>"
```
You can also customize the app to more extent through the variables documented below in [App Configuration](#app-configuration) section.

### 5. Set up Losant
To use this app, you are required to have a **device** as well as an **application** set up on Losant. To do so, you may refer to these Losant documentations:
- [Creating A Device](https://docs.losant.com/devices/overview/)
- [Generating Access Keys](https://docs.losant.com/applications/access-keys/)

While creating the device, be sure to add a device attribute with the following properties:
1. **Name**: temperature, **Data Type**: Number
2. **Name**: offset, **Data Type**: Number
3. **Name**: unit, **Data Type**: String

### 6. Configure the MQTT connection to Losant
Set up the MQTT credentials on your Mongoose OS flashed device using the following command.
```
mos config-set device.id=<your Losant device id> \
  mqtt.client_id=<your Losant device id> \
  mqtt.user=<your Losant access key > \
  mqtt.pass=<your Losant access secret>
```  
The **Device ID** can be obtained on Losant under the **Devices** section of your app.
The **Access Key** and **Access Secret** can be obtained on Losant. If you don't already have one at your disposal, you may generate one by following the official instructions stated in the [Losant Docs](https://docs.losant.com/applications/access-keys/).

Once these are set up, your device should now be sending data to Losant.

### 7. Additional Losant Set-up
Once you've done all the above steps, you may use the temperature readings for doing anything by accessing the attributes of your device(e.g. temperature). I used the `temperature` attribute to plot a graph using [Losant's dashboards](https://docs.losant.com/dashboards/overview).

---

## App Configuration
Some configurations have to be set for the app to work optimally. They are as stated below:

### Edit mode

Since `losant-temp-app` goes into **deep sleep** soon after publishing data to MQTT broker, therefore passing commands via the console isn't possible as the device shuts off its UART connection. This is where **edit mode** steps in. It is a mode that this app has in which **deep sleep is disabled for one boot cycle**.
This mode can be activated/deactivated by pressing the `Flash` or `Boot` button after the device has finished booting. The built-in LED indicates whether this mode is on or off.
**This mode must be turned on if you wish to configure the app after setting up WiFi and MQTT.**

> The best way to check if the device has booted or not is by seeing the device logs using the `mos console` command.

### `temperature.basis`
The app needs the actual ambient temperature to be specified to it initially through the `temperature.basis` key. This helps the app in approximating the ambient temperature using the internal temperature readings alone.
The basis temperature can be specified using the following command:
```bash
# Example for setting basis temperature to 30 units
mos config-set temperature.basis=30
```
If not specified by the user, `temperature.basis` **defaults to 24 units**. 

### `temperature.unit`
This app has the facility to send temperature to Losant in either **Celsius** or **Fahrenheit**.
To specify the temperature unit of your choice, use this command:
```bash
# Example for setting temperature unit to Celsius
mos config-set temperature.unit="celsius"   #or "fahrenheit"
```
If not specified by the user, `temperature.unit` **defaults to Celsius**.

### `sleep_duration` 
It is up to you to set the interval, *during which the device will undergo deep sleep*, between two consistent temperature readings. `sleep_duration` key contains the value which decides the **sleep time** of the device, that is the amount of time(in minutes) after which it has to wake and send another temperature reading to Losant.
The sleep duration can be specified using the command:
```bash
# Example for setting sleep_duration to 20 minutes
mos config-set sleep_duration=20
```
If not specified by the user, `sleep_duration` **defaults to 10 minutes**.

### `led.gpio`
This key points to the GPIO you wish to set up as an LED output.
To specify the LED GPIO, use this command:
```bash
# Example to set GPIO2 as LED pin
mos config-set led.gpio=2
```
If not specified, `led.gpio` **defaults to GPIO2**.
> Self note: Prefer default value recommended by Mongoose OS after [this PR](https://github.com/mongoose-os-libs/boards/pull/1) is merged.

### `led.isOnWhenHigh`
This key tells the app when the LED lights up on HIGH input or not.
To specify this key, use this command:
```bash
# Example for telling the app that LED lights up on HIGH input
mos config-set led.isOnWhenHigh=true
```
If not specified by the user, this key **defaults to a value recommended by Mongoose OS for your board**. Therefore it is better to leave this key unspecified.

### `button.gpio`
This key points to the GPIO you wish to set up as a button for the app. This button will be responsible for entering **edit mode**.
To specify the button GPIO, use this command:
```bash
# Example to set GPIO0 as LED pin
mos config-set button.gpio=0
```
If not specified, this key **defaults to a value recommended by Mongoose OS for your device**. Therefore it is better to leave this key unspecified.

### `button.hasPullUp`
This key tells the app whether the button GPIO has a pull up resistor or not.
To specify this key, use this command:
```bash
# Example for telling the app that button GPIO has a pull down resistor
mos config-set button.hasPullUp=false
```
If not specified by the user, this key **defaults to a value recommended by Mongoose OS for your board**. Therefore it is better to leave this key unspecified if you haven't modified the `button.gpio` key.
