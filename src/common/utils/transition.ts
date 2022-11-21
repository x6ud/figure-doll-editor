export function createTransitionAnimation(callback: (t: number) => void, durationMs: number = 300) {
    let lastTimestamp = Date.now();
    let time = 0;

    function step() {
        const timestamp = Date.now();
        time += timestamp - lastTimestamp;
        lastTimestamp = timestamp;
        const t = Math.min(1, time / durationMs);
        callback(t);
        if (t < 1) {
            requestAnimationFrame(step);
        }
    }

    step();
}