"use strict";

const SwaggerDiff = require("../../../swagger-diff-merakified");
const Levenshtein = require("damerau-levenshtein");

const TYPE_MAP = {
  errors: {
    name: "What's Changed"
  },
  renamed: {
    name: "What's Changed"
  },
  warnings: {
    name: "What's Changed"
  },
  infos: {
    name: "What's Updated"
  },
  new: {
    name: "What's New"
  },
  unmatched: {
    name: "Unmatched"
  },
  unmatchDiffs: {
    name: "UnmatchDiffs"
  }
};

/**
 * Provide a diff between two spec files
 * @param  {Object} oldSpec a valid swagger spec
 * @param  {Object} newSpec a valid swagger spec
 * @return {Promise}        resolves with an array of items
 * [
 *    {
 *      ruleId: 'delete-path',
 *      message: '/pet/findByStatus - Deleted',
 *      path: '/pet/findByStatus',
 *      type: 'error'
 *    }
 * ]
 */
function diff(oldSpec, newSpec, config) {
  return SwaggerDiff(oldSpec, newSpec, config).then(
    diff =>
      new Promise(resolve => {
        const retVal = [];
        for (let type in diff) {
          for (let item of diff[type]) {
            item.type = type;
            retVal.push(item);
          }
        }

        resolve(retVal);
      })
  );
}

/**
 * Detect a rename by comparing deleted paths/arguments with new paths/arguments
 * @example deleted: /foo/bar, added: /foo/bat should result in a renamed: /foo/bar -> /foo/bar
 *
 * @param  {Object} diff   a diff object from diff()
 * @param  {Object} config settings for detection:
 * {
 *  thresholds: { // settings for thresholds
 *    endpoint: float, set the ratio threshold that counts as a match, 0-1.0 (higher means closer)
 *    param: float, set the ratio threshold that counts as a match, 0-1.0 (higher means closer)
 *  }
 * }
 * @return {Object}        Any renamed items are removed from object and added to new location
 */
function detectRenames(diff, config) {
  console.log("detectRenames");
  let retVal = diff;
  const changes = {
    endpoints: {
      deleted: [],
      deletedObj: [],
      added: [],
      addedObj: []
    },
    args: {
      deleted: [],
      added: []
    }
  };

  config = config || {};
  // console.log("config", config);
  const thresholds = config.thresholds || {};

  const THRESHOLD_ENDPOINT =
    process.env.SC_THRES_ENDPOINT || thresholds.endpoint;
  const THRESHOLD_PARAM = process.env.SC_THRES_PARAM || thresholds.param;

  // console.log("THRESHOLD_ENDPOINT", THRESHOLD_ENDPOINT);
  // split out endpoints and params
  // console.log("let change of diff");
  for (let change of diff) {
    switch (change.ruleId) {
      case "delete-path":
        changes.endpoints.deleted.push(`\`${change.path}\``);
        changes.endpoints.deletedObj.push(change);
        break;
      case "add-path":
        change.type = "new";
        changes.endpoints.added.push(change.path);
        changes.endpoints.addedObj.push(change);
        break;
      case "add-required-param":
      case "add-param":
      case "add-optional-param":
        changes.args.added.push({
          param: change.param,
          path: change.path,
          method: change.method
        });
        break;
      case "delete-param":
        changes.args.deleted.push({
          param: change.param,
          path: change.path,
          method: change.method
        });
        break;
    }
  }

  // compare and look for similar items (this function is SLOW)
 
  for (let endpoint of changes.endpoints.deletedObj) {
    const deletedEndpointKeys = Object.keys(endpoint.details);
  

    const closest = changes.endpoints.addedObj.reduce(
      (best, addedEndpoint) => {
        
        try{
          const addedEndpointKeys = Object.keys(addedEndpoint.details);
        }catch(e){
          console.log('rename : parse error', e)
          console.log("endpoint ", endpoint);
          console.log("addedEndpoint ", addedEndpoint);
          const addedEndpointKeys = undefined
          return
        }
        
        
        if (
          endpoint.details[deletedEndpointKeys[0]] &&
          addedEndpoint.details[deletedEndpointKeys[0]]
        ) {
         
          const ldiff = new Levenshtein(
            JSON.stringify(
              endpoint.details[deletedEndpointKeys[0]].description
            ),
            JSON.stringify(
              addedEndpoint.details[deletedEndpointKeys[0]].description
            )
          );

         
          if (ldiff.similarity > best.similarity) {
            best.endpoint = addedEndpoint;
            best.similarity = ldiff.similarity;
          }
        }

        // console.log("best", best);
        return best;
      },
      { endpoint: "", similarity: 0 }
    );

    if (closest.similarity >= parseFloat(THRESHOLD_ENDPOINT)) {
      // we have  a match

      // strip out the add/deleted
      retVal = retVal.filter(item => {
        return !(
          (item.path === endpoint.path ||
            item.path === closest.endpoint.path) &&
          (item.ruleId === "delete-path" || item.ruleId === "add-path")
        );
      });

      // add the rename
      let diffRenameMsg = {
        ruleId: "rename-path",
        message: `Path \`${endpoint.path}\` renamed to \`${closest.endpoint.path}\``,
        messageHtml: `renamed to <code>${closest.endpoint.path}</code>`,
        path: endpoint.path,
        operations: Object.keys(endpoint.details).map((k) => endpoint.details[k].operationId),
        details: closest.endpoint.details,
        newOperations: Object.keys(closest.endpoint.details).map((k) => closest.endpoint.details[k].operationId),
        newPath: closest.endpoint.path,
        type: "renamed"
      };
      //console.log("diffRenameMsg", diffRenameMsg);
      retVal.push(diffRenameMsg);
    }
  }

 
  for (let param of changes.args.deleted) {
    // console.log("param ", param);
    const closest = changes.args.added.reduce(
      (best, addedParam) => {
        const ldiff = new Levenshtein(param.param, addedParam.param);
        if (ldiff.similarity > best.similarity) {
          best.param = addedParam;
          best.similarity = ldiff.similarity;
        }

        return best;
      },
      { param: {}, similarity: 0 }
    );

    if (closest.similarity >= (parseFloat(THRESHOLD_PARAM) || 0.75)) {
      // we have  a match
      // strip out the add/deleted
      retVal = retVal.filter(item => {
        return !(
          (item.path === param.path || item.path === closest.param.path) &&
          (item.ruleId === "add-required-param" ||
            item.ruleId === "add-param" ||
            item.ruleId === "add-optional-param" ||
            item.ruleId === "delete-param") &&
          (item.param === param.param || item.param === closest.param.param)
        );
      });

      // add the rename
      retVal.push({
        ruleId: "rename-param",
        message: `\`${param.path}\` (*${param.method}*) - Param \`${param.param}\` renamed to \`${closest.param.param}\``,
        messageHtml: `Param <code>${param.param}</code> renamed to <code>${closest.param.param}</code>`,
        path: param.path,
        method: param.method,
        param: param.param,
        newParam: closest.param.param,
        //newOperation: closest.param, // TESTING
        type: "renamed"
      });
    }
  }

  return retVal;
}

/**
 * Builds a changelog from a diff
 * @param  {Object} diff a diff array from diff()
 * @return {Object}      the resulting diff
 * {
 *  paragraph: string, the textual representation of the changelog
 *  items: string[], each item in an array for furthur modification
 *  diff: array, the entire diff
 * }
 */
function buildChangelog(diff) {
  console.log("buildChangelog");
  const retVal = {
    paragraph: "",
    messages: [],
    diff: diff,
    unmatched: []
  };

  /**
   * Set messages for each item
   */
  diff = diff.map(d => {
    d.name = TYPE_MAP[d.type].name;
    return d;
  });

  const messages = diff.reduce((res, item) => {
    if (item.ruleId == "edit-description") {
      res.push(
        `- **${TYPE_MAP[item.type].name}**: \`${
          item.descriptionPath
        }\` : Description Updated`
      );
    } else if (item.type == "unmatchDiffs") {
      return res;
    } else {
      if (item.messageHtml) {
        res.push(item.messageHtml);
      } else {
        res.push(`- **${TYPE_MAP[item.type].name}**: ${item.message}`);
      }
    }

    return res;
  }, []);

  // Array of messages
  retVal.messages = retVal.messages.concat(messages);

  // One string of all messages
  retVal.paragraph = retVal.messages.join("\n");
  return retVal;
}

/**
 * Generate a changelog between two swagger specs
 * @param  {Object} oldSpec a valid swagger spec
 * @param  {Object} newSpec a valid swagger spec
 * @param  {Object} config settings for detection:
 * {
 *  thresholds: { // settings for thresholds
 *    endpoint: float, set the ratio threshold that counts as a match, 0-1.0 (higher means closer)
 *    param: float, set the ratio threshold that counts as a match, 0-1.0 (higher means closer)
 *  }
 * }
 * @return {Promise}        resolves with an object @see buildChangelog
 */
function changelog(oldSpec, newSpec, config) {
  console.log("changelog");
  config = config || {};
  const detectConfig = {
    thresholds: config.thresholds || {}
  };

  return diff(oldSpec, newSpec, config)
    .then(res => {
      return buildChangelog(detectRenames(res, detectConfig));
    })
    .catch(err => {
      throw err;
    });
}

module.exports = {
  diff,
  detectRenames,
  buildChangelog,
  changelog
};
