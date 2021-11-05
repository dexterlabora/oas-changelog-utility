"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = addResponse;

var _lodash = require("lodash.get");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function addResponse(_ref) {
  var kind = _ref.kind;
  var path = _ref.path;
  var lhs = _ref.lhs;
  var rhs = _ref.rhs;
  //paths,/devices/{serial}/switchPorts/{number},put,parameters,updateDeviceSwitchPort,schema,example,poeEnabled
  //paths,/networks/{networkId}/bluetoothClients/{bluetoothClientId},get,responses,200,examples,application/json,deviceName
  var match =
    kind === "N" &&
    (path.length === 5 || path[2] === "get") &&
    path[0] === "paths" &&
    path[3] === "responses";
  if (match) {
    var pathId = path[1];
    var method = path[2];
    var responseId = path[4];
    var param = path[path.length - 1];
    var definition = (0, _lodash2.default)(rhs, ["schema", "$ref"]);
    return {
      message: `\`${pathId}\` (${method}) - Response \`${responseId}\` added to (\`${definition ||
        rhs}\`)`,
      // messageHtml: `Response <code>${responseId}</code> : <code>${param}</code> with sample value (<code>${definition ||
      //   rhs}</code>)`,Optional property wan1 Added
      messageHtml: `Response property <code>${param}</code> value added`,
      //       <p>
      //       <pre><code>
      //   {
      //     ${param}: ${JSON.stringify(rhs)}
      //   }
      // </code></pre>
      //     </p>

      // `
      path: pathId,
      method: method,
      responseId: responseId
    };
  }
  return false;
}
module.exports = exports["default"];
