import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import taskRoutes from '../routes/tasks';
import db from '../db';

const app = express();
app.use(express.json());
app.use('/api/tasks', taskRoutes);

beforeEach(() => {
  db.prepare('DELETE FROM tasks').run();
});

describe('Task API', () => {
  it('should create a task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Hello Task', description: 'World', priority: 'high' });
    
    expect(res.status).toBe(201);
    expect(res.body).toBeDefined();
    expect(res.body.title).toBe('Hello Task');
    expect(res.body.priority).toBe('high');
    expect(res.body.status).toBe('todo');
    expect(res.body.created_at).toBeDefined();
  });

  it('should return 400 Bad Request for invalid input on create', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: '', priority: 'invalid-priority' });
    
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should list tasks with filtering by status and priority', async () => {
    await request(app).post('/api/tasks').send({ title: 'Task 1', status: 'todo', priority: 'low' });
    await request(app).post('/api/tasks').send({ title: 'Task 2', status: 'completed', priority: 'high' });
    await request(app).post('/api/tasks').send({ title: 'Task 3', status: 'completed', priority: 'low' });

    const resAll = await request(app).get('/api/tasks');
    expect(resAll.status).toBe(200);
    expect(resAll.body.length).toBe(3);

    const resCompleted = await request(app).get('/api/tasks?status=completed');
    expect(resCompleted.status).toBe(200);
    expect(resCompleted.body.length).toBe(2);
    expect(resCompleted.body.every((t: any) => t.status === 'completed')).toBe(true);

    const resLow = await request(app).get('/api/tasks?priority=low');
    expect(resLow.status).toBe(200);
    expect(resLow.body.length).toBe(2);
    expect(resLow.body.every((t: any) => t.priority === 'low')).toBe(true);

    const resFiltered = await request(app).get('/api/tasks?status=completed&priority=low');
    expect(resFiltered.status).toBe(200);
    expect(resFiltered.body.length).toBe(1);
    expect(resFiltered.body[0].title).toBe('Task 3');
  });

  it('should update a task partially without overwriting omitted fields', async () => {
    const createRes = await request(app)
      .post('/api/tasks')
      .send({ title: 'Original Title', priority: 'high', status: 'in-progress' });
    const id = createRes.body.id;
    
    // Update only status
    const updateRes1 = await request(app)
      .patch(`/api/tasks/${id}`)
      .send({ status: 'completed' });
    
    expect(updateRes1.status).toBe(200);
    expect(updateRes1.body.status).toBe('completed');
    expect(updateRes1.body.priority).toBe('high'); // Should remain high
    expect(updateRes1.body.title).toBe('Original Title'); // Should remain Original Title

    // Update only priority
    const updateRes2 = await request(app)
      .patch(`/api/tasks/${id}`)
      .send({ priority: 'low' });
    
    expect(updateRes2.status).toBe(200);
    expect(updateRes2.body.status).toBe('completed'); // Should remain completed
    expect(updateRes2.body.priority).toBe('low');
    expect(updateRes2.body.title).toBe('Original Title');
  });

  it('should return 400 Bad Request for invalid input on patch', async () => {
    const createRes = await request(app).post('/api/tasks').send({ title: 'Task 1' });
    const id = createRes.body.id;

    const res = await request(app)
      .patch(`/api/tasks/${id}`)
      .send({ priority: 'super-high' });
    
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 404 for updating non-existent task', async () => {
    const res = await request(app)
      .patch('/api/tasks/99999')
      .send({ status: 'completed' });
    
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('should delete a task', async () => {
    const createRes = await request(app).post('/api/tasks').send({ title: 'Task 1' });
    const id = createRes.body.id;
    
    const deleteRes = await request(app).delete(`/api/tasks/${id}`);
    expect(deleteRes.status).toBe(204);
    
    const listRes = await request(app).get('/api/tasks');
    expect(listRes.body.length).toBe(0);
  });
});
