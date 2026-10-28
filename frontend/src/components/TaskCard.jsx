import React from 'react';

const TaskCard = ({ task, onStatusChange, onEdit, onDelete }) => {
  const priorityClass = {
    low: 'badge-low',
    medium: 'badge-medium',
    high: 'badge-high'
  }[task.priority] || 'badge-medium';

  const formatDueDate = (dateStr) => {
    if (!dateStr) return 'No due date';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="task-card">
      <div className="task-card-header">
        <h3 className="task-title">{task.title}</h3>
        <span className={`badge ${priorityClass}`}>{task.priority}</span>
      </div>

      <p className="task-description">
        {task.description || 'No description provided.'}
      </p>

      <div className="task-meta">
        <span>📅 Due: {formatDueDate(task.due_date)}</span>
      </div>

      <div className="task-actions">
        <select
          value={task.status}
          onChange={(e) => onStatusChange(task.id, e.target.value)}
          className="status-select"
        >
          <option value="pending">⏳ Pending</option>
          <option value="in_progress">🔄 In Progress</option>
          <option value="completed">✅ Completed</option>
        </select>

        <div className="task-btn-group">
          <button onClick={() => onEdit(task)} className="btn-icon edit" title="Edit Task">
            ✏️ Edit
          </button>
          <button onClick={() => onDelete(task.id)} className="btn-icon delete" title="Delete Task">
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;