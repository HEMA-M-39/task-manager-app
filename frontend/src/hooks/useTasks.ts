import { useState, useEffect, useCallback } from 'react';

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  created_at: string;
}

export type TaskInput = {
  title: string;
  description?: string;
  status?: 'todo' | 'in-progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
};

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async (filters?: { status?: string; priority?: string }) => {
    try {
      setLoading(true);
      let url = '/api/tasks';
      const queryParams = new URLSearchParams();
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.priority) queryParams.append('priority', filters.priority);
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Failed to fetch tasks');
      }
      const data = await res.json();
      setTasks(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = async (taskData: TaskInput) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.[0]?.message || 'Failed to create task');
      }
      const newTask = await res.json();
      setTasks((prev) => [newTask, ...prev]);
      return newTask;
    } catch (err: any) {
      throw err;
    }
  };

  const updateTask = async (id: number, taskData: Partial<TaskInput>) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.[0]?.message || 'Failed to update task');
      }
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      return updated;
    } catch (err: any) {
      throw err;
    }
  };

  const deleteTask = async (id: number) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Failed to delete task');
      }
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      throw err;
    }
  };

  const toggleComplete = async (id: number) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    return updateTask(id, { status: newStatus });
  };

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleComplete,
  };
}
