var express = require("express");
var router = express.Router();

// Retrieve settings from .env file
require('dotenv').config();

var astraRest = require("@astrajs/rest");
var astraClient;
var restBasePath = "/api/rest/v2/keyspaces/" + process.env.ASTRA_DB_KEYSPACE;
var restSchemaPath = "/api/rest/v1/keyspaces/" + process.env.ASTRA_DB_KEYSPACE + "/tables/";

// Create an astra client if not available
async function getAstraClient() {
    if (!astraClient) {
        astraClient = await astraRest.createClient({
            astraDatabaseId: process.env.ASTRA_DB_ID,
            astraDatabaseRegion: process.env.ASTRA_DB_REGION,
            authToken: process.env.ASTRA_DB_APPLICATION_TOKEN,
        });
    }
    return astraClient;
}

// Get all tables
async function getTables() {
    astraClient = await getAstraClient();
    var tables = await astraClient.get(restSchemaPath);
    return tables;
}

// Listen
router.get("/", function(req, res, next) {
    getTables().then(function(data){
        res.send(data.data);
      }).catch(function(err){
        res.send("Exception: " + err);
      })
});

module.exports = router;