"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});
(0, vitest_1.describe)('GET /api/health', () => {
    (0, vitest_1.it)('should return status ok', async () => {
        const response = await (0, supertest_1.default)(app).get('/api/health');
        (0, vitest_1.expect)(response.status).toBe(200);
        (0, vitest_1.expect)(response.body).toEqual({ status: 'ok' });
    });
});
