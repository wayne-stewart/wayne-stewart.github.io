/**************************************************************************
 * This server should only be used for development
 * It is not hardened for production use.
 *
 * Run: 
 * node server.js
 *************************************************************************/

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

const send_200 = function(request, response, local_path, data) {
    response.writeHead(200, {
        "Content-Type":find_content_type(local_path),
        "Cache-Control": "max-age=600"});
    response.end(data);
    console.log(`200 ${request.url}`);
};

const find_content_type = function(path) {
    let extension_index = path.lastIndexOf(".");
    if (extension_index === -1) {
        throw `can't find content type: ${path}`;
    }
    let extension = path.substring(extension_index);
    switch (extension) {
        case ".html": return "text/html; charset=utf-8";
        case ".css": return "text/css; charset=utf-8";
        case ".js": return "text/javascript; charset=utf-8";
        case ".png": return "image/png";
        case ".jpg": return "image/jpeg";
        case ".gif": return "image/gif";
        case ".svg": return "image/svg+xml";
        case ".ico": return "image/x-icon";
        case ".txt": return "text/plain";
        default: throw `unknown content type: ${path}`;
    }
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
                                    send_200(request, response, def_path, data);
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
            send_200(request, response, path, data);
		}
    });
};

var server = http.createServer(handle_request);

server.listen(PORT, function(){
    console.log("Server Listening at http://localhost:" + PORT);
});
