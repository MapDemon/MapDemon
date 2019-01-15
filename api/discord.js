'use strict';

const express = require('express');
const fetch = require('node-fetch');
const btoa = require('btoa');
const querystring = require('querystring');
// const app = express();
const request = require('request');
const superagent = require('superagent');
const { catchAsync } = require('../utils');

const router = express.Router();


//.env variables
const PORT = process.env.PORT || 3000;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const redirect = encodeURIComponent(`http://localhost:${PORT
}/api/discord/callback`);
const redirect_uri = process.env.REDIRECT_URI || `http://localhost:${PORT}/api/discord/callback`;

// app.use(express.static('./')); (disabled due to no app = express call)
// router.use('../', require('../'));

router.get('/login', (req, res) => {
  res.redirect('https://discordapp.com/oauth2/authorize?' +
    querystring.stringify({
      client_id: process.env.CLIENT_ID,
      scope: 'identify' /* email connections guilds guilds.join gdm.join bot messages.read' */,
      type: 'code',
      response_type: 'code',
      redirect_uri
      })
)});

router.get('/callback', catchAsync(async (req, res) => {
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
  /*
  
  1/13
  currently, the site console.logs the access token, and adds it to the URL.
  need to remove it again, as it's a security risk, but leaving it here for now
  
  https://www.youtube.com/watch?v=f5OLDvwP-Ug
  question: above link still has different backend and frontend - is this considered good practice?
  we currently don't have a different frontend and backend.

  might need different view to direct users towards? or how do we make our site recognize that we have an access token then make relevant changes and pulls from the Discord API? (likely reasons why we need to get POSTMAN access!)
  
  connect to this to retrieve user data: https://discordapp.com/users/@me

  */
  })
}));

// KP - this is copied over from my Lab 08, will need to convert so it works properly
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

module.exports = router;
