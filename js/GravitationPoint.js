var GravitationPoint = function(mass, position) {
    this.mass = mass || 256;
    this.position = position || new THREE.Vector3();
    this.radius = 1 << 18;
};

GravitationPoint.prototype.attract = function(v, delta) {
    var dist = v.distanceToSquared(this.position);
    var force = Math.sqrt((v.mass * this.mass) / dist * delta);
    var acceleration = (new THREE.Vector3()).subVectors(this.position, v).normalize().multiplyScalar(force);

    v.velocity.add(acceleration);
};
