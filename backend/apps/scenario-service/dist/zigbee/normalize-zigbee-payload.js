"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeZigbeePayload = normalizeZigbeePayload;
function asNumber(v) {
    if (typeof v === 'number' && Number.isFinite(v))
        return v;
    if (typeof v === 'string' && v.trim() !== '') {
        const n = Number(v);
        if (Number.isFinite(n))
            return n;
    }
    return undefined;
}
function asBoolean(v) {
    if (typeof v === 'boolean')
        return v;
    if (typeof v === 'number')
        return v === 1 ? true : v === 0 ? false : undefined;
    if (typeof v === 'string') {
        const s = v.trim().toLowerCase();
        if (['true', '1', 'yes', 'on'].includes(s))
            return true;
        if (['false', '0', 'no', 'off'].includes(s))
            return false;
    }
    return undefined;
}
function normalizeZigbeePayload(payload) {
    const out = {};
    const state = payload.state;
    if (typeof state === 'string')
        out.state = state;
    const brightness = asNumber(payload.brightness);
    if (brightness !== undefined)
        out.brightness = Math.trunc(brightness);
    const linkquality = asNumber(payload.linkquality);
    if (linkquality !== undefined)
        out.linkquality = Math.trunc(linkquality);
    const colorMode = payload.color_mode ?? payload.colorMode;
    if (typeof colorMode === 'string')
        out.colorMode = colorMode;
    const occupancy = asBoolean(payload.occupancy ?? payload.motion);
    if (occupancy !== undefined)
        out.occupancy = occupancy;
    const temperature = asNumber(payload.temperature);
    if (temperature !== undefined)
        out.temperature = temperature;
    const humidity = asNumber(payload.humidity);
    if (humidity !== undefined)
        out.humidity = humidity;
    const battery = asNumber(payload.battery);
    if (battery !== undefined)
        out.battery = battery;
    return out;
}
//# sourceMappingURL=normalize-zigbee-payload.js.map