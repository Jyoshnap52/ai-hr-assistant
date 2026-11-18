import React, { useState, useEffect } from 'react';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import {
  CheckCircle2,
  Clock,
  Circle,
  Plus,
  Calendar,
  User,
  CheckSquare,
  Workflow
} from 'lucide-react';

export default function OnboardingPage() {
  const { isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, progressPercentage: 0 });
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const [newTask, setNewTask] = useState({
    employeeId: 'EMP-1003',
    employeeName: 'Alex Rivera',
    title: '',
    description: '',
    category: 'General',
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    assignedTo: 'Alex Rivera'
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/onboarding');
      setTasks(res.data.tasks || []);
      setStats(res.data.stats || { total: 0, completed: 0, progressPercentage: 0 });
    } catch (err) {
      console.error('Failed to fetch onboarding tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/onboarding/${taskId}`, { status: newStatus });
      fetchTasks();
    } catch (err) {
      alert(err.message || 'Failed to update task status.');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/onboarding', newTask);
      setShowTaskModal(false);
      setNewTask({
        employeeId: 'EMP-1003',
        employeeName: 'Alex Rivera',
        title: '',
        description: '',
        category: 'General',
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        assignedTo: 'Alex Rivera'
      });
      fetchTasks();
    } catch (err) {
      alert(err.message || 'Failed to add task.');
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'Completed') return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    if (status === 'In Progress') return <Clock className="w-4 h-4 text-amber-600" />;
    return <Circle className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Onboarding Milestones</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Track orientation, compliance, and training milestones for new hires.</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowTaskModal(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Milestone Task
          </button>
        )}
      </div>

      {/* Summary Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600 border border-indigo-100">
              <Workflow className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">Alex Rivera – Lead UI/UX Designer</h2>
                <Badge variant="warning" size="sm">Onboarding Active</Badge>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Joined Aug 1, 2026 • Manager: Sarah Jenkins</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xl font-bold text-slate-900">{stats.progressPercentage}%</span>
            <span className="block text-xs text-slate-500 font-normal">
              {stats.completed} of {stats.total} tasks completed
            </span>
          </div>
        </div>

        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${stats.progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Task Checklist */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-indigo-600" /> Task Checklist
          </h3>
          <span className="text-xs text-slate-400 font-normal">Select status to update milestone</span>
        </div>

        {loading ? (
          <LoadingSpinner label="Fetching onboarding tasks..." />
        ) : (
          <div className="divide-y divide-slate-100">
            {tasks.map((task) => (
              <div
                key={task._id || task.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getStatusIcon(task.status)}</div>
                  <div className="space-y-1">
                    <h4 className={`text-xs font-semibold ${task.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      {task.title}
                    </h4>
                    {task.description && <p className="text-xs text-slate-500 font-normal">{task.description}</p>}
                    <div className="flex items-center gap-3 text-[11px] font-normal text-slate-400 pt-0.5">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" /> {task.assignedTo}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" /> Due: {task.dueDate}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">
                        {task.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task._id || task.id, e.target.value)}
                    className="py-1 px-2.5 text-xs font-medium rounded-lg bg-white border border-slate-200 focus:outline-none focus:border-indigo-600 text-slate-900 cursor-pointer"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      <Modal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        title="Create Onboarding Task"
      >
        <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Task Title</label>
            <input
              type="text"
              required
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              placeholder="e.g. Complete Security & Data Privacy Training"
              className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 text-slate-900 font-medium"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              placeholder="Provide instructions..."
              className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 text-slate-900 font-medium"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowTaskModal(false)}
              className="px-3.5 py-2 border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-xs transition-colors"
            >
              Add Task
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
