#!/bin/sh
service cron start
node server.js
cron -f