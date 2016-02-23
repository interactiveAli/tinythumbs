// TERMINAL:
// If express not installed...
// $ npm install express --save
// $ npm install body-parser --save
// $ npm install cookie-parser --save
// $ npm install multer --save
// $ npm install archiver --save
// Navigate to tinythumbs directory and start app...
// tinythumbs $ node start.js


var express = require('express'),
  app = express(),
  bodyParser = require('body-parser'),
  util = require('util'),
  path = require('path'),
  fs = require('fs'),
  archiver = require('archiver');

app.use(express.static(__dirname));

// Create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })

// Create uploads folder
fs.mkdir('uploads', function(err){
  if (err) {
    console.error(err);
  }else{
    console.log("Directory 'uploads' created successfully!");
  }
})

// This responds with the homepage
app.get('/', function (req, res) {
   console.log("Got a GET request for the homepage");
   res.sendFile( __dirname + "/" + "index.htm" );
})

app.post('/getZip', urlencodedParser, function (req, res) {

  var session = req.body.session,
    dirPath = 'uploads/'+ req.body.session,
    fs = require('fs'),
    archiver = require('archiver'),
    filepath = __dirname + '/' + dirPath + '.zip',
    output = fs.createWriteStream(filepath),
    archive = archiver('zip');

  output.on('close', function () {
      console.log(archive.pointer() + ' total bytes');
      console.log(filepath + " has been created successfully.");
      res.send([(dirPath+'.zip')]);
  });

  archive.on('error', function(err){
      throw err;
  });

  archive.pipe(output);
  archive.bulk([
      { expand: true, cwd: (__dirname + '/' + dirPath), src: ['**'], dest: session}
  ]);
  archive.finalize();

})

app.post('/uploadImage', urlencodedParser, function (req, res) {
  var image = 
  JSON.parse(req.body.image);
  var fs = require('fs');
   // Prepare output in JSON format
  var response = {
    session: req.body.session,
    fileExt: image.fileExt,
    fileName: image.filename + "." + image.fileExt,
    index: image.index,
    imageSrc: image.src,
    dirPath: 'uploads/'+ req.body.session
  };  

  // Create session directory
  fs.mkdir(response.dirPath, function(err){
    if (err) {
      console.error(err);
    }else{
      console.log("Directory " + response.dirPath + " created successfully!");
    }
    
    //Proceed with file creation
    fs.stat(response.dirPath, function(err, stats){
      if (err) {
        console.log(err);
      }
        
      console.log(stats);
      createImgFile(response, fs);
      res.send(response);
      
    });
  });  
 
})

function createImgFile(resp, fs){
var data,
    filePath;

  if (resp.imageSrc.indexOf('data:image/') > -1) {
    resp.imageSrc = setImgType(resp.imageSrc);
  }else{
    var error = resp.fileName + " is not a supported image file.";
    console.log(error);
    resp.result.push(error);
  }

  // strip off the data: url prefix to get just the base64-encoded bytes
  data = resp.imageSrc.replace(/^data:image\/\w+;base64,/, "");
  buf = new Buffer(data, 'base64');

  filePath = resp.dirPath + '/' + resp.fileName;

  fs.writeFile(filePath, buf,  
    function(err) {
     if (err) {
         return console.error(err);
     }
     console.log("Data written successfully and file created at '" + filePath + "'!");
  })
}

function setImgType(imgData){
  
    if (imgData.indexOf('data:image/png;base64,') > -1) {
      return imgData.replace('data:image/png;base64,', '');
    }
    if (imgData.indexOf('data:image/jpeg;base64,') > -1) {
      return imgData.replace('data:image/jpeg;base64,', '');
    }
  
}

var server = app.listen(1111, function () {

  var host = server.address().address
  var port = server.address().port

  console.log("Access tinythumbs interface at http://%s:%s", host, port)

})
