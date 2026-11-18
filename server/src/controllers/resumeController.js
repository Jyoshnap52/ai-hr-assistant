import { analyzeResumeFile } from '../services/ai/resumeAnalyzer.js';
import { Candidate } from '../models/Candidate.js';
import { isMemoryMode, memoryStore } from '../config/db.js';

export async function screenResumes(req, res) {
  try {
    const files = req.files || [];
    const { jobDescription } = req.body;

    if (!files.length) {
      return res.status(400).json({ error: 'Please upload at least one resume file (PDF, DOCX, or TXT).' });
    }

    const processedCandidates = [];

    for (const file of files) {
      const { path: filePath, mimetype, originalname } = file;

      // Analyze resume against JD
      const analysis = await analyzeResumeFile(filePath, mimetype, jobDescription, originalname);

      let savedCandidate = null;
      if (!isMemoryMode) {
        savedCandidate = await Candidate.create(analysis);
      } else {
        analysis._id = String(Date.now() + Math.floor(Math.random() * 1000));
        analysis.id = analysis._id;
        analysis.createdAt = new Date().toISOString();
        memoryStore.candidates.push(analysis);
        savedCandidate = analysis;
      }

      processedCandidates.push(savedCandidate);
    }

    return res.status(201).json({
      message: `Successfully analyzed ${processedCandidates.length} resume(s)`,
      candidates: processedCandidates
    });
  } catch (error) {
    console.error('Resume screening error:', error);
    return res.status(500).json({ error: 'An error occurred during resume screening.' });
  }
}

export async function getCandidates(req, res) {
  try {
    let list = [];
    if (!isMemoryMode) {
      list = await Candidate.find({}).sort({ matchScore: -1 });
    } else {
      list = [...memoryStore.candidates].sort((a, b) => b.matchScore - a.matchScore);
    }
    return res.json({ candidates: list });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch candidate list.' });
  }
}

export async function getCandidateById(req, res) {
  try {
    const { id } = req.params;
    let candidate = null;

    if (!isMemoryMode) {
      candidate = await Candidate.findById(id);
    } else {
      candidate = memoryStore.candidates.find((c) => String(c._id || c.id) === String(id));
    }

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate profile not found.' });
    }

    return res.json({ candidate });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load candidate profile details.' });
  }
}
