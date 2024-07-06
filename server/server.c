/*
	Server
*/

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

typedef struct CompiledRegex {
	regex_t request_line;
	regex_t uri_double_dots;
	regex_t uri_valid_chars;
} CompiledRegex;

typedef struct MiddlewareHandler MiddlewareHandler;
typedef struct ServerState ServerState;

typedef struct MiddlewareHandler {
	struct MiddlewareHandler* next;
	void (*run)(ServerState*, HttpRequest*, MiddlewareHandler*);
} MiddlewareHandler;

typedef struct ServerState {
	int server_fd;
	CompiledRegex regex;
	MiddlewareHandler* middleware;
} ServerState;

void send_header(PHttpRequest request)
{
	char buffer[BUFFER_SIZE] = {0};
	size_t header_length = snprintf(
		buffer,
		BUFFER_SIZE,
			"HTTP/1.1 %d %s\r\n"
			"Content-Type: %s\r\n"
			"Content-Length: %d\r\n"
			//"Content-Encoding: gzip\r\n"
			"Connection: keep-alive\r\n"
			"Keep-Alive: timeout=5, max=1000\r\n"
			//"Connection: close\r\n"
			"\r\n",
		request->response.status_code, 
		http_get_status_code_message(request->response.status_code),
		http_get_content_type_text(request->response.content_type),
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
		http_get_status_code_message(request->response.status_code),
		path);
	send(request->client_fd, buffer, header_length, 0);
}

int read_request(CompiledRegex* regx, PHttpRequest request, char* buffer, int buffer_size)
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

void Server_Init(ServerState* state) {
	regcomp(&state->regex.request_line, "^([A-Z]+) (/[^ ]*) HTTP/1.1\r\n", REG_EXTENDED);
	regcomp(&state->regex.uri_double_dots, "\\.\\.", REG_EXTENDED);
	regcomp(&state->regex.uri_valid_chars, "^[0-9a-zA-Z/_\\.-]+$", REG_EXTENDED);
}

void Server_Destroy(ServerState* state) {
	if (state->server_fd) {
		close(state->server_fd);
	}
}

void Server_AddMiddleware(ServerState* state, MiddlewareHandler* handler) {
	if (state->middleware) {
		MiddlewareHandler* parent = state->middleware;
		while (parent->next) parent = parent->next;
		parent->next =  handler;
	} else {
		state->middleware = handler;
	}
}

volatile sig_atomic_t server_is_running = 1;

static void Server_SignalCatch(int signo) {
	if (signo == SIGINT) {
		server_is_running = 0;
	}
}

void Server_Run(ServerState* state) {

	/*if (signal(SIGINT, Server_SignalCatch) == SIG_ERR) {
		perror("Unable to set signal handler!");
		return;
	}*/

	struct sockaddr_in server_addr = {0};

	if ((state->server_fd = socket(AF_INET, SOCK_STREAM, 0)) < 0) {
		perror("create socket failed");
		return;
	}

	server_addr.sin_family = AF_INET;
	server_addr.sin_addr.s_addr = INADDR_ANY;
	server_addr.sin_port = htons(PORT);

	if (bind(state->server_fd,
		(struct sockaddr *)&server_addr,
		sizeof(server_addr)) < 0) {
		perror("socket bind failed");
		return;
	}

	if (listen(state->server_fd, 10) < 0) {
		perror("listening to socket failed");
		return;
	}
	printf("listening on port: %d\n", PORT);

	while(server_is_running) {
		struct sockaddr_in client_addr = {0};
		socklen_t client_addr_len = sizeof(client_addr);

		HttpRequest request = {0};
		request.client_fd = accept(state->server_fd, (struct sockaddr*)&client_addr, &client_addr_len);
		if (request.client_fd < 0) { perror("accept failed"); goto CLEANUP; }
		
		char read_buffer[BUFFER_SIZE] = {0};
		if (read_request(&state->regex, &request, read_buffer, BUFFER_SIZE - 1) != 1) goto CLEANUP;
		
		state->middleware->run(state, &request, state->middleware->next);
		
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
}



