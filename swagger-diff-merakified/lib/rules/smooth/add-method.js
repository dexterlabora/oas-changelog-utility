"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = addMethod;

function htmlEntities(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function addMethod(_ref) {
  var kind = _ref.kind;
  var path = _ref.path;
  var lhs = _ref.lhs;
  var rhs = _ref.rhs;
  if (!rhs) {
    return;
  }

  var match = kind === "N" && path.length === 3 && path[0] === "paths";
  if (match) {
    var pathId = path[1];
    var method = path[2];

    var html = "Added endpoint method";
    // console.log("rhs", rhs);

    var responseKeys = Object.keys(rhs.responses);
    var responses = [];

    // responseKeys.forEach(r => {
    //   delete endpoint.responses[r].schema;
    //   responses.push(endpoint.responses[r]);
    // });
    var example = rhs.responses[responseKeys[0]].examples; // hard code first response.. maybe to opinionated
    var exampleString = "";
    if (example) {
      var exampleKeys = Object.keys(example);
      example = example[exampleKeys[0]];
      exampleString = JSON.stringify(example, null, 4);
    }
    html += `
      <br>
      <h4>${rhs.description}</h4>
      <i>${rhs.operationId}</i>
      
      <pre><code>${htmlEntities(exampleString)}</code></pre>
      <hr>
      `;

    return {
      message: `\`${pathId}\` - Added`,
      messageHtml: html,
      method: method,
      path: pathId,
      details: rhs
    };
  }
  return false;
}
module.exports = exports["default"];
