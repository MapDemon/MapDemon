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
// const bmp = require('bmp-js')
// const writer = new (require('buffer-writer')());
require('dotenv').config();

require('./js/cartographer.js');

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
app.use(express.static('./js/'));


// Database Setup
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));


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
      scope: 'identify guilds guilds.join gdm.join bot messages.read' /* email connections guilds guilds.join gdm.join bot messages.read' */,
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
  console.log('71', code);
  request.post(response, function(error, response, body) {
    let uri = process.env.FRONTEND_URI || 'http://localhost:3000';
    res.redirect(uri + '?access_token=' + code);
  })
  fetchUser(code);
}));


// Route Functions

function home(req, res) {
  res.render('pages/index');
}

function createMap(req, res) {
  res.render('pages/creation');
}

function viewMap(req, res) {
  res.render('pages/viewmap');
}

function saveMap(req, res) {
}

function updateMap(req, res) {
  res.render('pages/viewmap');
  // add code to update map here
}

function deleteMap (req, res) {
}

function saveUser (req, res) {

}

function aboutPage(req, res) {
  res.render('pages/about');
}



function fetchUser(code) {
  console.log("114", code)
  const URL = `http://discordapp.com/api/users/@me?Authorization=${code}`;

  return superagent.get(URL)
  .then(result => {
    console.log('User info retreived from Discords');

    let user = new User(result.body.username);
    let SQL = `INSERT INTO users (username) VALUES($1)`;
    // needs schema for users

    // and store user in our DB
    return clientInformation.query(SQL, [username])
      .then( result => {
        result.status(200).send(result.rows[0]);
      })
  })
  .catch( err => {
    console.log('fetchUser error')
    return handleError(err, res);
  })
}






// Constructors
function Map(map) {
  // parameters go here - one likely that ties userID to this map
  this.mapName;
  this.adventure;
  this.mapId;
  this.mapData;
  this.userId; //fkey
}

function User(user) {
  this.userName;
  this.userId;
  this.isDM; //boolean
  // saveUser(this, res);
};


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
