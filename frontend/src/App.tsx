import { useState } from 'react';
import { useTasks } from './hooks/useTasks';
import type { Task } from './hooks/useTasks';
import { DashboardSummary } from './components/DashboardSummary';
import { TaskList } from './components/TaskList';
import { TaskFormModal } from './components/TaskFormModal';
import { ConnectorsView } from './components/ConnectorsView';

export function App() {
  const { tasks, loading, error, createTask, updateTask, deleteTask, toggleComplete } = useTasks();

  const [activeTab, setActiveTab] = useState<'tasks' | 'connectors'>('tasks');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Filters & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Sidebar responsive toggle
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleOpenCreate = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSubmitTask = async (data: any) => {
    if (editingTask) {
      await updateTask(editingTask.id, data);
    } else {
      await createTask(data);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans">
      {/* Sidebar Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/30">
            ✓
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">TaskMaster</h1>
            <p className="text-xs text-slate-400">Daily Productivity</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-4 mb-2">
            Main Menu
          </div>

          <button
            onClick={() => {
              setActiveTab('tasks');
              setStatusFilter('all');
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
              activeTab === 'tasks' && statusFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            All Tasks
          </button>

          <button
            onClick={() => {
              setActiveTab('tasks');
              setStatusFilter('todo');
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
              activeTab === 'tasks' && statusFilter === 'todo'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            To Do
          </button>

          <button
            onClick={() => {
              setActiveTab('tasks');
              setStatusFilter('in-progress');
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
              activeTab === 'tasks' && statusFilter === 'in-progress'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            In Progress
          </button>

          <button
            onClick={() => {
              setActiveTab('tasks');
              setStatusFilter('completed');
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
              activeTab === 'tasks' && statusFilter === 'completed'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Completed
          </button>

          <div className="pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-4">
            Integrations
          </div>

          <button
            onClick={() => {
              setActiveTab('connectors');
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium text-sm transition-all ${
              activeTab === 'connectors'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Connectors</span>
            </div>
            <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full font-bold">
              GitHub
            </span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-xl p-4 text-xs text-slate-400">
            <p className="font-semibold text-slate-300 mb-1">SQLite Persistence</p>
            <p>Your tasks & connectors are securely persisted.</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {activeTab === 'tasks' ? 'Dashboard' : 'Connectors & Integrations'}
              </h2>
              <p className="text-xs text-slate-500">
                {activeTab === 'tasks'
                  ? 'Manage your daily goals and tasks efficiently'
                  : 'Sync external services, GitHub issues, and repositories'}
              </p>
            </div>
          </div>

          {activeTab === 'tasks' && (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span>New Task</span>
            </button>
          )}
        </header>

        {/* Main Body */}
        <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm flex items-center justify-between">
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'connectors' ? (
            <ConnectorsView />
          ) : loading && tasks.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <svg className="animate-spin w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-slate-500 text-sm font-medium">Loading tasks...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <DashboardSummary
                tasks={tasks}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
              />

              {/* Task List with Filters and Sorting */}
              <TaskList
                tasks={tasks}
                onToggleComplete={toggleComplete}
                onEdit={handleOpenEdit}
                onDelete={deleteTask}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                priorityFilter={priorityFilter}
                setPriorityFilter={setPriorityFilter}
                sortBy={sortBy}
                setSortBy={setSortBy}
              />
            </>
          )}
        </main>
      </div>

      {/* Task Form Modal */}
      <TaskFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitTask}
        initialTask={editingTask}
      />
    </div>
  );
}

export default App;
