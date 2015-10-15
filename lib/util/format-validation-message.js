"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = formatValidationMessage;

function formatValidationMessage(message, values) {
  return Object.keys(values).reduce(function (mess, key) {
    return mess.replace("{" + key + "}", values[key]);
  }, message);
}

module.exports = exports["default"];