function Timer(physicsStepDuration, initialRun, onTick, onFrame) {
    var lastTime = performance.now(),
        physicsStepAccumulator = initialRun,
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

        onFrame(time / 1000);

        // restart
        requestAnimationFrame(update);
    }

    update();
}

Timer.prototype.destroy = function () {
    this._isDestroyed = true;
}

module.exports = Timer;
