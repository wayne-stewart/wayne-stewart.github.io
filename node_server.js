
var http = require("http");
var fs = require("fs");

const PORT = 8080;

const default_paths = ["/index.html","/default.html","/game.html"];

const send_404 = function(request, response) { 
	response.writeHead(404, {"Content-Type":"text/html"});
	response.end("error: 404 - file not found");
    console.log(`404 ${request.url}`);
};

const send_302 = function(request, response, url) { 
	response.writeHead(302, {"Location":url});
	response.end();
    console.log(`302 ${request.url} -> ${url}`);
};

const join_path = function(base, path) {
	if (base[base.length - 1] === "/")
		base = base.substring(0, base.length - 1);
	if (path[0] === "/")
		path = path.substr(1);
	return base + "/" + path;
};

const find_default_path = function(base_path, callback) { 
	const recurse = function(index) {
		let path = join_path(base_path, default_paths[index]);
		fs.stat(path, function(error, stats) { 
			if (!error && stats.isFile()) { 
				callback(default_paths[index]);
			} else { 
				index++;
				if (index < default_paths.length) { 
					recurse(index);
				} else {
					callback(null);
				}
			}
		});
	};
	recurse(0);
};

const handle_request = function(request, response) {
	let path = join_path(__dirname, request.url);
    fs.readFile(path, function(error, data){
		if (error) { 
			if (error.code === 'EISDIR') {
                if (!path.endsWith("/")) {
                    send_302(request, response, request.url + "/");
                } else {
                    find_default_path(path, function(def_path) {
                        if (def_path === null) { 
                            send_404(request, response);
                        } else {
                            path = join_path(path, def_path);
                            fs.readFile(path, function(error, data) {
                                if (error) {
                                    send_404(request, response);
                                } else {
                                    console.log(`200 ${request.url}`);
                                    response.end(data);
                                }
                            });
                        }
                    });
                }
			}
			else {
				send_404(request, response);
			}
		}
		else {
            console.log(`200 ${request.url}`);
			response.end(data);
		}
    });
};

var server = http.createServer(handle_request);

server.listen(PORT, function(){
    console.log("Server Listening at http://localhost:" + PORT);
});
