define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class BitHelper {
        static mask255(data) {
            return data & 0xFF;
        }
        static getBit(byte, bit) {
            return (byte >> bit) & 1;
        }
        static setBit(byte, bit, value) {
            if (value > 0)
                return byte | (1 << bit);
            else
                return byte & ~(1 << bit);
        }
        static toggleBit(byte, bit) {
            return byte ^ (1 << bit);
        }
    }
    exports.BitHelper = BitHelper;
});
//# sourceMappingURL=bithelper.js.map