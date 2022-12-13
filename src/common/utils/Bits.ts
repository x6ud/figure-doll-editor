export default class Bits {

    private bits: Uint32Array;

    constructor(capacity: number = 1) {
        this.bits = new Uint32Array(capacity);
    }

    private checkCapacity(len: number) {
        if (len > this.bits.length) {
            const newArr = new Uint32Array(len);
            newArr.set(this.bits, 0);
            this.bits = newArr;
        }
    }

    clear() {
        for (let i = 0, len = this.bits.length; i < len; ++i) {
            this.bits[i] = 0;
        }
    }

    set(index: number): void {
        const i = index >>> 5;
        this.checkCapacity(i + 1);
        this.bits[i] = (this.bits[i] | (1 << (index & 31))) >>> 0;
    }

    get(index: number): boolean {
        const i = index >>> 5;
        if (i >= this.bits.length) {
            return false;
        }
        return (this.bits[i] & (1 << (index & 31))) !== 0;
    }

    clearBit(index: number): void {
        const i = index >>> 5;
        if (i >= this.bits.length) {
            return;
        }
        this.bits[i] = (this.bits[i] & (~(1 << (index & 31)))) >>> 0;
    }

    setBit(index: number, val: boolean | number): void {
        if (val) {
            this.set(index);
        } else {
            this.clearBit(index);
        }
    }

    and(other: Bits): void {
        const common = Math.min(this.bits.length, other.bits.length);
        for (let i = 0; i < common; ++i) {
            this.bits[i] = (this.bits[i] & other.bits[i]) >>> 0;
        }
        if (this.bits.length > common) {
            for (let i = common, len = this.bits.length; i < len; ++i) {
                this.bits[i] = 0;
            }
        }
    }

    or(other: Bits): void {
        const common = Math.min(this.bits.length, other.bits.length);
        for (let i = 0; i < common; ++i) {
            this.bits[i] = (this.bits[i] | other.bits[i]) >>> 0;
        }
        if (other.bits.length > common) {
            this.checkCapacity(other.bits.length);
            for (let i = common, len = other.bits.length; i < len; ++i) {
                this.bits[i] = other.bits[i];
            }
        }
    }

    equals(other: Bits) {
        const longer = this.bits.length >= other.bits.length ? this : other;
        const shorter = longer === this ? other : this;
        for (let i = 0, len = shorter.bits.length; i < len; ++i) {
            if (longer.bits[i] !== shorter.bits[i]) {
                return false;
            }
        }
        for (let i = longer.bits.length - shorter.bits.length + 1, len = longer.bits.length; i < len; ++i) {
            if (longer.bits[i]) {
                return false;
            }
        }
        return true;
    }

    intersects(other: Bits): boolean {
        for (let i = 0, len = Math.min(this.bits.length, other.bits.length); i < len; ++i) {
            if ((this.bits[i] & other.bits[i]) !== 0) {
                return true;
            }
        }
        return false;
    }

    containsAll(other: Bits): boolean {
        if (other.bits.length > this.bits.length) {
            for (let i = this.bits.length, len = other.bits.length; i < len; ++i) {
                if (other.bits[i] !== 0) {
                    return false;
                }
            }
        }
        for (let i = 0, len = Math.min(this.bits.length, other.bits.length); i < len; ++i) {
            if ((this.bits[i] & other.bits[i]) !== other.bits[i]) {
                return false;
            }
        }
        return true;
    }

    isEmpty(): boolean {
        for (let i = 0, len = this.bits.length; i < len; ++i) {
            if (this.bits[i] !== 0) {
                return false;
            }
        }
        return true;
    }

    clone(): Bits {
        const ret = new Bits();
        ret.bits = this.bits.slice();
        return ret;
    }

}
