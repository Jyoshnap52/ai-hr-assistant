import { isMemoryMode, memoryStore } from '../config/db.js';
import { Analytics } from '../models/Analytics.js';
import { Employee } from '../models/Employee.js';
import { DocumentModel } from '../models/Document.js';
import { Candidate } from '../models/Candidate.js';

export async function getDashboardMetrics(req, res) {
  try {
    let totalEmployees = 248;
    let pendingOnboarding = 12;
    let resumesToReview = 37;
    let indexedDocuments = 126;

    if (!isMemoryMode) {
      const empCount = await Employee.countDocuments({});
      if (empCount > 0) totalEmployees = empCount;

      const onbCount = await Employee.countDocuments({ status: 'Onboarding' });
      if (onbCount > 0) pendingOnboarding = onbCount;

      const candCount = await Candidate.countDocuments({});
      if (candCount > 0) resumesToReview = candCount;

      const docCount = await DocumentModel.countDocuments({ status: 'Indexed' });
      if (docCount > 0) indexedDocuments = docCount;
    } else {
      if (memoryStore.employees.length) totalEmployees = memoryStore.employees.length;
      if (memoryStore.employees.filter((e) => e.status === 'Onboarding').length) {
        pendingOnboarding = memoryStore.employees.filter((e) => e.status === 'Onboarding').length;
      }
      if (memoryStore.candidates.length) resumesToReview = memoryStore.candidates.length;
      if (memoryStore.documents.length) indexedDocuments = memoryStore.documents.length;
    }

    return res.json({
      metrics: {
        totalEmployees: { value: totalEmployees, change: '+8.2% this month' },
        pendingOnboarding: { value: pendingOnboarding, subtitle: '4 due today' },
        resumesToReview: { value: resumesToReview, subtitle: '8 high priority' },
        knowledgeBase: { value: indexedDocuments, subtitle: 'documents indexed' }
      },
      hiringOverview: [
        { stage: 'Applications', count: 142 },
        { stage: 'Shortlisted', count: 48 },
        { stage: 'Interview', count: 18 },
        { stage: 'Selected', count: 7 }
      ],
      recentActivity: [
        { id: 1, type: 'resume', text: 'Resume uploaded by HR Team for Senior Full Stack Developer', time: '10 mins ago' },
        { id: 2, type: 'onboarding', text: 'New employee onboarding started for Alex Rivera', time: '45 mins ago' },
        { id: 3, type: 'document', text: 'Work-From-Home Policy 2026 document re-indexed', time: '2 hours ago' },
        { id: 4, type: 'ai', text: 'AI Knowledge Base indexed 4 new policy documents', time: '4 hours ago' }
      ]
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch dashboard metrics.' });
  }
}

export async function getAnalyticsData(req, res) {
  try {
    return res.json({
      hiringMetrics: [
        { month: 'Jan', applications: 120, shortlisted: 40, interviews: 15, selected: 5 },
        { month: 'Feb', applications: 135, shortlisted: 45, interviews: 18, selected: 6 },
        { month: 'Mar', applications: 150, shortlisted: 52, interviews: 22, selected: 8 },
        { month: 'Apr', applications: 160, shortlisted: 55, interviews: 20, selected: 7 },
        { month: 'May', applications: 175, shortlisted: 60, interviews: 25, selected: 9 },
        { month: 'Jun', applications: 190, shortlisted: 68, interviews: 28, selected: 10 }
      ],
      departmentDistribution: [
        { name: 'Engineering', value: 92, color: '#4F46E5' },
        { name: 'Product & Design', value: 44, color: '#06B6D4' },
        { name: 'Human Resources', value: 28, color: '#10B981' },
        { name: 'Sales & Marketing', value: 54, color: '#F59E0B' },
        { name: 'Operations', value: 30, color: '#6B7280' }
      ],
      aiUsage: {
        questionsAsked: 1420,
        documentsIndexed: 126,
        avgResponseTimeMs: 420,
        topTopics: [
          { topic: 'Leave & Paid Time Off', count: 412 },
          { topic: 'Medical & Insurance Claims', count: 328 },
          { topic: 'Work-From-Home Policy', count: 289 },
          { topic: 'Onboarding Checklist', count: 215 },
          { topic: 'Notice Period & Offboarding', count: 176 }
        ]
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch analytics data.' });
  }
}
