var express = require('express');
var path = require('path');
var app = express();

app.get('/', function (req, res) {
  var index = path.join(__dirname, '..', 'view', 'index.html');
  res.sendFile(index);
});

app.post('/test-ssn', function (req, res) {
  console.log('testing ssn!');
  setTimeout(function () {
    res.send(JSON.stringify({ valid: true }));
  }, 5000);
});

app.use('/static', express.static(path.join(__dirname, '..', 'view', 'content')));

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
