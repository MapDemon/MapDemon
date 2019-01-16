'use strict'

// Dependencies
const express = require('express');
const superagent = require('superagent');
const fetch = require('node-fetch');
const btoa = require('btoa');
const querystring = require('querystring');
const app = express();
const pg = require('pg');
const { catchAsync } = require('./utils');
const request = require('request');
require('dotenv').config();

// Load environment variables from .env file
const PORT = process.env.PORT || 3000;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const redirect = encodeURIComponent(`http://localhost:${PORT}/callback`);
const redirect_uri = process.env.REDIRECT_URI || `http://localhost:${PORT}/callback`;

// Application Setup
app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: true}));
app.use(express.static('./public'));



// Database Setup
// const client = new pg.Client(process.env.DATABASE_URL);
// client.connect();
// client.on('error', err => console.error(err));


// Routes
app.get('/', home);
app.get('/creation', createMap);
app.get('/viewmap', viewMap);
app.get('/about', aboutPage);

app.post('/viewmap/:id', saveMap);
app.put('/viewmap', updateMap);
app.delete('/savedMap/:id', deleteMap);


// maybe move '/login' route to here if we decide to reduce down to one JS file?
app.get('/login', (req, res) => {
  res.redirect('https://discordapp.com/oauth2/authorize?' +
    querystring.stringify({
      client_id: process.env.CLIENT_ID,
      scope: 'identify' /* email connections guilds guilds.join gdm.join bot messages.read' */,
      type: 'code',
      response_type: 'code',
      redirect_uri
      })
)});

app.get('/callback', catchAsync(async (req, res) => {
  if (!req.query.code) throw new Error('NoCodeProvided');
  let code = req.query.code || null;
  const creds = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
  const response = await fetch(`https://discordapp.com/api/oauth2/token?grant_type=authorization_code&code=${code}&redirect_uri=${redirect}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creds}`,
      },
    });
  const json = await response.json();
  console.log(code);
  request.post(response, function(error, response, body) {
    let uri = process.env.FRONTEND_URI || 'http://localhost:3000';
    res.redirect(uri + '?access_token=' + code);
  })
}));


// Route Functions

function home(request, response) {
  response.render('pages/index');
}

function createMap(request, response) {
  response.render('pages/creation');
}

function viewMap(request, response) {
  response.render('pages/viewmap');
}

function saveMap(req, res) {
}

function updateMap(request, response) {
  response.render('pages/viewmap');
  // add code to update map here
}

function deleteMap (req, res) {

}

function aboutPage(request, response) {
  response.render('pages/about');
}



function fetchUser(query) {
  const URL = `http://discordapp.com/api/users/@me?Authorization=${code}`;

  return superagent.get(URL)
  .then(result => {
    console.log('User info retreived from Discords');

    let dm = new DM(results.body.username);
    let SQL = `INSERT INTO`;
    // needs schema for users

    // and store user in our DB
    return clientInformation.query(SQL, [])
      then(() => {
        return dm;
      })
  })
}






// Constructors
function Map(map) {
  // parameters go here - one likely that ties userID to this map
}


// Server Listener
app.listen( PORT, () => console.log(`LISTENING ON PORT:${PORT}`));

// Error Handlers
app.use((err, req, res, next) => {
  switch (err.message) {
  case 'NoCodeProvided':
    return res.status(400).send({
      status: 'ERROR',
      error: err.message,
    });
  default:
    return res.status(500).send({
      status: 'ERROR',
      error: err.message,
    });
  }
});
