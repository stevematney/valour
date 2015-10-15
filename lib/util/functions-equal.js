'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = functionsEqual;

function functionsEqual(func, compareFunc) {
  return '' + func === '' + compareFunc;
}

module.exports = exports['default'];