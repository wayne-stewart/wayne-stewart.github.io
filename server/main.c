
/***********************************************
 * Not for production
 * This web server is intended for development
 * and experimentation.
 *
 * Build and Run
 * gcc main.c & ./a.out
 ***********************************************/

#include <sys/socket.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <arpa/inet.h>
#include <stdio.h>
#include <stdint.h>
#include <stdarg.h>
#include <regex.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <ctype.h>
#include <signal.h>

#define PORT 8080
#define BUFFER_SIZE 4084 /* 4096 - 12 ( 3 u32 integers ) */

#define u8 char
#define u32 uint32_t
#define ARRAY_SIZE(array_name) (sizeof(array_name) / sizeof(array_name[0]))

#include "http/content_types.c"
#include "http/status_codes.c"
#include "http/headers.c"
#include "server.c"
#include "error_handler.c"
#include "static_file_handler.c"

int main(int argc, char **argv)
{
	ServerState state = {0};
	Server_Init(&state);

	MiddlewareHandler error_handler = { .run = ErrorHandler };
	Server_AddMiddleware(&state, &error_handler);

	MiddlewareHandler static_file_handler = { .run = StaticFileHandler };
	Server_AddMiddleware(&state, &static_file_handler);

	Server_Run(&state);
	Server_Destroy(&state);
	
	return 0;
}
