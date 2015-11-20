var
  express = require('express')
  , app = express()
  , port = process.env.PORT || 3000
  , fs = require('fs')
;

var baseDir = '/Users/cybo/media';
var getClientIp = function(req) {
  var ipAddress = null;
  var forwardedIpsStr = req.headers['x-forwarded-for'];
  if (forwardedIpsStr) {
    ipAddress = forwardedIpsStr[0];
  }
  if (!ipAddress) {
    ipAddress = req.connection.remoteAddress;
  }
  return ipAddress;
};

var streamContent = function streamContent(req, res){
  var path = baseDir + decodeURI(req.path);
  console.log("Streaming %s to %s", path, getClientIp(req));
  var stat = fs.statSync(path);
  var total = stat.size;
  if (req.headers['range']) {
    var range = req.headers.range;
    var parts = range.replace(/bytes=/, "").split("-");
    var partialstart = parts[0];
    var partialend = parts[1];
 
    var start = parseInt(partialstart, 10);
    var end = partialend ? parseInt(partialend, 10) : total-1;
    var chunksize = (end-start)+1;
    // console.log('RANGE: ' + start + ' - ' + end + ' = ' + chunksize);
 
    var file = fs.createReadStream(path, {start: start, end: end});
    res.writeHead(206, { 'Content-Range': 'bytes ' + start + '-' + end + '/' + total, 'Accept-Ranges': 'bytes', 'Content-Length': chunksize, 'Content-Type': 'video/mp4' });
    file.pipe(res);
  } else {
    // console.log('ALL: ' + total);
    res.writeHead(200, { 'Content-Length': total, 'Content-Type': 'video/mp4' });
    fs.createReadStream(path).pipe(res);
  }
};


var fileFilter = function fileFilter(filename){
	console.log("Checking %s", filename);
	return !/\.(xml|txt)$/i.test(filename);

};

app.use(express.favicon());
app.use(express.directory(baseDir, {hidden: false, icons: false, filter: fileFilter}));
app.use(express.errorHandler({showStack: true, dumpExceptions: false}));

app.get("/ip", function(req, res){
  res.send("your ip = " + getClientIp(req));
});

app.get("*", streamContent);
// app.get("*", function(req, res){
	// res.send("doing something with " + decodeURI(req.path));
// });

app.listen(port, function(){
	console.log("Streaming server listening on port %s", port);

});
