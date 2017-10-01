var Service, Characteristic;
var request = require('request');
var colorsys = require('colorsys');

var PAYLOAD_ON = 'ON';
var PAYLOAD_OFF = 'OFF';

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory('homebridge-ailight', 'AiLight', AiLightAccessory);
};

function AiLightAccessory(log, config) {

  // Initialize various object members (config, etc.)
  this.log = log;
  this.hostname = config.hostname;
  this.name = config.name;
  this.apikey = config.apikey;

  // Local caching of HSL color space for RGB callback
  this.brightness = 0;
  this.hue = 0;
  this.saturation = 0;

  /**
   * Performs a RESTful API call to the configured device.
   *
   * @param {String} path The name of API route/path.
   * @param {String} body The optional payload to be submitted to the device.
   * @param {String} method The HTTP method (GET, PUT) to be used.
   * @param {function} callback The callback that handles the response.
   */
  this.httpRequest = function(path, body, method, callback) {
    request({
      url: 'http://' + this.hostname + '/api/' + path,
      body: body,
      method: method,
      rejectUnauthorized: false,
      headers: {
        'content-type': 'application/json',
        'api-key': this.apikey
      }
    }, function(error, response, body) {
      callback(error, response, body);
    });
  };

  /**
   * Sets the RGB value of the device based on the cached HSL values.
   *
   * @param {function} callback The callback that handles the response.
   */
  this.setRGB = function(callback) {
    var rgb = colorsys.hsl2Rgb({
      h: this.hue,
      s: this.saturation,
      l: this.brightness
    });

    this.log('Converting H:%s S:%s L:%s to RGB:(r: %s, g: %s, b: %s)...', this.hue, this.saturation, this.brightness, rgb.r, rgb.g, rgb.b);

    var payload = {
      'state': PAYLOAD_ON,
      'color': {
        'r': rgb.r,
        'g': rgb.g,
        'b': rgb.b
      }
    };

    this.httpRequest('light', JSON.stringify(payload), 'PATCH', function(error, response, body) {
      if (error) {
        this.log("Error '%s' setting RGB values. Response: %s", error, body);
        callback(error || new Error('Error setting RGB values.'));
      } else {
        this.log('RGB values successfully changed to RGB:(r: %s, g: %s, b: %s)', rgb.r, rgb.g, rgb.b);
        callback();
      }
    }.bind(this));
  };
}

AiLightAccessory.prototype = {
  identify: function(callback) {
    this.log('Identify requested!');
    callback();
  },

  getServices: function() {
    var informationService = new Service.AccessoryInformation();

    informationService
      .setCharacteristic(Characteristic.Manufacturer, 'Sacha Telgenhof')
      .setCharacteristic(Characteristic.Model, 'AiLight')
      .setCharacteristic(Characteristic.FirmwareRevision, '0.1.0')
      .setCharacteristic(Characteristic.SerialNumber, 'AI001');

    this.service = new Service.Lightbulb(this.name);
    this.service
      .getCharacteristic(Characteristic.On)
      .on('get', this.getState.bind(this))
      .on('set', this.setState.bind(this));

    this.service.addCharacteristic(new Characteristic.Brightness())
      .on('get', this.getBrightness.bind(this))
      .on('set', this.setBrightness.bind(this));

    this.service.addCharacteristic(new Characteristic.Hue())
      .on('get', this.getHue.bind(this))
      .on('set', this.setHue.bind(this));

    this.service.addCharacteristic(new Characteristic.Saturation())
      .on('get', this.getSaturation.bind(this))
      .on('set', this.setSaturation.bind(this));

    this.informationService = informationService;

    return [this.informationService, this.service];
  },

  /**
   * Gets the current state (On/Off) of this device.
   *
   * @param {function} callback The callback that handles the response.
   */
  getState: function(callback) {
    this.httpRequest('light', '', 'GET', function(error, response, body) {
      if (error) {
        this.log('Error getting State (statuscode %s): %s', response.statusCode, error);
        callback(error);
      } else {
        var json = JSON.parse(body);

        this.log('Power is %s', json.state);

        callback(null, (json.state == PAYLOAD_ON));
      }
    }.bind(this));
  },

  /**
   * Sets the state (On/Off) for this device.
   *
   * @param {bool} on The requested sate.
   * @param {function} callback The callback that handles the response.
   */
  setState: function(on, callback) {
    var state = (on) ? PAYLOAD_ON : PAYLOAD_OFF;
    var payload = {
      'state': state
    };

    this.httpRequest('light', JSON.stringify(payload), 'PATCH', function(error, response, body) {
      if (error) {
        this.log("Error '%s' setting State. Response: %s", error, body);
        callback(error || new Error('Error setting State.'));
      } else {
        this.log('State successfully changed to %s', state);
        callback();
      }
    }.bind(this));
  },

  /**
   * Gets the current Brightness level of this device.
   *
   * @param {function} callback The callback that handles the response.
   */
  getBrightness: function(callback) {
    this.httpRequest('light', '', 'GET', function(error, response, body) {
      if (error) {
        this.log('Error getting Brightness (statuscode %s): %s', response.statusCode, error);
        callback(error);
      } else {
        var json = JSON.parse(body);
        var brightness = Math.round((json.brightness / 255) * 100);

        this.log('Brightness is set at %s (%s\%)', json.brightness, brightness);
        this.brightness = brightness;

        callback(null, brightness);
      }
    }.bind(this));
  },

  /**
   * Sets the brightness level for this device.
   *
   * @param {integer} on The requested brightness level.
   * @param {function} callback The callback that handles the response.
   */
  setBrightness: function(level, callback) {
    var brightnessLevel = Math.round((level * 255) / 100);

    var payload = {
      'state': PAYLOAD_ON,
      'brightness': brightnessLevel
    };

    this.httpRequest('light', JSON.stringify(payload), 'PATCH', function(error, response, body) {
      if (error) {
        this.log("Error '%s' setting Brightness. Response: %s", error, body);
        callback(error || new Error('Error setting Brightness.'));
      } else {
        this.log('Brightness changed from %s\% to %s\%', this.brightness, level);
        this.brightness = level;
        callback();
      }
    }.bind(this));
  },

  /**
   * Gets the current Hue level of this device.
   *
   * @param {function} callback The callback that handles the response.
   */
  getHue: function(callback) {
    this.httpRequest('light', '', 'GET', function(error, response, body) {
      if (error) {
        this.log('Error getting Hue (statuscode %s): %s', response.statusCode, error);
        callback(error);
      } else {
        var json = JSON.parse(body);
        var hsl = colorsys.rgb2Hsl({
          r: json.color.r,
          g: json.color.g,
          b: json.color.b
        });

        this.log('Hue is set at %s°', hsl.h);
        this.hue = hsl.h;

        callback(null, hsl.h);
      }
    }.bind(this));
  },

  /**
   * Sets the Hue level for this device.
   *
   * @param {integer} hue The requested Hue level.
   * @param {function} callback The callback that handles the response.
   */
  setHue: function(hue, callback) {
    this.hue = hue;
    this.setRGB(callback);
  },

  /**
   * Gets the current Saturation level of this device.
   *
   * @param {function} callback The callback that handles the response.
   */
  getSaturation: function(callback) {
    this.httpRequest('light', '', 'GET', function(error, response, body) {
      if (error) {
        this.log('Error getting Saturation (statuscode %s): %s', response.statusCode, error);
        callback(error);
      } else {
        var json = JSON.parse(body);
        var hsl = colorsys.rgb2Hsl({
          r: json.color.r,
          g: json.color.g,
          b: json.color.b
        });

        this.log('Saturation is set at %s%', hsl.s);
        this.saturation = hsl.s;

        callback(null, hsl.s);
      }
    }.bind(this));
  },

  /**
   * Sets the Saturation level for this device.
   *
   * @param {integer} on The requested saturation level.
   * @param {function} callback The callback that handles the response.
   */
  setSaturation: function(saturation, callback) {
    this.saturation = saturation;
    this.setRGB(callback);
  },
};
