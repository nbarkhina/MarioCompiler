export class BitHelper{
    
    static mask255(data: number): number {
        return data & 0xFF;
    }

    static getBit(byte: number, bit: number): number {
        return (byte >> bit) & 1;
    }

    static setBit(byte: number, bit: number, value: number): number {
        if (value > 0)
            return byte | (1 << bit);
        else
            return byte & ~(1 << bit);
    }

    static toggleBit(byte: number, bit: number): number {
        return byte ^ (1 << bit);
    }

}