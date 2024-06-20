
define(function() { 
	
	var eventBusConstructor = function() { 
		
		var events = { };
		
		this.listen = function(eventName, func) { 
			
			if (events[eventName] === undefined) { 
				events[eventName] = new Array();
			}
			
			events[eventName].push(func);
		};
		
		this.silence = function(eventName, func) { 
			var eventArray = events[eventName];
			if (eventArray === undefined) {
				return;
			}
			// if no function was supplied, remove all events
			if (func === undefined) {
				eventArray.splice(0);
			}
			else {
				var i = eventArray.indexOf(func);
				throw "NOT IMPLEMENTED"
			}
		};
		
		this.send = function(eventName /*, args  */) { 
			
			var eventArray = events[eventName];
			
			if (eventArray === undefined || eventArray.length == 0) { 
				console.log("no listeners found for event: " + eventName);
				return;
			}
			
			var args = new Array();
			for (var i = 1; i < arguments.length; i++)
				args.push(arguments[i]);
				
			if (eventName.startsWith("get:")) { 
				return eventArray[0].apply(null, args);
			} else {
				for (var i in eventArray) {
					setTimeout(function() { eventArray[i].apply(null, args); }, 0);
				}
			}
		};
	};
	
	return eventBusConstructor;
	
});