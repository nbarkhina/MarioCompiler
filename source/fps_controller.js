define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class FPSController {
        constructor(target_fps) {
            this.lastCalledTime = new Date();
            this.fpscounter = 0;
            this.currentfps = 0;
            this.frame_limiter_enabled = false;
            this.fpsInterval = 1000 / target_fps;
            this.then = Date.now();
        }
        countFPS() {
            this.fpscounter++;
            let delta = (new Date().getTime() - this.lastCalledTime.getTime()) / 1000;
            if (delta > 1) {
                this.currentfps = this.fpscounter;
                this.fpscounter = 0;
                this.lastCalledTime = new Date();
            }
        }
        UpdateTargetFPS(target_fps) {
            this.fpsInterval = 1000 / target_fps;
        }
        IsFrameReady() {
            this.now = Date.now();
            this.elapsed = this.now - this.then;
            // if enough time has elapsed, draw the next frame
            if (this.elapsed > this.fpsInterval) {
                // Get ready for next frame by setting then=now, but also adjust for your
                // specified fpsInterval not being a multiple of RAF's interval (16.7ms)
                this.then = this.now - (this.elapsed % this.fpsInterval);
                return true;
            }
            else
                return false;
        }
    }
    exports.FPSController = FPSController;
});
//# sourceMappingURL=fps_controller.js.map