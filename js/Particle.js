var Particle = function(mass) {
	THREE.Vector3.call(this);

	this.mass = mass;
	this.color = new THREE.Color().setHSL(App.biRandom() * 0.05 + 0.02, 1, 0.55);
	this.velocity = new THREE.Vector3();
};

Particle.prototype = Object.create(THREE.Vector3.prototype);
