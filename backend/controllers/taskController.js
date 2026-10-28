const db = require('../config/db');

const getTasks = (req, res, next) => {
  try {
    const userId = req.user.id;
    const { search, status, priority, sortBy } = req.query;

    let query = 'SELECT * FROM tasks WHERE user_id = ?';
    const params = [userId];

    if (status && ['pending', 'in_progress', 'completed'].includes(status)) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (priority && ['low', 'medium', 'high'].includes(priority)) {
      query += ' AND priority = ?';
      params.push(priority);
    }

    if (search && search.trim() !== '') {
      query += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    switch (sortBy) {
      case 'due_date_asc':
        query += ' ORDER BY CASE WHEN due_date IS NULL OR due_date = "" THEN 1 ELSE 0 END, due_date ASC';
        break;
      case 'due_date_desc':
        query += ' ORDER BY due_date DESC';
        break;
      case 'oldest':
        query += ' ORDER BY created_at ASC';
        break;
      case 'newest':
      default:
        query += ' ORDER BY created_at DESC';
        break;
    }

    const tasks = db.prepare(query).all(...params);

    const statsStmt = db.prepare(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed
      FROM tasks 
      WHERE user_id = ?
    `);
    const rawStats = statsStmt.get(userId);

    const stats = {
      total: rawStats.total || 0,
      pending: rawStats.pending || 0,
      in_progress: rawStats.in_progress || 0,
      completed: rawStats.completed || 0
    };

    return res.status(200).json({
      success: true,
      stats,
      tasks
    });
  } catch (error) {
    next(error);
  }
};

const getTaskById = (req, res, next) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;

    const task = db
      .prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?')
      .get(taskId, userId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or unauthorized.'
      });
    }

    return res.status(200).json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

const createTask = (req, res, next) => {
  try {
    const userId = req.user.id;
    const { title, description, status, priority, due_date } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Task title is required.'
      });
    }

    const validStatus = ['pending', 'in_progress', 'completed'].includes(status) ? status : 'pending';
    const validPriority = ['low', 'medium', 'high'].includes(priority) ? priority : 'medium';

    const insertStmt = db.prepare(`
      INSERT INTO tasks (user_id, title, description, status, priority, due_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      userId,
      title.trim(),
      description ? description.trim() : '',
      validStatus,
      validPriority,
      due_date || null
    );

    const createdTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);

    return res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      task: createdTask
    });
  } catch (error) {
    next(error);
  }
};

const updateTask = (req, res, next) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;
    const { title, description, status, priority, due_date } = req.body;

    const existing = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(taskId, userId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or unauthorized.'
      });
    }

    const updatedTitle = title !== undefined ? title.trim() : existing.title;
    if (updatedTitle === '') {
      return res.status(400).json({
        success: false,
        message: 'Title cannot be empty.'
      });
    }

    const updatedDesc = description !== undefined ? description.trim() : existing.description;
    const updatedStatus = ['pending', 'in_progress', 'completed'].includes(status) ? status : existing.status;
    const updatedPriority = ['low', 'medium', 'high'].includes(priority) ? priority : existing.priority;
    const updatedDueDate = due_date !== undefined ? due_date : existing.due_date;

    const updateStmt = db.prepare(`
      UPDATE tasks 
      SET title = ?, description = ?, status = ?, priority = ?, due_date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `);

    updateStmt.run(updatedTitle, updatedDesc, updatedStatus, updatedPriority, updatedDueDate, taskId, userId);

    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully.',
      task: updatedTask
    });
  } catch (error) {
    next(error);
  }
};

const deleteTask = (req, res, next) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;

    const existing = db.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?').get(taskId, userId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or unauthorized.'
      });
    }

    db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(taskId, userId);

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTasks, getTaskById, createTask, updateTask, deleteTask };