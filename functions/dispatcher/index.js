console.log('starting function')
const http = require('http')
exports.handle = function(e, ctx, cb) {
  console.log('processing event: %j', e)
  var post_options = {
    host: '35.201.66.184',
    port: '80',
    path: '/',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(e))
    }
  }

  var post_req = http.request(post_options, function(res) {
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
        console.log('Response: ' + chunk);
        cb(null, JSON.parse(chunk))
    });
  });

  post_req.write(JSON.stringify(e));
  post_req.end();
  
}
