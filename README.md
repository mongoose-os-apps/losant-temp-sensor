# Graphing Temperature on Losant with Mongoose OS 

![My Graph](/graph.png)

This app lets you configure your device to publish its **temperature readings** to **Losant** via MQTT periodically. 

## Tested Hardware
- ESP32
- ESP8266

---

## Installation & Flashing

For installing this app, it is necessary that you already have the `mos` tool installed on your machine. If not, then do so by following the instructions given here: [mos Installation Guide](https://mongoose-os.com/software.html)

**1. Clone the `esp-temp` app:**
```
git clone https://github.com/UtkarshVerma/esp-temp
```

---

**2. Build the firmware:**
Open the cloned repository directory in your CLI and run the following command. The device may either be **esp32** or **esp8266**.
```
mos build --arch <your device> 
```
For example:
```
mos build --arch esp32 
```

---

**3. Flash your device:**
Now flash your device using the below stated command.
```
mos flash 
```

----

**4. Configure WiFi:**
Configure WiFi on your device using the following command. Ignore '<' and '>'.
```
mos wifi "<your WiFi SSID>" "<your WiFi password>"
```
For example:
```
mos wifi "Home WiFi" "home@123"
```

---

**5. Set up Losant:**
To set up your losant account, log in and do the following:
- Create an application.
- Create a device and configure it.
    - Create a device attribute of  data type **Number** and name it **temp**.
- Create an **Access Key** for your application and store both **Access Key Token** and **Access Key Secret** in a safe place for later use.

That's it.

---

**5. Configure the MQTT connection to Losant:**
Set up the MQTT credentials on your Mongoose OS flashed device using the following command.
```
mos config-set mqtt.client_id= <your Losant device id> \
  mqtt.user= <your Losant access key token> \
  mqtt.pass= <your Losant access key secret>
```  
Since this app, that is `esp-temp`, has **deep sleep enabled** therefore we will have to first **disable deep sleep temporarily** to pass commands to the device. To do so:

- Execute the command `mos console` in your CLI and press **Reset** button of your device.
- You should see the device logs. Then, when you feel that the device has booted up, press the **Flash** button of your device to enable **OTA mode** or in other words, **disable deep sleep**. On successful attempt, the internal LED will glow.
- Now you can pass commands to the device until it is rebooted.

Same goes for pushing the **OTA updates**.

---

**6. Create a Dashboard on Losant:**
This step will allow you to graph the temperature readings of your device. So, create a new dashboard and add a **Time Series Graph** block to it. Then configure the block according to your needs. 
For example, my graph has been set up in this manner:
- **Data Type**: Historical
- **Duration**:
    - Time Range - 24 hours
    - One point every 20 minutes
- **Block Data**:
    ![Block Data](/block-data.png)



