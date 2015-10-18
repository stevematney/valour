'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _ValidationUnit = require('./ValidationUnit');

var _ValidationUnit2 = _interopRequireDefault(_ValidationUnit);

var _lodashFunctionThrottle = require('lodash/function/throttle');

var _lodashFunctionThrottle2 = _interopRequireDefault(_lodashFunctionThrottle);

var Valour = (function () {
  function Valour() {
    _classCallCheck(this, Valour);

    this.forms = {};
    this.callbacks = {};
  }

  _createClass(Valour, [{
    key: 'getForm',
    value: function getForm(name) {
      this.forms[name] = this.forms[name] || {};
      return this.forms[name];
    }
  }, {
    key: 'getCallbacks',
    value: function getCallbacks(name) {
      this.callbacks[name] = this.callbacks[name] || [];
      return this.callbacks[name];
    }
  }, {
    key: 'onUpdated',
    value: function onUpdated(name, callback) {
      if (!callback) {
        return;
      }
      var callbacks = this.getCallbacks(name);
      this.callbacks[name] = [].concat(_toConsumableArray(callbacks), [callback]);
    }
  }, {
    key: 'getRuleByName',
    value: function getRuleByName(form, ruleName) {
      return form[ruleName] || this.rule;
    }
  }, {
    key: 'register',
    value: function register(name, config, callback) {
      if (config === undefined) config = {};

      this.forms[name] = Object.keys(config).reduce(function (dest, ruleKey) {
        dest[ruleKey] = new _ValidationUnit2['default'](config[ruleKey]);
        return dest;
      }, {});
      this.onUpdated(name, callback);
    }
  }, {
    key: 'update',
    value: function update(name, config, callback) {
      var _this = this;

      if (config === undefined) config = {};

      var form = this.getForm(name);
      Object.keys(config).forEach(function (key) {
        form[key] = new _ValidationUnit2['default'](_this.getRuleByName(form, key), config[key]);
      });
      this.onUpdated(name, callback);
    }
  }, {
    key: 'getResult',
    value: function getResult(name) {
      var form = this.getForm(name);
      return Object.keys(form).reduce(function (result, key) {
        result[key] = form[key].getState();
        return result;
      }, {});
    }
  }, {
    key: 'runValidation',
    value: function runValidation(name, data) {
      var _this2 = this;

      var force = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

      var runCallback = (0, _lodashFunctionThrottle2['default'])(function () {
        var callbacks = _this2.getCallbacks(name);
        var result = _this2.getResult(name);
        callbacks.forEach(function (callback) {
          callback(result);
        });
      }, 100);
      var form = this.getForm(name);
      Object.keys(form).forEach(function (key) {
        if (data[key] === undefined && !force) {
          return;
        }
        form[key].runValidation(data[key], form, key).then(runCallback);
      });
    }
  }, {
    key: 'forceValidation',
    value: function forceValidation(name, data) {
      this.runValidation(name, data, true);
    }
  }, {
    key: 'isValid',
    value: function isValid(name) {
      var result = this.getResult(name);
      return !Object.keys(result).some(function (key) {
        return !result[key].valid;
      });
    }
  }, {
    key: 'rule',
    get: function get() {
      return new _ValidationUnit2['default']();
    }
  }]);

  return Valour;
})();

exports['default'] = new Valour();
module.exports = exports['default'];