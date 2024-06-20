
define(["jquery", "app/Color","app/complex","app/menu_presets"], function($, Color, Complex, Presets) {
	
	/*var SettingModel = function(fractalType) { 
		
		this.fractalType = fractalType;
		
		this.getConstant = function() { 
			var constant = new Complex(getter("constant"));
			return constant;
		};
		
		this.getGlynnFactor = function() { 
			var factor = parseFloat(getter("factor"));
			if (isNaN(factor)) {
				throw "glynn factor needs to be a number";
			}
			return factor;
		};
		
		this.getIterations = function() { 
			var iterations = parseInt(getter("iterations"));
			if (isNaN(iterations)) {
				throw "iterations must be an integer";
			}
			return iterations;
		};
		
		this.colorMap = function(n) { 
			var map1 = Color.createLinearGradientList(n/2, 0x444499, 0xBBBBBB);
			var map2 = Color.createLinearGradientList(n/2, 0xBBBBBB, 0xFFFFFF);
			return map1.concat(map2);
			//var map1 = Color.createLinearGradientList(n/2, 0x0000FF, 0x00FF00);
			//var map2 = Color.createLinearGradientList(n/2, 0xFF0000, 0xFFFFFF);
			//return map1.concat(map2);
		};
	};*/
	
	return function(eventBus) { 

		var createOption = function(text, value) {
			var option = document.createElement("option");
			option.text = text;
			option.value = value;
			return option;
		};

		var getSelectedOption = function(select_id) {
			var select = document.getElementById(select_id);
			var option = select.options[select.selectedIndex];
			return option;
		};

		var addOption = function(select_id, option) {
			document.getElementById(select_id).add(option);
		};

		var clearOptions = function(select_id) {
			document.getElementById(select_id).options.length = 0;
		};

		var setTextBox = function(textbox_id, value, defaultValue) {
			if (value == undefined || value == null) {
				value = defaultValue;
			}
			document.getElementById(textbox_id).value = value;
		};

		var setInnerHTML = function(element_id, html) {
			document.getElementById(element_id).innerHTML = html;
		};

		var getNumber = function(textbox_id, defaultValue) {
			var text = document.getElementById(textbox_id).value;
			if (text == null || text == undefined) {
				text = defaultValue;
			}
			var number = parseFloat(text);
			if (isNaN(number)) {
				number = defaultValue;
			}
			return number;
		};

		var convertDegreeToRadians = function(degrees) {
			return Math.PI * degrees / 180; 
		};

		var fillPresets = function() {
			var fractalType = getSelectedOption("typeSelect").value;
			clearOptions("presetSelect");
			Presets.forEach(function(preset, index){
				if (preset.type == fractalType) {
					addOption("presetSelect", createOption(preset.name, index));
				}
			});
			fillFromPreset();
		};

		var fillFromPreset = function() {
			var preset = Presets[getSelectedOption("presetSelect").value];
			setTextBox("iterations", preset.iterations, 256);
			setTextBox("rotate", preset.rotate, 0);
			setTextBox("factor", preset.factor, 1.5);
			setTextBox("constant_a", preset.constant_a, 0);
			setTextBox("constant_b", preset.constant_b, 0);
			setTextBox("rect_x", preset.rect_x, -1);
			setTextBox("rect_y", preset.rect_y, 1);
			setTextBox("rect_w", preset.rect_w, 2);
			setTextBox("rect_h", preset.rect_h, 2);
		};

		var createRenderParameters = function() {
			return {
				type : getSelectedOption("typeSelect").value,
				iterations : getNumber("iterations", 256),
				rotate : convertDegreeToRadians(getNumber("rotate", 0)),
				factor : getNumber("factor", 1),
				constant_a : getNumber("constant_a", 0),
				constant_b : getNumber("constant_b", 0),
				rect_x : getNumber("rect_x", -1),
				rect_y : getNumber("rect_y", 1),
				rect_w : getNumber("rect_w", 2),
				rect_h : getNumber("rect_h", 2)
			};
		};

		var addEvent = function(element_id, eventName, callback) {
			removeEvent(element_id, eventName, callback);
			document.getElementById(element_id).addEventListener(eventName,callback);
		};

		var removeEvent = function(element_id, eventName, callback) {
			document.getElementById(element_id).removeEventListener(eventName, callback);
		};
		
		clearOptions("typeSelect");
		Presets.forEach(function(preset){
			if (preset.default) {
				addOption("typeSelect", createOption(preset.name, preset.type));
			}
		});

		fillPresets();

		addEvent("typeSelect", "change", fillPresets);

		addEvent("presetSelect", "change", fillFromPreset);
		
		$("#fractalRender").click(function(e) {
			eventBus.send("fractal:render", createRenderParameters());
		});

		eventBus.listen("set:menu:dimension", function(rect) {
			setTextBox("rect_x", rect.x, -1);
			setTextBox("rect_y", rect.y, 1);
			setTextBox("rect_w", rect.w, 2);
			setTextBox("rect_h", rect.h, 2);
		});

		eventBus.listen("set:menu:mouseposition", function(pos) {
			var s = "(" + pos.canvasX + "," + pos.canvasY + ") (" + pos.graphX + "," + pos.graphY + ")";
			setInnerHTML("mousePosition", s);
		});
	};
	
}); 