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

module.exports = (function () {
  'use strict';

  /**
   * @author brian@bevey.org
   * @requires http, fs, request
   * @fileoverview Basic control of Foscam IP camera.
   */
  return {
    version : 20151208,

    inputs  : ['command'],

    /**
     * Whitelist of available key codes to use.
     */
    keymap  : ['ALARM_OFF', 'ALARM_ON', 'DOWN', 'LEFT', 'PRESET1', 'PRESET2', 'PRESET3', 'RIGHT', 'STOP', 'UP', 'TAKE'],

    /**
     * Prepare a request for command execution.
     */
    postPrepare : function (config) {
      var path   = '',
          login  = '?user=' + config.username + '&amp;pwd=' + config.password + '&amp;',
          keymap = { 'ALARM_OFF' : '/set_alarm.cgi' + login + 'motion_armed=0',
                     'ALARM_ON'  : '/set_alarm.cgi' + login + 'motion_armed=1',
                     'DOWN'      : '/decoder_control.cgi' + login + 'command=2',
                     'LEFT'      : '/decoder_control.cgi' + login + 'command=6',
                     'PRESET1'   : '/decoder_control.cgi' + login + 'command=31',
                     'PRESET2'   : '/decoder_control.cgi' + login + 'command=33',
                     'PRESET3'   : '/decoder_control.cgi' + login + 'command=35',
                     'RIGHT'     : '/decoder_control.cgi' + login + 'command=4',
                     'STOP'      : '/decoder_control.cgi' + login + 'command=1',
                     'UP'        : '/decoder_control.cgi' + login + 'command=0',
                     'TAKE'      : '/snapshot.cgi' + login,
                     'PARAMS'    : '/get_params.cgi' + login };

      path = keymap[config.command];

      return { host   : config.deviceIp,
               port   : config.devicePort,
               path   : path,
               method : 'GET' };
    },

    /**
     * Grab the latest state as soon as SwitchBoard starts up.  We'll also take
     * this opportunity to alter the default markup template with the correct
     * path for the image since it will always be part of a data attribute.
     */
    init : function (controller) {
      var runCommand = require(__dirname + '/../../lib/runCommand');

      runCommand.runCommand(controller.config.deviceId, 'state', controller.config.deviceId);

      controller.markup = controller.markup.replace('{{FOSCAM_DYNAMIC}}', 'http://' + controller.config.deviceIp + '/videostream.cgi?user=' + controller.config.username + '&amp;pwd=' + controller.config.password);

      return controller;
    },

    /**
     * Prepares and calls send() to request the current state.
     */
    state : function (controller, config, callback) {
      var foscam = { device : {}, config : {} };

      callback                   = callback || function () {};
      foscam.command             = 'state';
      foscam.device.deviceId     = controller.config.deviceId;
      foscam.device.deviceIp     = controller.config.deviceIp;
      foscam.device.localTimeout = controller.config.localTimeout || config.localTimeout;
      foscam.device.username     = controller.config.username;
      foscam.device.password     = controller.config.password;
      foscam.command             = 'PARAMS';

      foscam.callback = function (err, reply) {
        var params  = { value : '' };

        if (reply) {
          if (reply.toString().indexOf('var alarm_motion_armed=0') !== -1) {
            params.value = 'off';
          }

          else if (reply.toString().indexOf('var alarm_motion_armed=1') !== -1) {
            params.value = 'on';
          }

          callback(foscam.device.deviceId, null, 'ok', params);
        }

        else if (err) {
          callback(foscam.device.deviceId, 'err', 'err');
        }
      };

      this.send(foscam);
    },

    send : function (config) {
      var http      = require('http'),
          fs        = require('fs'),
          that      = this,
          filePath  = __dirname + '/../../images/foscam/images/' + Date.now() + '.jpg',
          foscam    = {},
          dataReply = '',
          request;

      foscam.deviceIp   = config.device.deviceIp;
      foscam.timeout    = config.device.localTimeout || config.config.localTimeout;
      foscam.username   = config.device.username;
      foscam.password   = config.device.password;
      foscam.command    = config.command             || '';
      foscam.devicePort = config.device.devicePort   || 80;
      foscam.callback   = config.callback            || function () {};

      if (foscam.command === 'TAKE') {
        fs.stat(filePath, function(err, data) {
          var request,
              postData;

          if (err) {
            request = require('request');
            postData = that.postPrepare(foscam);

            console.log('\x1b[35m' + config.device.title + '\x1b[0m: Saved image');

            request('http://' + postData.host + ':' + postData.port + postData.path).pipe(fs.createWriteStream(filePath));
          }

          else if (data) {
            console.log('\x1b[35m' + config.device.title + '\x1b[0m: Skipping image - already exists');
          }
        });
      }

      else {
        request = http.request(this.postPrepare(foscam), function (response) {
          response.on('data', function (response) {
            dataReply += response;
          });

          response.once('end', function () {
            if(dataReply) {
              foscam.callback(null, dataReply, true);
            }
          });
        });

        if (foscam.command === 'state') {
          request.setTimeout(foscam.timeout, function () {
            request.destroy();
            foscam.callback({ code : 'ETIMEDOUT' }, null, true);
          });
        }

        request.once('error', function (err) {
          if ((err.code !== 'ETIMEDOUT') || (foscam.command !== 'state')) {
            foscam.callback(err, null, true);
          }
        });

        request.end();
      }
    }
  };
}());
