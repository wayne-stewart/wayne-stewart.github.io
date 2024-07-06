
/*
 	Error Handler
*/


void ErrorHandler(ServerState* state, HttpRequest* request, MiddlewareHandler* next) {
	if (next) {
		next->run(state, request, next->next);
		if (request->response.status_code >= 400) {
			// send pretty error page
		}
	}
	if (request->response.status_code == 0) {
		// send an error about no handler found
	}
}


