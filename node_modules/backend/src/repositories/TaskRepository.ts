import db from '../db';

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  created_at: string;
}

export const TaskRepository = {
  findAll: (filters?: { status?: string; priority?: string }) => {
    let query = 'SELECT * FROM tasks';
    const params: any[] = [];
    const conditions: string[] = [];

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

    return db.prepare(query).all(...params) as Task[];
  },

  findById: (id: number) => {
    return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task | undefined;
  },

  create: (task: { title: string; description?: string; status?: string; priority?: string; due_date?: string }) => {
    const status = task.status || 'todo';
    const priority = task.priority || 'medium';
    const stmt = db.prepare(
      'INSERT INTO tasks (title, description, status, priority, due_date) VALUES (?, ?, ?, ?, ?)'
    );
    const info = stmt.run(task.title, task.description || null, status, priority, task.due_date || null);
    
    return TaskRepository.findById(Number(info.lastInsertRowid)) as Task;
  },

  update: (id: number, task: Partial<{ title: string; description?: string; status?: string; priority?: string; due_date?: string }>) => {
    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!existing) return undefined;

    // Filter out undefined properties so omitted fields are not updated/overwritten
    const filteredEntries = Object.entries(task).filter(([_, val]) => val !== undefined);
    if (filteredEntries.length === 0) return existing as Task;

    const keys = filteredEntries.map(([key]) => key);
    const values = filteredEntries.map(([_, val]) => val);

    const fields = keys.map((key) => `${key} = ?`).join(', ');
    
    const stmt = db.prepare(`UPDATE tasks SET ${fields} WHERE id = ?`);
    stmt.run(...values, id);
    return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task;
  },

  delete: (id: number) => {
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  },
};
