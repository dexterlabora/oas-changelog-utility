const express = require('express');
const fetch = require('node-fetch');
const genLogs = require('./genLogs');

const router = express.Router();

// Generate a Changelog Diff based on two Spec URLs or JSON strings
router.post('/diff', async function (req, res) {
  const {
    oldSpec,
    newSpec,
    format
  } = req.body;

  const data = await genLogs(oldSpec, newSpec);
  //   console.log('genLogs data ', data);

  if (format) {
    if (format === "markdown") {
      res.status(200)
      res.send(data.markdown);
    } else if (format === "html") {
      res.status(200)
      res.send(data.html);
    } else if (format === "csv") {
      res.status(200)
      res.send(data.csv);
    
    }
    
  } else {
    res.status(200).json(data);
  }



  //res.status(200).json(data);
});


// Returns the latest changelog
// http://localhost:3000/swagger/diff?markdown&latestBeta

router.get("/diff", async function (req, res) {
  //console.log('GET /diff')
  const format = req.query.format;


  const latestBeta = req.query.latestBeta === '' || Boolean(req.query.latestBeta) || false;
  const organizationId = req.query.organizationId;
  const authHeader = req.headers.authorization;
  console.log("authHeader", authHeader)
  const markdown = req.query.markdown === '' || Boolean(req.query.markdown) || false;
  const html = req.query.html === '' || Boolean(req.query.html) || false;
  const csv = req.query.html === '' || Boolean(req.query.csv) || false;

  var oldSpec;
  var newSpec;

  if (organizationId) {
    // Compare Org spec to latest Beta
    const adminSpec = await fetchMerakiAdminSpec(organizationId, authHeader)

    oldSpec = `https://raw.githubusercontent.com/meraki/openapi/v1-beta/openapi/spec2.json`
    newSpec = adminSpec
   // data = await genLogs(`https://raw.githubusercontent.com/meraki/openapi/v1-beta/openapi/spec2.json`, adminSpec);

  } else {
    // Defaults to Latest vs Previous GA

    const releases = await fetchReleases();
    //console.log("releases", releases);

    const filteredReleases = releases.filter(r => r.prerelease === Boolean(latestBeta))
    //console.log('filteredReleases', filteredReleases)

    const latestApiRelease = filteredReleases[0].tag_name
    const prevApiRelease = filteredReleases[1].tag_name;

    console.log('generating diff logs for', prevApiRelease, latestApiRelease)
    oldSpec = `https://raw.githubusercontent.com/meraki/openapi/${prevApiRelease}/openapi/spec2.json`
    newSpec = `https://raw.githubusercontent.com/meraki/openapi/${latestApiRelease}/openapi/spec2.json`
    // data = await genLogs(`https://raw.githubusercontent.com/meraki/openapi/${prevApiRelease}/openapi/spec2.json`, `https://raw.githubusercontent.com/meraki/openapi/${latestApiRelease}/openapi/spec2.json`);
  }

  const data = await genLogs(oldSpec, newSpec);


  if (markdown || format === "markdown") {
    res.status(200)
    res.send(data.markdown);
  } else if (html || format === "html") {
    res.status(200)
    res.send(data.html);
  } else if (csv || format === "csv") {
    res.status(200)
    res.send(data.csv);
  } else if (format === "diffMin") {
    res.status(200)
    res.send(data.diffMin);
  } else if (format === "diff") {
    res.status(200)
    res.send(data.diff);
  } else {
    res.status(200).json(data);
  }
});

// helper functions
function fetchReleases() {
  const url = "https://api.github.com/repos/meraki/openapi/releases";
  const options = {
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Gitlab"
    }
  };
  return fetch(url, options)
    .then(response => response.json())
    .then(data => {
      //console.log(data)
      return data
    });
}

// helper functions
function fetchMerakiAdminSpec(orgId, authHeader) {
  const url = `https://api.meraki.com/api/v1/organizations/${orgId}/openapiSpec` || "https://api.meraki.com/api/v1/openapiSpec";
  const options = {
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "oas-changelog-utility"
    }
  };
  options.headers.authorization = authHeader
  console.log("options", options)
  return fetch(url, options)
    .then(response => response.json())
    .then(data => {
      console.log(data)
      return data
    });
}
module.exports = router;