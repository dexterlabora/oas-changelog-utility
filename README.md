# oas-changelog-utility

> A REST service and Web page to generate OpenAPIv2 changelogs



## Build, Start Service

```bash
$ yarn
$ node index.js
start to listen 3000

```

## Web Interface

http://localhost:3000

A simple VueJS application to interact with the REST API and generate changelogs
`./index.html`


## REST Interface

`POST /swagger/diff`

> **Body Parameters**
> `format`   Enum: `markdown, html, diff, diffMin, csv`
> `oldSpec`  A URL or contents of a valid OpenAPIv2 Spec
> `newSpec`  A URL or contents of a valid OpenAPIv2 Spec

```json
{
    "format": "csv",
    "oldSpec": "https://raw.githubusercontent.com/meraki/openapi/master/openapi/spec2.json",
    "newSpec": "https://raw.githubusercontent.com/meraki/openapi/v1-beta/openapi/spec2.json"
}
```

*Response*
```csv
"ruleId","message","path","method","property","type","name","group","category","service","param"
"add-optional-object-property","`paths//networks/{networkId}/appliance/vlans/post/parameters/createNetworkApplianceVlan/schema`
- Optional property `ip6` Added","/networks/{networkId}/appliance/vlans","post","ip6","infos","What's
Updated","appliance","configure","vlans",...
```

```
- [What's New](#whats-new)
* [\[ networks \]](#-networks-)
+ [webhooks](#webhooks)
- [List the webhook payload templates for a network](#list-the-webhook-payload-templates-for-a-network)
- [Create a webhook payload template for a network](#create-a-webhook-payload-template-for-a-network)
- [Get the webhook payload template for a network](#get-the-webhook-payload-template-for-a-network)
- [Update a webhook payload template for a network](#update-a-webhook-payload-template-for-a-network)
- [Destroy a webhook payload template for a network. Does not work for included templates ('wpt\_00001', 'wpt\_00002' or
```

Org / BetaAlpha Changelog
`GET /swagger/diff`

> **Query Options**
> `format`  markdown, html, diff, diffMin, csv
> `organizationId`  Your Meraki Organization ID




Custom Spec against Meraki Organization

```
curl --location --request GET 'http://localhost:3000/swagger/diff?format=markdown&organizationId=<ORGANIZATION_ID>' --header 'Content-Type: application/json' --header 'Authorization: Bearer <MERAKI_API_KEY>' --data-raw ''
```
```
- [What's New](#whats-new)
* [\[ wireless \]](#-wireless-)
+ [ssids](#ssids)
- [Reset configuration and stats for an MR SSID](#reset-configuration-and-stats-for-an-mr-ssid)
- [Show Umbrella protection on an SSID](#show-umbrella-protection-on-an-ssid)
- [Apply Umbrella protection on an SSID of an MR network](#apply-umbrella-protection-on-an-ssid-of-an-mr-network)
- [Status of applying Umbrella protection on an SSID of an MR
network](#status-of-applying-umbrella-protection-on-an-ssid-of-an-mr-network)
* [\[ sm \]](#-sm-)
+ [tags](#tags)
- [List the tags on this node group](#list-the-tags-on-this-node-group)
- [Add a new tag](#add-a-new-tag)
- [Show a specific tag](#show-a-specific-tag)
- [Update a tag](#update-a-tag)
- [Delete a tag](#delete-a-tag)
- [Get the devices in scope of this tag](#get-the-devices-in-scope-of-this-tag)
```


## Dev Notes

based on `swagger-diff` and `swagger-changelog`
most customizations are with the `message` parameter formatting, detectecting renames and enriching the data.

## gcloud push

gcloud functions deploy meraki-changelog --runtime nodejs10 --trigger-http --entry-point app --memory 512M
