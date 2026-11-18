import { OnboardingTask } from '../models/OnboardingTask.js';
import { Employee } from '../models/Employee.js';
import { isMemoryMode, memoryStore } from '../config/db.js';

export async function getOnboardingTasks(req, res) {
  try {
    const { employeeId } = req.query;
    let tasks = [];

    if (!isMemoryMode) {
      const query = employeeId ? { employeeId } : {};
      tasks = await OnboardingTask.find(query).sort({ dueDate: 1 });
    } else {
      tasks = employeeId
        ? memoryStore.onboardingTasks.filter((t) => t.employeeId === employeeId)
        : memoryStore.onboardingTasks;
    }

    // Calculate overall progress stats
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
    const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return res.json({
      tasks,
      stats: {
        total,
        completed,
        inProgress,
        pending: total - completed,
        progressPercentage
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch onboarding tasks.' });
  }
}

export async function updateTaskStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Not Started', 'In Progress', 'Completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }

    let task = null;
    if (!isMemoryMode) {
      task = await OnboardingTask.findByIdAndUpdate(id, { status }, { new: true });
    } else {
      const item = memoryStore.onboardingTasks.find((t) => String(t._id || t.id) === String(id));
      if (item) {
        item.status = status;
        task = item;
      }
    }

    if (!task) {
      return res.status(404).json({ error: 'Onboarding task not found.' });
    }

    // Recalculate employee onboarding progress percentage
    const empId = task.employeeId;
    let allEmpTasks = [];
    if (!isMemoryMode) {
      allEmpTasks = await OnboardingTask.find({ employeeId: empId });
    } else {
      allEmpTasks = memoryStore.onboardingTasks.filter((t) => t.employeeId === empId);
    }

    const totalCount = allEmpTasks.length;
    const completedCount = allEmpTasks.filter((t) => t.status === 'Completed').length;
    const newProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    if (!isMemoryMode) {
      await Employee.findOneAndUpdate({ employeeId: empId }, { onboardingProgress: newProgress });
    } else {
      const empObj = memoryStore.employees.find((e) => e.employeeId === empId);
      if (empObj) empObj.onboardingProgress = newProgress;
    }

    return res.json({ message: 'Task status updated successfully', task, newProgress });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update onboarding task.' });
  }
}

export async function createOnboardingTask(req, res) {
  try {
    const { employeeId, employeeName, title, description, category, dueDate, assignedTo } = req.body;

    if (!title || !dueDate) {
      return res.status(400).json({ error: 'Task title and due date are required.' });
    }

    const newTask = {
      employeeId: employeeId || 'EMP-1001',
      employeeName: employeeName || 'New Hire',
      title,
      description: description || '',
      category: category || 'General',
      status: 'Not Started',
      dueDate,
      assignedTo: assignedTo || 'HR Team'
    };

    let created = null;
    if (!isMemoryMode) {
      created = await OnboardingTask.create(newTask);
    } else {
      newTask._id = String(Date.now());
      newTask.id = newTask._id;
      memoryStore.onboardingTasks.push(newTask);
      created = newTask;
    }

    return res.status(201).json({ message: 'Onboarding task created', task: created });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create onboarding task.' });
  }
}
