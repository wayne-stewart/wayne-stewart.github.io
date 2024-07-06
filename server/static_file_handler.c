/*
	Static File Handler
*/

/* try to open file to serve. if path is a directory
 * try to open the default file index.html.
 * return value is a file descriptor.
 * return -1 if file cannot be found.
 * return -2 if a 302 should be sent with appended / */
int try_open_file_or_default(PHttpRequest request) {
		
	char path_buffer[1024] = {0};

	int uri_length = strlen(request->uri);
	// -1 to always leave a terminating 0 at the end
	int buffer_length = ARRAY_SIZE(path_buffer) - 1;
	int path_length = 0;

	// if the final character is a slash try to open
	// the default index.html file in the directory
	// we know from the regex uri validation that the first
	// character will always be a slash
	if (request->uri[uri_length - 1] == '/') {
		path_length = snprintf(path_buffer, buffer_length, ".%sindex.html", request->uri);
	} else {
		path_length = snprintf(path_buffer, buffer_length, ".%s", request->uri);
	}

	// path was greater than the buffer so return error
	if (path_length == buffer_length) return 0;

	// tolower all characters in the path
	// all served files should be lower case
	for(int i = 0; path_buffer[i] != '\0'; i++) {
		path_buffer[i] = tolower(path_buffer[i]);
	}

	// path could not be found as a file or dir so return error
	struct stat stat_buffer;
	if (lstat(path_buffer, &stat_buffer) != 0) return -1;

	// path found, open for reading and return the file descriptor
	if (S_ISREG(stat_buffer.st_mode)) {
		request->response.content_type = http_get_content_type_from_file_path(path_buffer, path_length);
		return open(path_buffer, O_RDONLY);
	}
	
	// path is a directory but it did not end in a '/'
	// send back a code to inform the the caller a 302
	// should be generated with the / at the end.
	if (S_ISDIR(stat_buffer.st_mode)) {
		return -2;
	}

	// no path could be found so return error
	return -1;
}

void serve_static_file(PHttpRequest request)
{
	int file_fd = try_open_file_or_default(request);
	
	if (file_fd == -1) { 
		send_404(request);
		return;
	}

	if (file_fd == -2) {
		char path_302[1024] = {0};
		snprintf(path_302, ARRAY_SIZE(path_302) - 1, "%s/", request->uri);
		send_302(request, path_302);
		return;
	}
	
	struct stat file_stat;
	fstat(file_fd, &file_stat);
	off_t file_size = file_stat.st_size;
	request->response.status_code = 200;
	request->response.content_length = file_size;
	send_header(request);
	send_file(request->client_fd, file_fd);
	close(file_fd);
}

/*
	StaticFileHandler
	Run the next middleware in the chain if it exists.
	If no middleware handled the request ( status_code == 0 ),
	then try to look for a file to send as the response.

	TODO: try caching the file so we don't have to stream from disk
		  as often.
*/
void StaticFileHandler(ServerState* state, HttpRequest* request, MiddlewareHandler* next) {
	if (next) {
		next->run(state, request, next->next);
	}
	if (request->response.status_code == 0) {
		serve_static_file(request);		
	}
}

