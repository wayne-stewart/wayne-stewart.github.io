/***********************************************
 * Not for production
 * This web server is intended for development
 * and experimentation.
 *
 * Build and Run
 * gcc server.c & ./a.out
 ***********************************************/

#include <sys/socket.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <arpa/inet.h>
#include <stdio.h>
#include <regex.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <ctype.h>

#define PORT 8080
#define BUFFER_SIZE 4096

#define ARRAY_SIZE(array_name) (sizeof(array_name) / sizeof(array_name[0]))

typedef enum HttpContentTypes {
	CONTENT_TYPE_PLAIN,
	CONTENT_TYPE_HTML,
	CONTENT_TYPE_CSS,
	CONTENT_TYPE_JS,
	CONTENT_TYPE_JPG,
	CONTENT_TYPE_PNG,
	CONTENT_TYPE_GIF,
	CONTENT_TYPE_ICO,
	CONTENT_TYPE_SVG,
} HttpContentTypes;

typedef struct HttpResponse {
	int status_code;
	int content_length;
	HttpContentTypes content_type;
} HttpResponse, *PHttpResponse;

typedef struct HttpRequest {
	int client_fd;
	const char* method;
	const char* uri;
	const char* http_version;
	HttpResponse response;
} HttpRequest, *PHttpRequest;

typedef struct HttpStatusCode {
	int status_code;
	const char* status_message;
} HttpStatusCode;

const HttpStatusCode STATUS_CODES[] = {
	{ 200, "Ok" },
	{ 302, "Found" },
	{ 400, "Bad Request" },
	{ 401, "Unauthorized" },
	{ 403, "Forbidden" },
	{ 404, "Not Found" },
	{ 405, "Method Not Allowed" },
	{ 500, "Internal Server Error" }
};

const char* GetHttpStatusCodeMessage(int status_code)
{
	for(int i = 0; i < ARRAY_SIZE(STATUS_CODES); i++) {
		if (STATUS_CODES[i].status_code == status_code) {
			return STATUS_CODES[i].status_message;
		}
	}
	return "Message Not Available";
}

typedef struct HttpContentType {
	HttpContentTypes type_id;
	const char* file_extension;
	const char* text;
} HttpContentType;

const HttpContentType CONTENT_TYPES[] = {
	{ CONTENT_TYPE_PLAIN,	".txt",		"text/plain" },
	{ CONTENT_TYPE_HTML,	".html",	"text/html" },
	{ CONTENT_TYPE_CSS,		".css",		"text/css" },
	{ CONTENT_TYPE_JS,		".js",		"text/javascript" },
	{ CONTENT_TYPE_JPG,		".jpg",		"image/jpeg" },
	{ CONTENT_TYPE_PNG,		".png",		"image/png" },
	{ CONTENT_TYPE_GIF,		".gif",		"image/gif" },
	{ CONTENT_TYPE_ICO,		".ico",		"image/x-icon" },
	{ CONTENT_TYPE_SVG,		".svg",		"image/svg+xml" },
};

void SetHttpContentTypeFromFilePath(PHttpRequest request, const char* path_buffer, int path_length)
{
	for(int i = 0; i < ARRAY_SIZE(CONTENT_TYPES); i++) {
		int file_ext_len = strlen(CONTENT_TYPES[i].file_extension);
		if (path_length > file_ext_len) {
			if (strcmp(CONTENT_TYPES[i].file_extension, &path_buffer[path_length - file_ext_len]) == 0) {
				request->response.content_type = CONTENT_TYPES[i].type_id;
				return;
			}
		}
	}
	request->response.content_type = CONTENT_TYPE_PLAIN;
}

const char* GetHttpContentTypeText(HttpContentTypes type_id)
{
	for (int i = 0; i < ARRAY_SIZE(CONTENT_TYPES); i++) {
		if (CONTENT_TYPES[i].type_id == type_id) {
			return CONTENT_TYPES[i].text;
		}
	}
	return "text/plain";
}

void send_header(PHttpRequest request)
{
	char buffer[BUFFER_SIZE] = {0};
	size_t header_length = snprintf(
		buffer,
		BUFFER_SIZE,
			"HTTP/1.1 %d %s\r\n"
			"Content-Type: %s\r\n"
			"Content-Length: %d\r\n"
			//"Connection: keep-alive\r\n"
			"\r\n",
		request->response.status_code, 
		GetHttpStatusCodeMessage(request->response.status_code),
		GetHttpContentTypeText(request->response.content_type),
		request->response.content_length);
	send(request->client_fd, buffer, header_length, 0);
}

void send_text(int socket_fd, const char* text, int text_length)
{
	send(socket_fd, text, text_length, 0);
}

void send_file(int socket_fd, int file_fd)
{
	char buffer[BUFFER_SIZE] = {0};
	size_t bytes_read;
	while((bytes_read = read(file_fd, buffer, BUFFER_SIZE)) > 0) {
		send(socket_fd, buffer, bytes_read, 0);
	}
}

void send_404(PHttpRequest request)
{
	request->response.status_code = 404;
	request->response.content_length = 0;
	request->response.content_type = CONTENT_TYPE_PLAIN;
	send_header(request);
}

void send_302(PHttpRequest request, const char* path)
{
	request->response.status_code = 302;	
	char buffer[BUFFER_SIZE] = {0};
	size_t header_length = snprintf(
		buffer,
		BUFFER_SIZE,
			"HTTP/1.1 %d %s\r\n"
			"Location: %s\r\n"
			"\r\n",
		request->response.status_code, 
		GetHttpStatusCodeMessage(request->response.status_code),
		path);
	send(request->client_fd, buffer, header_length, 0);
}

typedef struct Regex {
	regex_t request_line;
	regex_t uri_double_dots;
	regex_t uri_valid_chars;
} Regex, *PRegex;

void make_regex(PRegex regx)
{	
	regcomp(&regx->request_line, "^([A-Z]+) (/[^ ]*) HTTP/1.1\r\n", REG_EXTENDED);
	regcomp(&regx->uri_double_dots, "\\.\\.", REG_EXTENDED);
	regcomp(&regx->uri_valid_chars, "^[0-9a-zA-Z/_\\.-]+$", REG_EXTENDED);
}

int read_request(PRegex regx, PHttpRequest request, char* buffer, int buffer_size)
{
	size_t bytes_received = recv(request->client_fd, buffer, buffer_size, 0);
	if (bytes_received == 0) { perror("failed to read from network stream"); return 0; }
	
	regmatch_t matches[3];
	if (regexec(&regx->request_line, buffer, 3, matches, 0) != 0) return 0;

	buffer[matches[1].rm_eo] = '\0'; // null terminator for method
	buffer[matches[2].rm_eo] = '\0'; // null terminator for URI
	request->method = buffer + matches[1].rm_so;
	request->uri = buffer + matches[2].rm_so;

	// if double dots are found, request validation fails
	if (regexec(&regx->uri_double_dots, request->uri, 1, matches, 0) == 0) return 0;

	// make sure there are no unexpected characters in the uri
	if (regexec(&regx->uri_valid_chars, request->uri, 1, matches, 0) != 0) return 0;

	return 1;
}

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
		SetHttpContentTypeFromFilePath(request, path_buffer, path_length);
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
	}
	if (file_fd == -2) {
		char path_302[1024] = {0};
		snprintf(path_302, ARRAY_SIZE(path_302) - 1, "%s/", request->uri);
		send_302(request, path_302);
	}
	else {
		struct stat file_stat;
		fstat(file_fd, &file_stat);
		off_t file_size = file_stat.st_size;
		request->response.status_code = 200;
		request->response.content_length = file_size;
		send_header(request);
		send_file(request->client_fd, file_fd);
		close(file_fd);
	}
}

int main(int argc, char **argv)
{
	int server_fd;
	struct sockaddr_in server_addr = {0};

	if ((server_fd = socket(AF_INET, SOCK_STREAM, 0)) < 0) {
		perror("create socket failed");
		return 1;
	}

	server_addr.sin_family = AF_INET;
	server_addr.sin_addr.s_addr = INADDR_ANY;
	server_addr.sin_port = htons(PORT);

	if (bind(server_fd,
		(struct sockaddr *)&server_addr,
		sizeof(server_addr)) < 0) {
		perror("socket bind failed");
		return 1;
	}

	if (listen(server_fd, 10) < 0) {
		perror("listening to socket failed");
		return 1;
	}
	printf("listening on port: %d\n", PORT);

	Regex regx = {0};
	make_regex(&regx);

	while(1) {
		struct sockaddr_in client_addr = {0};
		socklen_t client_addr_len = sizeof(client_addr);

		HttpRequest request = {0};
		request.client_fd = accept(server_fd, (struct sockaddr*)&client_addr, &client_addr_len);
		if (request.client_fd < 0) { perror("accept failed"); goto CLEANUP; }
		
		char read_buffer[BUFFER_SIZE] = {0};
		if (read_request(&regx, &request, read_buffer, BUFFER_SIZE - 1) != 1) goto CLEANUP;

		serve_static_file(&request);
		
		CLEANUP:
		if (request.uri) {
			printf("%d %s %s\n", request.response.status_code, request.method, request.uri);
		}
		else {
			printf("Could not parse request line\n");
		}
		if (request.client_fd) {
			close(request.client_fd);
		}
	}


	close(server_fd);

	return 0;
}
