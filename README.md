# Homebridge AiLight Plugin
Homebridge plugin for the AiLight firmware

This is an accessory plugin for [Homebridge](https://github.com/nfarina/homebridge) allowing to manage and control
light bulbs that use the [AiLight](https://github.com/stelgenhof/AiLight) firmware.

Current Stable Release: **v0.1.0** (Please read the [changelog](https://github.com/stelgenhof/homebridge-ailight/CHANGELOG.md) for detailed information).

## Requirements
This plugin communicates to your device via the REST API exposed by **AiLight** itself. As such you need to have v0.5.0 or higher of **AiLight** uploaded to your device. Furthermore, the REST API needs to be enabled. Please refer to [REST API](https://github.com/stelgenhof/AiLight/wiki/REST-API) instructions of **AiLight** how to set this up.

## Installation
Assuming you have already [Homebridge](https://github.com/nfarina/homebridge) installed, install this plugin as follows:

```npm install -g homebridge-ailight```

## Configuration
The Homebridge AiLight Plugin registers itself as `AiLight`, with the following configuration options:

| Option   | Description   |
| -------- | --------- |
| name     | A friendly description of your device (e.g. "Bedroom Light") |
| hostname | The hostname or IP address of your device      |
| apikey   | The API Key defined in your AiLight settings of your device      |

### Example config.json

```json
{
  "bridge": {
    "name": "Homebridge",
    "username": "CC:22:3D:E3:CE:30",
    "port": 51826,
    "pin": "031-45-154"
  },
  "description": "This is an example configuration file with the AiLight plugin added.",
  "accessories": [
    {
      "accessory": "AiLight",
      "name": "Bedroom Light",
      "hostname": "<YOUR_HOSTNAME_OR_IP_ADDRESS>",
      "apikey": "<YOUR_API_KEY>"
    }
  ],
  "platforms": [
  ]
}
```

## Bugs and Feedback
For bugs, questions and discussions, please use the [Github Issues](https://github.com/stelgenhof/AiLight/issues).

## Contributing
Contributions are encouraged and welcome; I am always happy to get feedback or pull requests on Github :) Create [Github Issues](https://github.com/stelgenhof/homebridge-ailight/issues) for bugs and new features and comment on the ones you are interested in.

## Credits and License
The **Homebridge-AiLight** plugin is open-sourced software licensed under the [MIT license](http://opensource.org/licenses/MIT). For the full copyright and license information, please see the <license> file that was distributed with this source code.</license>
