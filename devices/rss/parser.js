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

(function (exports){
  'use strict';

  exports.rss = function (deviceId, markup, state, value, fragments) {
    var template   = fragments.item,
        tempMarkup = '',
        i          = 0,
        text       = '';

    if((state) && (value)) {
      for(i; i < value.length; i += 1) {
        text       = value[i].description ? value[i].description : value[i].text;
        tempMarkup = tempMarkup + template.split('{{RSS_URL}}').join(value[i].url);
        tempMarkup = tempMarkup.split('{{RSS_TITLE}}').join(value[i].title);
        tempMarkup = tempMarkup.split('{{RSS_DESCRIPTION}}').join(text);
      }
    }

    markup = markup.replace('{{RSS_DYNAMIC}}', tempMarkup);

    return markup;
  };
})(typeof exports === 'undefined' ? this.SB.spec.parsers : exports);
