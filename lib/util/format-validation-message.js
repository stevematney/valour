"use strict";

var _Object$keys = require("babel-runtime/core-js/object/keys")["default"];

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = formatValidationMessage;

function formatValidationMessage(message, values) {
  return _Object$keys(values).reduce(function (mess, key) {
    return mess.replace("{" + key + "}", values[key]);
  }, message);
}

module.exports = exports["default"];