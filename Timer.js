function Timer(physicsStepDuration, onTick, onFrame) {
    var lastTime = performance.now(),
        physicsStepAccumulator = 0,
        self = this;

    this._isDestroyed = false;

    function update() {
        if (self._isDestroyed) {
            return;
        }

        const time = performance.now();
        const elapsed = Math.min(0.1, (time - lastTime) / 1000);

        lastTime = time;

        physicsStepAccumulator += elapsed;

        while (physicsStepAccumulator > physicsStepDuration) {
            onTick();
            physicsStepAccumulator -= physicsStepDuration;
        }

        onFrame();

        // restart
        requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
}

Timer.prototype.destroy = function () {
    this._isDestroyed = true;
}

module.exports = Timer;
