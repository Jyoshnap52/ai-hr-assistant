import { Employee } from '../models/Employee.js';
import { isMemoryMode, memoryStore } from '../config/db.js';

export async function getEmployees(req, res) {
  try {
    const { department, status, search } = req.query;
    let list = [];

    if (!isMemoryMode) {
      const query = {};
      if (department && department !== 'All') query.department = department;
      if (status && status !== 'All') query.status = status;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { role: { $regex: search, $options: 'i' } },
          { employeeId: { $regex: search, $options: 'i' } }
        ];
      }
      list = await Employee.find(query).sort({ name: 1 });
    } else {
      list = memoryStore.employees.filter((emp) => {
        if (department && department !== 'All' && emp.department !== department) return false;
        if (status && status !== 'All' && emp.status !== status) return false;
        if (search) {
          const term = search.toLowerCase();
          return (
            emp.name.toLowerCase().includes(term) ||
            emp.role.toLowerCase().includes(term) ||
            emp.employeeId.toLowerCase().includes(term)
          );
        }
        return true;
      });
    }

    return res.json({ employees: list });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch employees list.' });
  }
}

export async function getEmployeeById(req, res) {
  try {
    const { id } = req.params;
    let emp = null;

    if (!isMemoryMode) {
      emp = await Employee.findById(id);
    } else {
      emp = memoryStore.employees.find((e) => String(e._id || e.id) === String(id) || e.employeeId === id);
    }

    if (!emp) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    return res.json({ employee: emp });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch employee details.' });
  }
}

export async function createEmployee(req, res) {
  try {
    const { name, email, department, role, joiningDate, status, manager, phone, location } = req.body;

    if (!name || !email || !department || !role) {
      return res.status(400).json({ error: 'Name, email, department, and role are required.' });
    }

    const employeeId = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
    const newEmp = {
      employeeId,
      name,
      email,
      department,
      role,
      joiningDate: joiningDate || new Date().toISOString().split('T')[0],
      status: status || 'Active',
      manager: manager || 'Sarah Jenkins',
      phone: phone || '+1 (555) 019-2834',
      location: location || 'New York HQ',
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`,
      onboardingProgress: status === 'Onboarding' ? 25 : 100
    };

    let created = null;
    if (!isMemoryMode) {
      created = await Employee.create(newEmp);
    } else {
      newEmp._id = String(Date.now());
      newEmp.id = newEmp._id;
      memoryStore.employees.push(newEmp);
      created = newEmp;
    }

    return res.status(201).json({ message: 'Employee profile created successfully', employee: created });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create employee.' });
  }
}

export async function updateEmployee(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    let updated = null;
    if (!isMemoryMode) {
      updated = await Employee.findByIdAndUpdate(id, updates, { new: true });
    } else {
      const idx = memoryStore.employees.findIndex((e) => String(e._id || e.id) === String(id));
      if (idx !== -1) {
        memoryStore.employees[idx] = { ...memoryStore.employees[idx], ...updates };
        updated = memoryStore.employees[idx];
      }
    }

    if (!updated) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    return res.json({ message: 'Employee updated successfully', employee: updated });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update employee.' });
  }
}
