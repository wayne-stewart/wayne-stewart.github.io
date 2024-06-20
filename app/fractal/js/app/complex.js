
define(function() {
	
	/* complex number must be in the form of "0.0 + 0.0i" */
	var complexParser = /^([+-]?\d+\.\d+)\s*([-+])\s*(\d+\.\d+)i$/;
	
	var Complex = function(a, b) {
		if (typeof a == "string") {
			var res = complexParser.exec(a);
			if (res && res.length == 4) {
				this.a = parseFloat(res[1]);
				this.b = parseFloat(res[3]);
				if (res[2] == '-')
					this.b = -this.b;
			} else {
				throw "invalid complex number: " + a + " - must be in the form of '0.0 + 0.0i'";
			}
		} else { 
			this.a = a;
			this.b = b;
		}
		this.r = NaN;
		this.theta = NaN;
	};

	var toPolarForm = function() {
		// only convert to polar form if not already in polar form
		if (isNaN(this.r)) {
			this.r = this.modulus();
			this.theta = Math.atan2(this.b, this.a);
			this.a = NaN;
			this.b = NaN;
		}
		return this;
	};

	var toGeometricForm = function() {
		// only convert to geometric form if not already in geometric form
		if (isNaN(this.a)) {
			this.a = this.r * Math.cos(this.theta);
			this.b = this.r * Math.sin(this.theta);
			this.r = NaN;
			this.theta = NaN;
		}
		return this;
	};

	Complex.prototype.clone = function() { 
		var z = new Complex();
		z.a = this.a;
		z.b = this.b;
		z.r = this.r;
		z.theta = this.theta;
		return z;
	};

	Complex.prototype.conjugate = function() { 
		toGeometricForm.call(this);
		this.b = -1 * this.b; 
		return this; 
	};

	/* return a scalar value of vector represented by complex coordinates using the pythagorean theorem */
	Complex.prototype.modulus = function() { 
		toGeometricForm.call(this);
		return Math.sqrt(this.a * this.a + this.b * this.b); 
	};

	Complex.prototype.multiply = function(z) { 
		toGeometricForm.call(this);
		var a = this.a * z.a - this.b * z.b; 
		var b = this.a * z.b + this.b * z.a;
		this.a = a;
		this.b = b;
		return this; 
	};

	Complex.prototype.square = function() { return this.multiply(this);  };

	Complex.prototype.add = function(z) {
		toGeometricForm.call(this);
		this.a = this.a + z.a; 
		this.b = this.b + z.b; 
		return this;
	};

	Complex.prototype.power = function(n) { 
		
		/* is a positive integer */
		if (Math.floor(n) === n && n > 0) {
			var z = this.clone();
			for (var i = 1; i < n; i++) {
				this.multiply(z);
			}
		}
		
		/* is not an integer */
		else {
			toPolarForm.call(this);
			this.r = Math.pow(this.r, n);
			this.theta = this.theta * n;
		}

		return this;
	};

	Complex.prototype.root = function(n) {
		toPolarForm.call(this);
		this.r = Math.pow(this.r, 1/n);
		this.theta = this.theta / n;
		return this;
	};

	// Complex.prototype.toPolarForm = function() {

	// };

	// Complex.prototype.toGeometricForm = function() { 

	// };
	
	return Complex;
	
});

