var Timer = function() {
    var now = Timer.now();

    this.delta = 0;
    this.elapsed = 0;
    this.previous = now;
    this.start = now;

    this.multiplier = 1;
};

Timer.prototype.update = function() {
    var now = Timer.now();

    this.delta = (now - this.previous) * this.multiplier;
    this.elapsed = (now - this.start) * this.multiplier;

    this.previous = now;
};

Timer.now = function() {
    return new Date().getTime() / 1000;
};
