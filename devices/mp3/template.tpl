
      <section id="{{DEVICE_ID}}" class="{{DEVICE_TYPE}}{{DEVICE_SELECTED}}{{DEVICE_STATE}}">
        <h1>{{i18n_MP3}} <em>{{DEVICE_ACTIVE}}</em></h1>
        <div class="text">
          <form class="text-form" action="/" method="get">
            <fieldset>
              <legend>{{i18n_TEXT_INPUT}}</legend>
              <label for="{{DEVICE_ID}}-text-input">{{i18n_TEXT_INPUT}}:</label>
              <input id="{{DEVICE_ID}}-text-input" class="text-input" type="text" name="{{DEVICE_ID}}" placeholder="{{i18n_TEXT_INPUT}}" required />
              <input class="input-type" type="hidden" value="text" name="type" />
              <button type="submit" class="button">{{i18n_SUBMIT}}</button>
            </fieldset>
          </form>
        </div>
      </section>