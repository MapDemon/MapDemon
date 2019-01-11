'use strict';

const express = require('express');

const router = express.Router();


//.env variables
const PORT = process.env.PORT || 3000;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const redirect = encodeURIComponent(`http://localhost:${PORT}/api/discord/callback`);

app.use(express.static('./'));


router.get('/login', (req, res) => {
  res.redirect(`https://discordapp.com/oauth2/authorize?client_id=${CLIENT_ID}&scope=identify&response)type=code&redirect_uri=${redirect}`);
});

module.exports = router;
