var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var multer = require('multer');
var app = express();
var upload = multer();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function (req, res) {
  var index = path.join(__dirname, '..', 'view', 'index.html');
  res.sendFile(index);
});

app.post('/test-ssn', upload.fields(), function (req, res) {
  setTimeout(function () {
    var valids = ['123456789'];
    var ssn = (req.body.ssn || '').replace(/[^0-9]/, '');
    res.send(JSON.stringify({ valid: valids.indexOf(ssn) > -1 }));
  }, 5000);
});

app.use('/static', express.static(path.join(__dirname, '..', 'view', 'content')));

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
