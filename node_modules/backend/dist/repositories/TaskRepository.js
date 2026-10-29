"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskRepository = void 0;
const db_1 = __importDefault(require("../db"));
exports.TaskRepository = {
    findAll: (filters) => {
        let query = 'SELECT * FROM tasks';
        const params = [];
        const conditions = [];
        if (filters?.status) {
            conditions.push('status = ?');
            params.push(filters.status);
        }
        if (filters?.priority) {
            conditions.push('priority = ?');
            params.push(filters.priority);
        }
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        query += ' ORDER BY created_at DESC';
        return db_1.default.prepare(query).all(...params);
    },
    findById: (id) => {
        return db_1.default.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    },
    create: (task) => {
        const status = task.status || 'todo';
        const priority = task.priority || 'medium';
        const stmt = db_1.default.prepare('INSERT INTO tasks (title, description, status, priority, due_date) VALUES (?, ?, ?, ?, ?)');
        const info = stmt.run(task.title, task.description || null, status, priority, task.due_date || null);
        return exports.TaskRepository.findById(Number(info.lastInsertRowid));
    },
    update: (id, task) => {
        const existing = db_1.default.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
        if (!existing)
            return undefined;
        // Filter out undefined properties so omitted fields are not updated/overwritten
        const filteredEntries = Object.entries(task).filter(([_, val]) => val !== undefined);
        if (filteredEntries.length === 0)
            return existing;
        const keys = filteredEntries.map(([key]) => key);
        const values = filteredEntries.map(([_, val]) => val);
        const fields = keys.map((key) => `${key} = ?`).join(', ');
        const stmt = db_1.default.prepare(`UPDATE tasks SET ${fields} WHERE id = ?`);
        stmt.run(...values, id);
        return db_1.default.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    },
    delete: (id) => {
        db_1.default.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    },
};
