import React from 'react';
import type { Task } from '../hooks/useTasks';

interface DashboardSummaryProps {
  tasks: Task[];
  statusFilter: string;
  setStatusFilter: (s: string) => void;
}

export const DashboardSummary: React.FC<DashboardSummaryProps> = ({
  tasks,
  statusFilter,
  setStatusFilter,
}) => {
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in-progress').length;
  const pendingCount = tasks.filter((t) => t.status === 'todo' || t.status === 'in-progress').length;
  const todoCount = tasks.filter((t) => t.status === 'todo').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Card */}
      <div
        onClick={() => setStatusFilter('all')}
        className={`cursor-pointer bg-white p-6 rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md relative overflow-hidden group ${
          statusFilter === 'all' ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-slate-100 hover:border-slate-200'
        }`}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Total Tasks</p>
            <h3 className="text-3xl font-bold text-slate-900">{totalCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>
        <div className="relative z-10 mt-4 flex items-center gap-2 text-xs text-slate-500">
          <span>{todoCount} To Do</span>
          <span>•</span>
          <span>{inProgressCount} In Progress</span>
        </div>
      </div>

      {/* Completed Card */}
      <div
        onClick={() => setStatusFilter('completed')}
        className={`cursor-pointer bg-white p-6 rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md relative overflow-hidden group ${
          statusFilter === 'completed' ? 'border-emerald-600 ring-2 ring-emerald-500/20' : 'border-slate-100 hover:border-slate-200'
        }`}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Completed</p>
            <h3 className="text-3xl font-bold text-slate-900">{completedCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <div className="relative z-10 mt-4 flex items-center gap-2 text-xs text-emerald-600 font-medium">
          <span>{totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}% of total tasks finished</span>
        </div>
      </div>

      {/* Pending Card */}
      <div
        onClick={() => setStatusFilter('todo')}
        className={`cursor-pointer bg-white p-6 rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md relative overflow-hidden group ${
          statusFilter === 'todo' || statusFilter === 'in-progress' ? 'border-amber-600 ring-2 ring-amber-500/20' : 'border-slate-100 hover:border-slate-200'
        }`}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Pending / Active</p>
            <h3 className="text-3xl font-bold text-slate-900">{pendingCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="relative z-10 mt-4 flex items-center gap-2 text-xs text-slate-500">
          <span>Requires your attention</span>
        </div>
      </div>

      {/* High Priority Card */}
      <div
        className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">High Priority</p>
            <h3 className="text-3xl font-bold text-slate-900">
              {tasks.filter((t) => t.priority === 'high' && t.status !== 'completed').length}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
        <div className="relative z-10 mt-4 flex items-center gap-2 text-xs text-rose-600 font-medium">
          <span>Urgent active tasks</span>
        </div>
      </div>
    </div>
  );
};
