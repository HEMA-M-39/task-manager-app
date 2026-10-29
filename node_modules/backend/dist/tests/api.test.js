"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const tasks_1 = __importDefault(require("../routes/tasks"));
const db_1 = __importDefault(require("../db"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/tasks', tasks_1.default);
(0, vitest_1.beforeEach)(() => {
    db_1.default.prepare('DELETE FROM tasks').run();
});
(0, vitest_1.describe)('Task API', () => {
    (0, vitest_1.it)('should create a task', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/api/tasks')
            .send({ title: 'Hello Task', description: 'World', priority: 'high' });
        (0, vitest_1.expect)(res.status).toBe(201);
        (0, vitest_1.expect)(res.body).toBeDefined();
        (0, vitest_1.expect)(res.body.title).toBe('Hello Task');
        (0, vitest_1.expect)(res.body.priority).toBe('high');
        (0, vitest_1.expect)(res.body.status).toBe('todo');
        (0, vitest_1.expect)(res.body.created_at).toBeDefined();
    });
    (0, vitest_1.it)('should return 400 Bad Request for invalid input on create', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/api/tasks')
            .send({ title: '', priority: 'invalid-priority' });
        (0, vitest_1.expect)(res.status).toBe(400);
        (0, vitest_1.expect)(res.body).toHaveProperty('error');
    });
    (0, vitest_1.it)('should list tasks with filtering by status and priority', async () => {
        await (0, supertest_1.default)(app).post('/api/tasks').send({ title: 'Task 1', status: 'todo', priority: 'low' });
        await (0, supertest_1.default)(app).post('/api/tasks').send({ title: 'Task 2', status: 'completed', priority: 'high' });
        await (0, supertest_1.default)(app).post('/api/tasks').send({ title: 'Task 3', status: 'completed', priority: 'low' });
        const resAll = await (0, supertest_1.default)(app).get('/api/tasks');
        (0, vitest_1.expect)(resAll.status).toBe(200);
        (0, vitest_1.expect)(resAll.body.length).toBe(3);
        const resCompleted = await (0, supertest_1.default)(app).get('/api/tasks?status=completed');
        (0, vitest_1.expect)(resCompleted.status).toBe(200);
        (0, vitest_1.expect)(resCompleted.body.length).toBe(2);
        (0, vitest_1.expect)(resCompleted.body.every((t) => t.status === 'completed')).toBe(true);
        const resLow = await (0, supertest_1.default)(app).get('/api/tasks?priority=low');
        (0, vitest_1.expect)(resLow.status).toBe(200);
        (0, vitest_1.expect)(resLow.body.length).toBe(2);
        (0, vitest_1.expect)(resLow.body.every((t) => t.priority === 'low')).toBe(true);
        const resFiltered = await (0, supertest_1.default)(app).get('/api/tasks?status=completed&priority=low');
        (0, vitest_1.expect)(resFiltered.status).toBe(200);
        (0, vitest_1.expect)(resFiltered.body.length).toBe(1);
        (0, vitest_1.expect)(resFiltered.body[0].title).toBe('Task 3');
    });
    (0, vitest_1.it)('should update a task partially without overwriting omitted fields', async () => {
        const createRes = await (0, supertest_1.default)(app)
            .post('/api/tasks')
            .send({ title: 'Original Title', priority: 'high', status: 'in-progress' });
        const id = createRes.body.id;
        // Update only status
        const updateRes1 = await (0, supertest_1.default)(app)
            .patch(`/api/tasks/${id}`)
            .send({ status: 'completed' });
        (0, vitest_1.expect)(updateRes1.status).toBe(200);
        (0, vitest_1.expect)(updateRes1.body.status).toBe('completed');
        (0, vitest_1.expect)(updateRes1.body.priority).toBe('high'); // Should remain high
        (0, vitest_1.expect)(updateRes1.body.title).toBe('Original Title'); // Should remain Original Title
        // Update only priority
        const updateRes2 = await (0, supertest_1.default)(app)
            .patch(`/api/tasks/${id}`)
            .send({ priority: 'low' });
        (0, vitest_1.expect)(updateRes2.status).toBe(200);
        (0, vitest_1.expect)(updateRes2.body.status).toBe('completed'); // Should remain completed
        (0, vitest_1.expect)(updateRes2.body.priority).toBe('low');
        (0, vitest_1.expect)(updateRes2.body.title).toBe('Original Title');
    });
    (0, vitest_1.it)('should return 400 Bad Request for invalid input on patch', async () => {
        const createRes = await (0, supertest_1.default)(app).post('/api/tasks').send({ title: 'Task 1' });
        const id = createRes.body.id;
        const res = await (0, supertest_1.default)(app)
            .patch(`/api/tasks/${id}`)
            .send({ priority: 'super-high' });
        (0, vitest_1.expect)(res.status).toBe(400);
        (0, vitest_1.expect)(res.body).toHaveProperty('error');
    });
    (0, vitest_1.it)('should return 404 for updating non-existent task', async () => {
        const res = await (0, supertest_1.default)(app)
            .patch('/api/tasks/99999')
            .send({ status: 'completed' });
        (0, vitest_1.expect)(res.status).toBe(404);
        (0, vitest_1.expect)(res.body).toHaveProperty('error');
    });
    (0, vitest_1.it)('should delete a task', async () => {
        const createRes = await (0, supertest_1.default)(app).post('/api/tasks').send({ title: 'Task 1' });
        const id = createRes.body.id;
        const deleteRes = await (0, supertest_1.default)(app).delete(`/api/tasks/${id}`);
        (0, vitest_1.expect)(deleteRes.status).toBe(204);
        const listRes = await (0, supertest_1.default)(app).get('/api/tasks');
        (0, vitest_1.expect)(listRes.body.length).toBe(0);
    });
});
