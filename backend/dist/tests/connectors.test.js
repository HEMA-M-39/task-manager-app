"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const connectors_1 = __importDefault(require("../routes/connectors"));
const db_1 = __importDefault(require("../db"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/connectors', connectors_1.default);
(0, vitest_1.beforeEach)(() => {
    db_1.default.prepare('DELETE FROM connectors').run();
});
(0, vitest_1.describe)('Connector API', () => {
    (0, vitest_1.it)('should list empty connectors initially', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/connectors');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body).toEqual([]);
    });
    (0, vitest_1.it)('should create or update a connector configuration', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/api/connectors')
            .send({
            id: 'github',
            name: 'GitHub',
            type: 'vcs',
            enabled: true,
            config: { owner: 'testuser', repo: 'testrepo' }
        });
        (0, vitest_1.expect)(res.status).toBe(201);
        (0, vitest_1.expect)(res.body.id).toBe('github');
        (0, vitest_1.expect)(res.body.name).toBe('GitHub');
        (0, vitest_1.expect)(res.body.enabled).toBe(true);
        (0, vitest_1.expect)(JSON.parse(res.body.config)).toEqual({ owner: 'testuser', repo: 'testrepo' });
    });
    (0, vitest_1.it)('should return 400 for invalid connector payload', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/api/connectors')
            .send({
            id: '',
            name: 'GitHub',
            type: 'vcs',
            enabled: 'not-a-boolean'
        });
        (0, vitest_1.expect)(res.status).toBe(400);
        (0, vitest_1.expect)(res.body).toHaveProperty('error');
    });
    (0, vitest_1.it)('should retrieve a single connector by id', async () => {
        await (0, supertest_1.default)(app)
            .post('/api/connectors')
            .send({
            id: 'slack',
            name: 'Slack',
            type: 'chat',
            enabled: false,
            config: { channel: '#general' }
        });
        const res = await (0, supertest_1.default)(app).get('/api/connectors/slack');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.id).toBe('slack');
        (0, vitest_1.expect)(res.body.name).toBe('Slack');
        (0, vitest_1.expect)(res.body.enabled).toBe(false);
    });
    (0, vitest_1.it)('should return 404 for non-existent connector', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/connectors/non-existent');
        (0, vitest_1.expect)(res.status).toBe(404);
        (0, vitest_1.expect)(res.body).toHaveProperty('error');
    });
    (0, vitest_1.it)('should partially update connector status', async () => {
        await (0, supertest_1.default)(app)
            .post('/api/connectors')
            .send({
            id: 'github',
            name: 'GitHub',
            type: 'vcs',
            enabled: false,
            config: { owner: 'old' }
        });
        const res = await (0, supertest_1.default)(app)
            .patch('/api/connectors/github')
            .send({ enabled: true, config: { owner: 'new' } });
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.enabled).toBe(true);
        (0, vitest_1.expect)(JSON.parse(res.body.config)).toEqual({ owner: 'new' });
    });
    (0, vitest_1.it)('should delete a connector', async () => {
        await (0, supertest_1.default)(app)
            .post('/api/connectors')
            .send({
            id: 'github',
            name: 'GitHub',
            type: 'vcs',
            enabled: true
        });
        const delRes = await (0, supertest_1.default)(app).delete('/api/connectors/github');
        (0, vitest_1.expect)(delRes.status).toBe(204);
        const getRes = await (0, supertest_1.default)(app).get('/api/connectors/github');
        (0, vitest_1.expect)(getRes.status).toBe(404);
    });
    (0, vitest_1.it)('should fail mock github sync when disabled or not configured', async () => {
        const res = await (0, supertest_1.default)(app).post('/api/connectors/github/sync');
        (0, vitest_1.expect)(res.status).toBe(400);
        (0, vitest_1.expect)(res.body).toHaveProperty('error');
    });
    (0, vitest_1.it)('should succeed mock github sync when enabled', async () => {
        await (0, supertest_1.default)(app)
            .post('/api/connectors')
            .send({
            id: 'github',
            name: 'GitHub',
            type: 'vcs',
            enabled: true,
            config: { token: 'gh_token_123' }
        });
        const res = await (0, supertest_1.default)(app).post('/api/connectors/github/sync');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.success).toBe(true);
        (0, vitest_1.expect)(res.body.synced_at).toBeDefined();
        (0, vitest_1.expect)(res.body.connector.last_synced_at).toBeDefined();
    });
    (0, vitest_1.it)('should test github connection', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/api/connectors/github/test')
            .send({ token: 'gh_token_xyz', repository: 'org/repo' });
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.success).toBe(true);
        (0, vitest_1.expect)(res.body.repository).toBe('org/repo');
    });
});
