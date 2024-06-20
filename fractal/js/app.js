
requirejs.config({
	baseUrl: "js",
	
	paths: {
		app: "app",
		lib: "lib",
		jquery: "lib/jquery.min"
	},
	
	shim: {
		"colpick": ["jquery"]
	}
});

requirejs(["jquery", "app/menu", "app/eventbus", "app/fractal", "app/canvas"], function($, Menu, EventBus, Fractal, Canvas) { 
	
	$(function() {
		
		window.app = {};

		window.app.eventBus = new EventBus();
		
		window.app.menu = new Menu(app.eventBus);
		
		window.app.fractal = new Fractal(app.eventBus);
		
		window.app.canvas = new Canvas(app.eventBus);
	});
});