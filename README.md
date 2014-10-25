CloudScrum (drive)
==========

CloudScrum is a tool for management and monitoring of development process for Scrum agile method.

The aim of this app is to save stories and tasks using Google Drive spreadsheets.

## Getting Started

By default app needs to run under [localhost:12345](http://localhost:12345) address (due to GoogleDrive API key configuration) but you can generate your own API key using [Google apis](https://code.google.com/apis/console/) and update it in [js/services/google.js](js/services/google.js) file (`clientId` and `apiKey` variables).

If you don't want to generate your own API key and need simple server, you can use [mongoose](https://code.google.com/p/mongoose/) and configure it to run on port 12345 or use python builtin server:

```sh
$ python -m http.server 12345
```

## Proxy

Since there is no possibility to export Google Spreadsheets using JS, application is using simple proxy to get the data. You can find the source code [here](https://gist.github.com/Nazin/ceb33b7e25fa93721b7f) and its configuration in application in [js/services/google.js](js/services/google.js) file (`proxyLink` variable).

## Mobile application

There is also Android application, which allows to measure time for tasks assigned to the user. You can find it [here](https://github.com/Nazin/CloudScrum-drive-mobile).

## Basic Version

You can also check [basic version](https://github.com/Nazin/CloudScrum) built using node.js.
