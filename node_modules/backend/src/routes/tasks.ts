import { Router } from 'express';
import { z } from 'zod';
import { TaskRepository } from '../repositories/TaskRepository';

const router = Router();

const CreateTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['todo', 'in-progress', 'completed']).optional().default('todo'),
  priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  due_date: z.string().optional(),
});

const UpdateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['todo', 'in-progress', 'completed']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  due_date: z.string().optional(),
});

router.get('/', (req, res) => {
  const { status, priority } = req.query;
  const tasks = TaskRepository.findAll({
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
  const task = TaskRepository.create(result.data);
  res.status(201).json(task);
});

router.patch('/:id', (req, res) => {
  const id = Number(req.params.id);
  const result = UpdateTaskSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues });
  }
  const updatedTask = TaskRepository.update(id, result.data);
  if (!updatedTask) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json(updatedTask);
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  TaskRepository.delete(id);
  res.status(204).send();
});

export default router;
