#!/bin/sh
NODE_ENV=production node app.js
cd /home/kaiba/program/waketi_chat
forever stop app.js
forever restart app.js

