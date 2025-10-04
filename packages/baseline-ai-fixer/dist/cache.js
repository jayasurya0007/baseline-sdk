import crypto from 'crypto';
export class FixCache {
    constructor(maxSize = 100) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }
    generateKey(code, featureId) {
        const hash = crypto.createHash('md5');
        hash.update(`${code}:${featureId}`);
        return hash.digest('hex');
    }
    get(code, featureId) {
        const key = this.generateKey(code, featureId);
        return this.cache.get(key);
    }
    set(code, featureId, suggestion) {
        const key = this.generateKey(code, featureId);
        // If cache is full, remove oldest entry
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) {
                this.cache.delete(firstKey);
            }
        }
        this.cache.set(key, suggestion);
    }
    clear() {
        this.cache.clear();
    }
    size() {
        return this.cache.size;
    }
}
//# sourceMappingURL=cache.js.map