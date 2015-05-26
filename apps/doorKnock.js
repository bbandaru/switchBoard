/*jslint white: true */
/*global module, require, console */

/**
 * Copyright (c) 2014 brian@bevey.org
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

/**
 * @author brian@bevey.org
 * @fileoverview When a vibration sensor is triggered - and a contact sensor is
 *               not triggered within a given interval, notify that someone is
 *               knocking on a door.
 */

module.exports = (function () {
  'use strict';

  return {
    version : 20150525,

    lastEvents : { knock : 0, open : 0, close: 0 },

    doorKnock : function(device, command, controllers, values, config) {
      var now     = new Date().getTime(),
          that    = this,
          trigger = false;

      if(command === 'subdevice-state-vibrate-' + config.vibrate + '-on') {
        this.lastEvents.knock = now;
        trigger = true;
      }

      else if(command === 'subdevice-state-contact-' + config.contact + '-on') {
        this.lastEvents.open = now;
      }

      else if(command === 'subdevice-state-contact-' + config.contact + '-off') {
        this.lastEvents.close = now;
      }

      if((trigger) && (this.lastEvents.knock) && (!this.lastEvents.open)) {
        setTimeout(function() {
          var notify     = require(__dirname + '/../lib/notify'),
              translate  = require(__dirname + '/../lib/translate'),
              runCommand = require(__dirname + '/../lib/runCommand'),
              message    = '',
              deviceId;

          if((that.lastEvents.open <= that.lastEvents.close) && (Math.abs(that.lastEvents.knock - that.lastEvents.open) > config.delay)) {
            message = translate.translate('{{i18n_DOOR_KNOCK}}', 'smartthings', controllers.config.language).split('{{LABEL}}').join(config.contact);

            notify.sendNotification(null, message, device);
            notify.notify(message, controllers);

            for(deviceId in controllers) {
              if((controllers[deviceId].config) && (controllers[deviceId].config.typeClass === 'mp3')) {
                runCommand.runCommand(deviceId, 'text-doorbell');
                break;
              }
            }
          }

          that.lastEvents = { knock : 0, open : 0, close : 0 };
        }, config.delay * 1000);
      }
    }
  };
}());