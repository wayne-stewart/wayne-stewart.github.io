
var http = require("http");
var fs = require("fs");

const PORT = 8080;

const default_paths = ["/index.html","/default.html","/game.html"];

const send_404 = function(response) { 
	response.writeHead(404, {"Content-Type":"text/html"});
	response.end("error: 404 - file not found");
};

const send_302 = function(response, url) { 
	response.writeHead(302, {"Location":url});
	response.end();
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

const load_file = function(path, callback) {

};

const handle_request = function(request, response) {
    console.log(request.url);
	let path = join_path(__dirname, request.url);
    fs.readFile(path, function(error, data){
		if (error) { 
			if (error.code === 'EISDIR') {
				find_default_path(path, function(def_path) {
					if (def_path === null) { 
						send_404(response);
					} else {
                        path = join_path(path, def_path);
                        fs.readFile(path, function(error, data) {
                            if (error) {
                                send_404(response);
                            } else {
                                response.end(data);
                            }
                        });
					}
				});
			}
			else {
				send_404(response);
			}
		}
		else {
			response.end(data);
		}
    });
};

var server = http.createServer(handle_request);

server.listen(PORT, function(){
    console.log("Server Listening at http://localhost:" + PORT);
});
