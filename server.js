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
// const request = require('request');
const methodOverride = require('method-override');
// const bmp = require('bmp-js')
// const writer = new (require('buffer-writer')());
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
app.use(express.static('./js/'));
app.use(methodOverride((req, res) => {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    console.log(req.body['_method']);
    let method = req.body['_method'];
    delete req.body['_method'];
    return method;
  }
}))


// Database Setup
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));


// Routes
app.get('/', home);
app.post('/login', login);
app.get('/creation/:id', createMap);
app.post('/selectmap/:id', saveMap);
app.get('/landing/:id', landing);


app.get('/viewmap/:id', viewMap);
app.get('/about', aboutPage);

app.delete('/savedMap/:id', deleteMap);

// =================================Routing Functions
// ======= Login
function login(req, res) {
  let username = req.body.uname;
  let password = req.body.pswd;
  let inDB = false;
  if(inDB) {
    res.render('pages/userMaps', {maps:[]}) //This should be postgres result.rows; 
  } else {
    let SQL = `INSERT INTO users (username, password)
              VALUES ($1, $2) RETURNING *`
    return client.query(SQL, [username, password])
      .then( result =>  res.redirect(`/creation/${result.rows[0].id}`)
      )
      .catch( err => {
        console.log('Add new user error')
        return handleError(err, res);
      })
  }
}
// ==========Login with Discord
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
  // request.post(response, function(error, response, body) {
  // })
  let uri = /* process.env.FRONTEND_URI || */ 'http://localhost:3000';
  res.redirect(uri);
  fetchUser(code);
}));

function fetchUser(code) {
  console.log("114", code)
  const URL = `https://discordapp.com/api/users/@me?Authorization=${code}`;

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


// Page Route Functions

function home(req, res) {
  res.render('pages/index');
}

function createMap(req, res) {
  res.render(`pages/creation`, {user_id:req.params.id});
}

function saveMap(req, res) {
  console.log('everything');
  // let newMap = new GenerateMap(req.body);
  // let mapArray = Object.values(newMap);
  let mapname = req.body.mapname;
  let mapdata = req.body.mapdata.replace(/\[/g, '{').replace(/\]/g, '}');
  console.log(mapdata)
  let uid = req.body.uid;
  // console.dir(req.body);
  let SQL = `INSERT INTO maps (mapname, mapdata, user_id) VALUES($1, $2, $3)`;
  return client.query(SQL, [mapname, mapdata, uid])
  .then(() =>  res.redirect(`/landing/${uid}`))
  .catch( err => {
    console.log('save map error');
    return handleError(err, res);
  })
}


function landing (req, res) {
  let SQL = 'SELECT * FROM maps WHERE user_id=$1';
  console.log('string', req.params.id);
  return client.query(SQL, [req.params.id])
    .then(result => { 
        // console.log( result);
        res.render(`pages/landing`, {maps:result.rows})})
    .catch (err => {
      console.log('landing error');
      return handleError(err, res);      
    })
}

function viewMap(req, res) {
  let SQL = 'SELECT * FROM maps WHERE id=$1';
  console.log(req.params.id);
  return client.query(SQL, [req.params.id])
  .then(result => {
    // console.log(result.rows);
    res.render(`pages/viewmap`, {maps:result.rows[0]})
  })
  .catch (err => {
    console.log('Error, could not view map');
    return handleError(err, res);
  }) 
}

function deleteMap (req, res) {
  client.query(`DELETE FROM maps WHERE id=$1 , [req.params.id]`)
    .then(result => {
      res.redirect('/landing/:id');
    })
    .catch (err => {
      console.log('Error, could not delete.');
      return handleError(err, res);
    })      
}


function aboutPage(req, res) {
  res.render('pages/about');
}










// Constructors
function GenerateMap(maps) {
  // parameters go here - one likely that ties userID to this map
  this.mapname = maps.mapname;
  this.mapdata = maps.mapdata;
  this.user_id; //fkey

}

// function User(user) {
//   this.userid;
//   this.username;
//   // saveUser(this, res);
// };


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

function handleError(error, res){
  console.error(error);
  res.render('pages/error', {error: error})
}
