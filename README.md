# Getting started with DataStax Astra, Express and React (for dummies)
As I didn't create a full stack application before (mostly focussed on backe-end) I decided to figure it out and share my experience in this guide. Hence its *for dummies* name 😅.

This repository shows an end-to-end way to build a React front-end with an Express middle layer communicating to DataStax Astra.

![architecture diagram](images/astra-express-react.png)

For learning purposes you can start from scratch and just follow the commands. In that case don't clone this repo 😀.

Thanks to the nice guide by [João Henrique](https://www.freecodecamp.org/news/create-a-react-frontend-a-node-express-backend-and-connect-them-together-c5798926047c/)!

## 1️⃣ Set up the middle layer
### Generate the basic Express setup
```sh
npx express-generator api
```
### Change the port number for the middle layer
Inside the `api` directory, go to `bin/www` and change the port number on line 15 from `3000` to `9000`.
### Create a middle layer service
On `api/routes`, create a `testAPI.js` file and paste this code:
```js
var express = require("express");
var router = express.Router();

router.get("/", function(req, res, next) {
    res.send("API is working properly");
});

module.exports = router;
```
### Tell Express to use the new service
On the `api/app.js` file, insert a new route on line 24:
```js
app.use("/testAPI", testAPIRouter);
```
Ok, you are “telling” express to use this route but, you still have to require it. Let’s do that on line 9:
```js
var testAPIRouter = require("./routes/testAPI");
```
### Allow cross-origin requests in the middle layer
```sh
cd api
npm install --save cors
```
On your code editor go to the API directory and open the `api/app.js` file.
On line 6 require CORS:
```js
var cors = require("cors");
```
Now on line 18 “tell” express to use CORS:
```js
app.use(cors());
```
### 🚀 Test your new service
Build and start your middle layer:
```sh
cd api
npm install
npm start
```
Now browse to http://localhost:9000/testAPI and you will see the message: "API is working properly."

Congratulations! You just created an Express middle-layer that exposes a REST endpoint!

## 2️⃣ Set up the front-end
### Generate the basic Express setup
```sh
npx create-react-app front-end
```
### Call the middle layer API from the front-end
Update file `frontend/src/App.js` to the following:
```js
import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

class App extends Component{
  constructor(props) {
    super(props);
    this.state = { apiResponse: "" };
  }

  callApi() {
    fetch("http://localhost:9000/testAPI")
      .then(res => res.text())
      .then(res => this.setState({ apiResponse: res }))
      .catch(err => err);
  }

  componentDidMount() {
    this.callApi();
  }

    render() {
        return (
        <div className="App">
            <header className="App-header">
            <img src={logo} className="App-logo" alt="logo" />
            <p className="App-intro">{this.state.apiResponse}</p>
            </header>
        </div>
        );
    }
}

export default App;
```
### 🚀 Test the front-end, talking to the middle layer
Open another terminal and run:
```sh
cd front-end
npm start
```
Now browse to http://localhost:3000 and you will see the message: "API is working properly."

Congratulations! You just created a React front-end that calls a service in the Express middle-layer!

## 3️⃣ Let the middle layer communicate with the DataStax Astra backend
### Add dependencies
In the `api` directory run:
```sh
npm install @astrajs/collections @astrajs/rest@0.0.12 dotenv --save
```
### Set up Astra configuration
First create a `.env` file in the `api/` directory and fill in the correct settings for your database. You can find these on the Connect tab underneath the REST option in the Astra Management interface (https://astra.datastax.com).
```sh
ASTRA_DB_ID=
ASTRA_DB_REGION=
ASTRA_DB_KEYSPACE=
ASTRA_DB_APPLICATION_TOKEN=
```
### Call Astra REST endpoints
Then update the `testAPI.js` file to set up the connection with Astra and retrieve all tables in your keyspace:
```js
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

// Get all tables
async function getTables() {
    astraClient = await getAstraClient();
    var response = await astraClient.get(restSchemaPath);
    return response;
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
```
### 🚀 Watch the magic happen in the middle layer
Ctrl-c the middle layer and restart:
```sh
npm start
```
Now browse to http://localhost:9000/testAPI and you will see all tables in your keyspace.

### 🚀 Watch the magic happen in the browser
Reload your page and watch what happens on http://localhost:3000

## 4️⃣ Let's create a Todo front-end
### First create a todo schema in Astra
Browse to https://astra.datastax.com, log in to your CQL Console and switch to your keyspace by `use <keyspacename>;`.

Now let's create a simple table to store our todos:
```sql
CREATE TABLE todo (
  name text,
  date date,
  priority text,
  PRIMARY KEY ((name), date, priority)
)
WITH CLUSTERING ORDER BY (date DESC, priority ASC);
```
And let's store some data:
```sql
INSERT INTO todo (name, date, priority) VALUES ('Create back-end', '2020-07-12', 'high');
INSERT INTO todo (name, date, priority) VALUES ('Create front-end', '2020-07-13', 'high');
INSERT INTO todo (name, date, priority) VALUES ('Eat ice cream', '2020-07-14', 'low');
```
Great! We have a schema and some data to play with.
### Now expose this data through a middle-layer endpoint
In `api/routes` we'll create a new route called getTodos.js. As a simple starter `cp testAPI.js getTodos.js`.

Now update getTables() to the following:
```js
// Get all Todos
async function getTodos() {
    astraClient = await getAstraClient();
    var response = await astraClient.get(restBasePath + "/tables/todo/rows");
    return response;
}
```
Make sure to call the new function in the `get` function, like:
```js
// Listen
router.get("/", function(req, res, next) {
    getTodos().then(function(data){
        res.send(data.data.rows);
      }).catch(function(err){
        res.send("Exception: " + err);
      })
});
```
Now update `api/app.js` so that it knows there is a new route:
1. On line 11 add `var getTodosRouter = require("./routes/getTodos");`
2. On line 29 add `app.use("/getTodos", getTodosRouter);`

### 🚀 Watch the magic happen in the middle layer
Ctrl-c the middle layer and restart:
```sh
npm start
```
Now browse to http://localhost:9000/getTodos and you will see all your todos!

## 5️⃣ It's time to show our todo table in the front-end
In `frontend/src` we'll create a new renderer called Todos.js. As a simple starter `cp App.js Todos.js`. Our new renderer will be responsible for outputting a nicely formatted list of todos.

Update the file to match the following:
```js
import React, { Component } from 'react';
import './App.css';

class Todos extends Component{
  constructor(props) {
    super(props);
    this.state = { apiResponse: [{"name": "", "date": "", "priority": ""}] };
  }

  callApi() {
    fetch("http://localhost:9000/getTodos")
      .then(res => res.text())
      .then(res => this.setState({ apiResponse: JSON.parse(res) }))
      .catch(err => err);
  }

  componentDidMount() {
    this.callApi();
  }

  render() {
    return (
      <div class="container-fluid">
        <div class="row">
          <div class="col-md-12">
            <table class="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Date</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {this.state.apiResponse.map(item => (
                  <tr class={item.priority === "high" ? "table-danger" : "table-active"}>
                    <td>{item.name}</td>
                    <td>{item.date}</td>
                    <td>{item.priority}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

export default Todos;
```
Now we have to invoke it from the front-end. In `src/index.js` change the following:
1. On line 4 change App into Todo as: `import App from './App';`
2. On line 9 call the Todos rendering as: `    <Todos />`

And we also want some eye candy which means we'll include [Bootstrap](https://getbootstrap.com/). To enable the stylesheet, open `public/index.html` and add `<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">` right before the closing `</head>` tag.

### 🚀 Watch the magic happen in the browser
Reload your page and watch what happens on http://localhost:3000

Congratulations! You now know how to build an end-to-end app using APIs communicating with Astra!