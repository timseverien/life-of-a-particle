var App = function() {
	if(!App.supportsWebGL) {
		document.body.className = 'app--broken';
		return;
	}

	THREE.ImageUtils.crossOrigin = 'Anonymous';

	this.camera = this.getCamera();
	this.gravitationPoints = this.getGravitationPoints();
	this.isInside = true;
	this.renderer = new THREE.WebGLRenderer({ antialias: true });
	this.scene = new THREE.Scene();

	this.skybox = this.getSkybox();
	this.scene.add(this.skybox);

	this.timer = new Timer();
	this.timer.multiplier = 1 / 16;

	this.resize();
	this.render();

	this.addEventHandlers();

    document.body.appendChild(this.renderer.domElement);
};

App.prototype.addEventHandlers = function() {
	document.getElementById('btn-fullscreen').onclick = this.fullscreen.bind(this);

	document.getElementById('btn-start-low').onclick = (function() { this.start(0); }).bind(this);
	document.getElementById('btn-start-medium').onclick = (function() { this.start(1); }).bind(this);
	document.getElementById('btn-start-high').onclick = (function() { this.start(2); }).bind(this);
	document.getElementById('btn-start-ultra').onclick = (function() { this.start(3); }).bind(this);

	window.onkeydown = this.keydownHandler.bind(this);
	window.onresize = this.resize.bind(this);
};

App.prototype.start = function(quality) {
	this.controls = new THREE.OrbitControls(this.camera.outside);
	this.controls.noPan = true;
	this.controls.noKeys = true;



	this.particles = this.getParticles(quality);
	this.scene.add(this.particles);

	document.body.className = 'app--simulation';
};

/********************************
*   GETTERS
********************************/

App.prototype.getCamera = function() {
	var camera = {
		inside: new THREE.PerspectiveCamera(30, 1, 0.1, 10000),
		outside: new THREE.PerspectiveCamera(35, 1, 0.1, 10000)
	};

	camera.outside.position.set(0, 0, 50);

	return camera;
};

App.prototype.getGravitationPoints = function() {
	// Turns out I only need one... oh well!

	return [
		new GravitationPoint(50, new THREE.Vector3(0, 0, 0))
	];
};

App.prototype.getParticles = function(quality) {
	var pcount = {
		min: 1 << 12,
		max: 1 << 16
	};

	var psize = {
		min: 0.5,
		max: 2
	};

	var particles = Math.floor(pcount.min + (pcount.max - pcount.min) * (quality / 3));
	var size = psize.max - (psize.max - psize.min) * (quality / 3);

	var map;

	if(quality > 0) {
		map = THREE.ImageUtils.loadTexture('assets/textures/particle.png');
	} else {
		map = THREE.ImageUtils.loadTexture('assets/textures/particle-low.png');
		size = 0.25;
	}

    var geo = new THREE.Geometry();
	var mat = new THREE.ParticleSystemMaterial({
        blending: THREE.AdditiveBlending,
        depthBuffer: false,
        depthTest: false,
        map: map,
		transparent: true,
		vertexColors: true,
		size: size
    });

	var p;

	while(particles--) {
		p = new Particle(0.125 + Math.random() * 4);

		p.set(
			20 + App.biRandom() * 10,
			App.biRandom(),
			10 + App.biRandom()
		);

		p.velocity = new THREE.Vector3(
			-10 + Math.random() * 0.5,
			8 + Math.random() * 0.25,
			0
		);

		geo.vertices.push(p);
		geo.colors.push(p.color);
	}

    return new THREE.ParticleSystem(geo, mat);
};

App.prototype.getSkybox = function() {
	var prefix = 'assets/textures/skybox/space-';
	var suffix = '.png';

	// var dirs = [];

	var files = [
		'right',
		'left',
		'top',
		'bottom',
		'front',
		'back'
	];

	var geo = new THREE.BoxGeometry(5000, 5000, 5000, 1, 1, 1);
	var mats = [];
	var i;

	for(i = 0; i < 6; i++) {
		mats.push(new THREE.MeshBasicMaterial({
			blending: THREE.AdditiveBlending,
			map: THREE.ImageUtils.loadTexture(prefix + files[i] + suffix),
			side: THREE.BackSide
		}));
	}

	return new THREE.Mesh(geo, new THREE.MeshFaceMaterial(mats));
};

/********************************
*   EVENTS
********************************/

App.prototype.resize = function() {
    var h = window.innerHeight;
    var w = window.innerWidth;

    this.camera.inside.aspect = w / h;
    this.camera.inside.updateProjectionMatrix();

    this.camera.outside.aspect = w / h;
    this.camera.outside.updateProjectionMatrix();

	this.renderer.setSize(w, h);
};

App.prototype.keydownHandler = function(e) {
	if(e.keyCode === 86) this.isInside = !this.isInside;
};

App.prototype.fullscreen = function() {
	var el = this.renderer.domElement;

	if(el.requestFullscreen) el.requestFullscreen();
	else if(el.webkitRequestFullscreen) el.webkitRequestFullscreen();
	else if(el.mozRequestFullScreen) el.mozRequestFullScreen();
	else if(el.msRequestFullscreen) el.msRequestFullscreen();

	this.resize();
};

/********************************
*   RENDER LOOP
********************************/

App.prototype.update = function() {
	this.updateParticleSystem(this.particles);
	this.updateMovingGravitationPoint(this.gravitationPoints[0]);
};

App.prototype.updateParticleSystem = function(ps) {
	var geo = ps.geometry;
	var i = geo.vertices.length;
	var j;

	// Fixed delta? Yes, I don't want my particles to lag out of orbit
	var t = 1000 / 60 / 1000 * this.timer.multiplier;

	while(i--) {
		j = this.gravitationPoints.length;

		while(j--) this.gravitationPoints[j].attract(geo.vertices[i], t);
		geo.vertices[i].add(geo.vertices[i].velocity.clone().multiplyScalar(t));
	}

	geo.verticesNeedUpdate = true;
};

App.prototype.updateMovingGravitationPoint = function(gp) {
	gp.position.x = Math.cos(this.timer.elapsed / 2) * 8;
	gp.position.y = Math.sin(this.timer.elapsed / 3.43) * 8;

	gp.position.z = Math.sin(this.timer.elapsed / 1.23) * 8;
};

App.prototype.render = function() {
	requestAnimationFrame(this.render.bind(this));
	this.timer.update();

	var camera = (this.isInside && this.particles ? this.camera.inside : this.camera.outside);

	if(this.particles) {
		var pf = this.particles.geometry.vertices[0];
		var pl = this.particles.geometry.vertices[this.particles.geometry.vertices.length - 1];

		this.update();

		this.camera.inside.position = pf;
		this.camera.inside.lookAt(pf.clone().addVectors(
			this.gravitationPoints[0].position,
			pf.velocity,
			pl
		));
	} else {
		camera.rotation.y = -this.timer.elapsed * 0.25 - Math.PI;
		camera.rotation.x = Math.sin(camera.rotation.y) * Math.PI / 16;
	}

	this.skybox.position = camera.position;

	this.renderer.render(this.scene, camera);
};

/********************************
*   STATIC
********************************/

App.biRandom = function() {
	return (Math.random() * 2) - 1;
};

App.supportsWebGL = (function() {
	var canvas;

	try {
		canvas = document.createElement('canvas');
		return !!window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
	} catch(e) {}

	return false;
})();

App.initialize = function() {
	new App();
};

window.onload = App.initialize;
