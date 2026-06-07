"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRequestPathname = getRequestPathname;
function getRequestPathname(req) {
    const raw = req.originalUrl ?? req.url ?? '';
    const q = raw.indexOf('?');
    return (q === -1 ? raw : raw.slice(0, q)) || '/';
}
//# sourceMappingURL=request-path.js.map