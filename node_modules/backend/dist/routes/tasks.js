"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const TaskRepository_1 = require("../repositories/TaskRepository");
const router = (0, express_1.Router)();
const CreateTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    status: zod_1.z.enum(['todo', 'in-progress', 'completed']).optional().default('todo'),
    priority: zod_1.z.enum(['low', 'medium', 'high']).optional().default('medium'),
    due_date: zod_1.z.string().optional(),
});
const UpdateTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().optional(),
    status: zod_1.z.enum(['todo', 'in-progress', 'completed']).optional(),
    priority: zod_1.z.enum(['low', 'medium', 'high']).optional(),
    due_date: zod_1.z.string().optional(),
});
router.get('/', (req, res) => {
    const { status, priority } = req.query;
    const tasks = TaskRepository_1.TaskRepository.findAll({
        status: typeof status === 'string' ? status : undefined,
        priority: typeof priority === 'string' ? priority : undefined,
    });
    res.json(tasks);
});
router.post('/', (req, res) => {
    const result = CreateTaskSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ error: result.error.issues });
    }
    const task = TaskRepository_1.TaskRepository.create(result.data);
    res.status(201).json(task);
});
router.patch('/:id', (req, res) => {
    const id = Number(req.params.id);
    const result = UpdateTaskSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ error: result.error.issues });
    }
    const updatedTask = TaskRepository_1.TaskRepository.update(id, result.data);
    if (!updatedTask) {
        return res.status(404).json({ error: 'Task not found' });
    }
    res.json(updatedTask);
});
router.delete('/:id', (req, res) => {
    const id = Number(req.params.id);
    TaskRepository_1.TaskRepository.delete(id);
    res.status(204).send();
});
exports.default = router;
