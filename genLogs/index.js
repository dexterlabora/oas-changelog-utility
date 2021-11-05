const writeHtml = require("./writeFiles/html");
//const writeJsonFile = require('./writeFiles/json');
const writeMarkdownFile = require("./writeFiles/markdown");
const SwaggerParser = require("swagger-parser");

const changelog = require("../swagger-changelog-merakified").changelog;
const mergeSpecWithChanges = require("./mergeSpec");

const config = {
  // verbosity
  changes: {
    breaks: 2,
    smooths: 1
  },
  // sensitivity
  thresholds: {
    param: 0.9,
    endpoint: 0.9
  }
};

function isJson(item) {
  item = typeof item !== "string" ? JSON.stringify(item) : item;

  try {
    item = JSON.parse(item);
  } catch (e) {
    return false;
  }

  if (typeof item === "object" && item !== null) {
    return true;
  }

  return false;
}

module.exports = async function genLogs(
  oldSpecSrc,
  newSpecSrc
  //location = './output'
) {

  // const oldSpec = isJson(oldSpecPath)
  //   ? await SwaggerParser.parse(JSON.parse(oldSpecPath))
  //   : await SwaggerParser.parse(oldSpecPath);
 
  // console.log('oldSpec', oldSpec.info.version);
  // const newSpec = isJson(newSpecPath)
  //   ? await SwaggerParser.parse(JSON.parse(newSpecPath))
  //   : await SwaggerParser.parse(newSpecPath);
  // console.log('newSpec', newSpec.info.version);

  const oldSpec = await SwaggerParser.parse(oldSpecSrc);
  console.log('oldSpec', oldSpec.info.version);
  const newSpec = await SwaggerParser.parse(newSpecSrc);
  console.log('newSpec', newSpec.info.version);

  context = {};

  context.oldVersion = oldSpec.info.version; //.info.version; //.info.version;
  context.newVersion = newSpec.info.version;
  console.log("oldVersion", context.oldVersion);
  console.log("newVersion", context.newVersion);

  console.log("generating changelog");
  const log = await changelog(oldSpec, newSpec, config);

  //console.log('mergeSpecWithChanges');
  const res = await mergeSpecWithChanges(log.diff, newSpec);
  const diff = res;

  //console.log('set uniqueNames');
  context.uniqueNames = [...new Set(diff.map(item => item.name))].sort((a, b) => (a.name > b.name) ? 1 : -1);

  context.uniqueGroups = [...new Set(diff.map(item => item.group))].sort((a, b) => (a.group > b.group) ? 1 : -1);

  context.uniqueServices = [...new Set(diff.map(item => item.service))].sort((a, b) => (a.service > b.service) ? 1 : -1);

  context.uniqueMethods = [...new Set(diff.map(item => item.method))].sort((a, b) => (a.method > b.method) ? 1 : -1);

  // diff Statisitcs
  let newEndpointCount = 0;
  let newSpecKeys = Object.keys(newSpec.paths);
  if(oldSpec.paths && newSpec.paths){
    try{
      console.log('generating diffStats')
      newSpecKeys.forEach(k => newEndpointCount += Object.keys(newSpec.paths[k]).length)  
    }catch(e){
      console.log('could not generate diffStats', e)
    }

    context.diffStats =  {
      "new": diff.filter(d => d.name === "What's New").length,
      "updated": diff.filter(d => d.name === "What's Updated").length,
      "totalSpecEndpoints": newEndpointCount,
      "totalPaths": newSpecKeys.length
    };
    console.log('diffStats: ', context.diffStats)
  }

  context.diff = diff;

  // add hyperlinks to docs for each operation
  context.diff.map(d => {
    if (!d.apiDetails) {
      return;
    }
    if (!d.apiDetails.operationId) {
      return;
    }
    // new PubHub site
    // d.docUrl =
    //   "https://testing-developer.cisco.com/docs/meraki-interactive-api-doc/#!" +
    //   d.apiDetails.operationId.replace(
    //     /([A-Z])/g,
    //     g => `-${g[0].toLowerCase()}`
    //   );

  
    d.docUrl =
      "https://developer.cisco.com/meraki/api/#/rest/api-endpoints/" +
      d.apiDetails.tags[0].toLowerCase() +
      "/" +
      d.apiDetails.operationId.replace(
        /([A-Z])/g,
        g => `-${g[0].toLowerCase()}`
      );
  });

  //writeJsonFile(context, location);
  console.log("generating html");
  const html = writeHtml(context);
  console.log("generating markdown");
  const markdown = writeMarkdownFile(context);
  //console.log('markdown ', markdown);
  context.html = html;
  context.markdown = markdown;
  context.diffMin = context.diff.filter(d => d.type !== "unmatchDiffs").map(d => { 
      
    delete d.messageHtml;
    delete d.details;
    delete d.objectPath;
    return d;
  });

  // Generate CSV
  try{
    console.log("generating CSV");
    const {parse} = require('json2csv')
    context.csv = parse(context.diffMin)
  }catch(e){
    context.csv = ""
  }
  
  const results = {
    diff: context.diff,
    diffMin: context.diffMin,
    csv: context.csv,
    markdown: context.markdown,
    html: context.html,
    oldVersion: context.oldVersion,
    newVersion: context.newVersion
  };
  return results;
};
