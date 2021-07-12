var express = require("express");
var router = express.Router();

// Retrieve settings from .env file
require('dotenv').config();

var astraRest = require("@astrajs/rest");
var astraClient;
var restBasePath = "/api/rest/v1/keyspaces/" + process.env.ASTRA_DB_KEYSPACE;
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

// Get all Todos
async function getTodos() {
    astraClient = await getAstraClient();
    var response = await astraClient.get(restBasePath + "/tables/todo/rows");
    return response;
}

// Listen
router.get("/", function(req, res, next) {
    getTodos().then(function(data){
        res.send(data.data.rows);
      }).catch(function(err){
        res.send("Exception: " + err);
      })
});

module.exports = router;