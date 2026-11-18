import React, { useState, useEffect } from 'react';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Plus,
  Filter,
  Users2
} from 'lucide-react';

export default function EmployeesPage() {
  const { isAdmin } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newEmp, setNewEmp] = useState({
    name: '',
    email: '',
    department: 'Engineering',
    role: '',
    joiningDate: new Date().toISOString().split('T')[0],
    status: 'Active'
  });

  useEffect(() => {
    fetchEmployees();
  }, [departmentFilter, statusFilter]);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees', {
        params: { department: departmentFilter, status: statusFilter, search }
      });
      setEmployees(res.data.employees || []);
    } catch (err) {
      console.error('Failed to fetch employee directory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    try {
      await api.post('/employees', newEmp);
      setShowAddModal(false);
      setNewEmp({
        name: '',
        email: '',
        department: 'Engineering',
        role: '',
        joiningDate: new Date().toISOString().split('T')[0],
        status: 'Active'
      });
      fetchEmployees();
    } catch (err) {
      alert(err.message || 'Failed to create employee profile.');
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      emp.name.toLowerCase().includes(s) ||
      emp.role.toLowerCase().includes(s) ||
      emp.employeeId.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Employee Directory</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Manage workforce profiles, roles, and onboarding status.</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, role, or ID..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 focus:bg-white text-slate-900 placeholder:text-slate-400 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" /> Dept:
            </span>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="py-1.5 px-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 font-medium text-slate-900"
            >
              <option value="All">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Product & Design">Product & Design</option>
              <option value="Sales & Marketing">Sales & Marketing</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 font-medium text-slate-900"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Onboarding">Onboarding</option>
              <option value="On Leave">On Leave</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employee Cards Grid */}
      {loading ? (
        <LoadingSpinner label="Loading employees..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => (
            <div
              key={emp._id || emp.id}
              onClick={() => setSelectedEmployee(emp)}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer space-y-4 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={emp.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'}
                    alt={emp.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {emp.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">{emp.role}</p>
                  </div>
                </div>
                <Badge
                  variant={emp.status === 'Active' ? 'success' : emp.status === 'Onboarding' ? 'warning' : 'default'}
                  size="sm"
                >
                  {emp.status}
                </Badge>
              </div>

              <div className="space-y-1 text-xs text-slate-600 pt-3 border-t border-slate-100 font-normal">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">ID:</span>
                  <span className="font-medium text-slate-900">{emp.employeeId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Department:</span>
                  <span className="font-medium text-slate-900">{emp.department}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Joined:</span>
                  <span className="font-medium text-slate-900">{emp.joiningDate}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Onboarding</span>
                  <span className="font-semibold text-indigo-600">{emp.onboardingProgress || 0}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: `${emp.onboardingProgress || 0}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Employee Detail Modal */}
      <Modal
        isOpen={!!selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        title="Employee Profile"
      >
        {selectedEmployee && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <img
                src={selectedEmployee.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'}
                alt={selectedEmployee.name}
                className="w-12 h-12 rounded-full object-cover border border-slate-200"
              />
              <div>
                <h3 className="text-sm font-bold text-slate-900">{selectedEmployee.name}</h3>
                <p className="text-slate-500 font-medium">{selectedEmployee.role}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={selectedEmployee.status === 'Active' ? 'success' : 'warning'} size="sm">
                    {selectedEmployee.status}
                  </Badge>
                  <span className="text-slate-400 font-medium">{selectedEmployee.employeeId}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-slate-600">
                <h4 className="font-semibold text-slate-900 border-b border-slate-200 pb-1 mb-2">Personal Info</h4>
                <p><span className="text-slate-400">Email:</span> {selectedEmployee.email}</p>
                <p><span className="text-slate-400">Department:</span> {selectedEmployee.department}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-slate-600">
                <h4 className="font-semibold text-slate-900 border-b border-slate-200 pb-1 mb-2">Employment</h4>
                <p><span className="text-slate-400">Joined:</span> {selectedEmployee.joiningDate}</p>
                <p><span className="text-slate-400">Manager:</span> {selectedEmployee.manager || 'Sarah Jenkins'}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Employee Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Employee"
      >
        <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={newEmp.name}
              onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })}
              placeholder="e.g. Alex Rivera"
              className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 text-slate-900 font-medium"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Corporate Email</label>
            <input
              type="email"
              required
              value={newEmp.email}
              onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
              placeholder="alex.rivera@company.com"
              className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 text-slate-900 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Department</label>
              <select
                value={newEmp.department}
                onChange={(e) => setNewEmp({ ...newEmp, department: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 text-slate-900 font-medium"
              >
                <option value="Engineering">Engineering</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Product & Design">Product & Design</option>
                <option value="Sales & Marketing">Sales & Marketing</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Role Title</label>
              <input
                type="text"
                required
                value={newEmp.role}
                onChange={(e) => setNewEmp({ ...newEmp, role: e.target.value })}
                placeholder="Software Engineer"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 text-slate-900 font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-3.5 py-2 border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-xs transition-colors"
            >
              Create Profile
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
