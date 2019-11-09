define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class VideoScreen {
        constructor(screen_width, screen_height, ctx, nes) {
            this.SCREEN_WIDTH = 0;
            this.SCREEN_HEIGHT = 0;
            this.nes = nes;
            this.ctx = ctx;
            this.SCREEN_WIDTH = screen_width;
            this.SCREEN_HEIGHT = screen_height;
            //initialize background to black
            this.pixel_data = new Uint8Array(this.SCREEN_WIDTH * this.SCREEN_HEIGHT * 4);
            this.clearScreen();
        }
        clearScreen() {
            let counter = 0;
            for (var i = 0; i < this.pixel_data.length; i++) {
                counter++;
                if (counter == 4) {
                    this.pixel_data[i] = 0xff;
                    counter = 0;
                }
                else
                    this.pixel_data[i] = 0x00;
            }
        }
        setPixel(x, y, color, transparent) {
            if (x < 0 || x >= this.SCREEN_WIDTH || y < 0 || y >= this.SCREEN_HEIGHT)
                return;
            let byte = ((y * this.SCREEN_WIDTH) + x) * 4;
            if (byte < 0 || byte + 3 >= (this.pixel_data.length - 1))
                return; //guard against going out of array bounds
            if (transparent != true) {
                this.pixel_data[byte] = color.red;
                this.pixel_data[byte + 1] = color.green;
                this.pixel_data[byte + 2] = color.blue;
                this.pixel_data[byte + 3] = color.alpha;
            }
        }
        drawSquareOnBuffer(x, y, size, color) {
            for (let ysquare = y; ysquare < y + size; ysquare++) {
                for (let xsquare = x; xsquare < x + size; xsquare++) {
                    this.setPixel(xsquare, ysquare, color);
                }
            }
        }
        //won't work because i'm using pixeldata to paste onto the screen every frame
        // clearScreen(){
        //     this.ctx.fillStyle = "red";
        //     this.ctx.fillRect(0, 0, this.ctx.canvas.width,this.ctx.canvas.height);
        // }
        drawText(text, x, y, color) {
            this.ctx.font = "12px Comic Sans MS";
            this.ctx.fillStyle = color;
            this.ctx.fillText(text, x, y);
        }
        drawBox(x, y, width, height, color) {
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x, y, width, height);
        }
    }
    exports.VideoScreen = VideoScreen;
});
//# sourceMappingURL=video.js.map