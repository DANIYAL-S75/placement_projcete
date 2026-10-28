import React, { useState, useEffect } from 'react';
import API from '../api';
import Navbar from '../components/Navbar';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, in_progress: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [notification, setNotification] = useState({ type: '', message: '' });

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: '', message: '' }), 4000);
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (sortBy) params.sortBy = sortBy;

      const res = await API.get('/tasks', { params });
      if (res.data.success) {
        setTasks(res.data.tasks);
        setStats(res.data.stats);
      }
    } catch (err) {
      showNotification('error', 'Failed to fetch tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTasks();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter, priorityFilter, sortBy]);

  const handleCreateOrUpdate = async (taskData) => {
    try {
      if (editingTask) {
        await API.put(`/tasks/${editingTask.id}`, taskData);
        showNotification('success', 'Task updated successfully!');
      } else {
        await API.post('/tasks', taskData);
        showNotification('success', 'Task created successfully!');
      }
      setIsModalOpen(false);
      setEditingTask(null);
      fetchTasks();
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Operation failed.');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await API.put(`/tasks/${taskId}`, { status: newStatus });
      fetchTasks();
    } catch (err) {
      showNotification('error', 'Failed to update task status.');
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to permanently delete this task?')) {
      return;
    }
    try {
      await API.delete(`/tasks/${taskId}`);
      showNotification('success', 'Task deleted successfully.');
      fetchTasks();
    } catch (err) {
      showNotification('error', 'Failed to delete task.');
    }
  };

  const openCreateModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  return (
    <>
      <Navbar />

      <main className="dashboard-container">
        {notification.message && (
          <div className={`alert ${notification.type === 'error' ? 'alert-error' : 'alert-success'}`}>
            {notification.message}
          </div>
        )}

        <div className="dashboard-header">
          <div>
            <h1>Task Dashboard</h1>
            <p style={{ color: 'var(--text-muted)' }}>
              Organize, track, and complete your projects efficiently
            </p>
          </div>
          <button onClick={openCreateModal} className="btn btn-primary">
            + New Task
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card total">
            <span className="stat-label">Total Tasks</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-card pending">
            <span className="stat-label">Pending</span>
            <span className="stat-value">{stats.pending}</span>
          </div>
          <div className="stat-card in_progress">
            <span className="stat-label">In Progress</span>
            <span className="stat-value">{stats.in_progress}</span>
          </div>
          <div className="stat-card completed">
            <span className="stat-label">Completed</span>
            <span className="stat-value">{stats.completed}</span>
          </div>
        </div>

        <div className="controls-bar">
          <div className="search-input-wrapper">
            <input
              type="text"
              className="form-control"
              placeholder="🔍 Search tasks by title or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filters-group">
            <select className="form-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            <select className="form-control" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="">All Priorities</option>
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>

            <select className="form-control" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="due_date_asc">Due Date (Earliest)</option>
              <option value="due_date_desc">Due Date (Latest)</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>Loading tasks...</p>
          </div>
        ) : tasks.length > 0 ? (
          <div className="tasks-grid">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                onEdit={openEditModal}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No tasks found</h3>
            <p>
              {search || statusFilter || priorityFilter
                ? 'Try adjusting your search query or filters to find what you need.'
                : 'You have no tasks yet! Click "+ New Task" to create your first one.'}
            </p>
            <button onClick={openCreateModal} className="btn btn-primary">
              + Create First Task
            </button>
          </div>
        )}

        <TaskForm
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingTask(null);
          }}
          onSubmit={handleCreateOrUpdate}
          initialTask={editingTask}
        />
      </main>
    </>
  );
};

export default Dashboard;