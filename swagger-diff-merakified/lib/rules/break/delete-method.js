"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = addMethod;
function addMethod(_ref) {
  var kind = _ref.kind;
  var path = _ref.path;
  var lhs = _ref.lhs;
  var rhs = _ref.rhs;

  var match = kind === "D" && path.length === 3 && path[0] === "paths";
  if (match) {
    var pathId = path[1];
    var method = path[2];
    return {
      message: `\`${pathId}\` **${method}** - Method Deleted`,
      messageHtml: `Deleted Endpoint`,
      path: pathId,
      method: method,
      details: lhs
    };
  }
  return false;
}
module.exports = exports["default"];
