import { DocumentModel } from '../models/Document.js';
import { extractTextFromFile } from '../services/documents/textExtractor.js';
import { chunkText } from '../services/documents/chunker.js';
import { addChunksToVectorStore, deleteDocumentChunks } from '../services/rag/vectorStore.js';
import { isMemoryMode, memoryStore } from '../config/db.js';

export async function uploadDocument(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please select a document file to upload.' });
    }

    const { originalname, mimetype, path: filePath, size } = req.file;
    const category = req.body.category || 'Company Policy';

    // 1. Create document record with Processing status
    let docRecord = {
      title: originalname.replace(/\.[^/.]+$/, ''),
      originalName: originalname,
      fileType: mimetype.includes('pdf') ? 'PDF' : mimetype.includes('word') || mimetype.includes('docx') ? 'DOCX' : 'TXT',
      fileSize: size,
      filePath,
      category,
      uploadedBy: req.user.name || 'HR Admin',
      status: 'Processing',
      chunkCount: 0
    };

    let savedDoc = null;
    if (!isMemoryMode) {
      savedDoc = await DocumentModel.create(docRecord);
    } else {
      docRecord._id = String(Date.now());
      docRecord.id = docRecord._id;
      docRecord.createdAt = new Date().toISOString();
      memoryStore.documents.push(docRecord);
      savedDoc = docRecord;
    }

    const docId = savedDoc._id || savedDoc.id;

    // Async pipeline processing
    try {
      // 2. Extract text
      const extractedText = await extractTextFromFile(filePath, mimetype);

      // 3. Clean and split into chunks
      const chunks = chunkText(extractedText, 500, 100);

      // 4. Generate embeddings and store vectors
      const chunkCount = await addChunksToVectorStore(chunks, docId, savedDoc.title);

      // 5. Update document status to Indexed
      if (!isMemoryMode) {
        await DocumentModel.findByIdAndUpdate(docId, {
          status: 'Indexed',
          chunkCount: chunkCount
        });
      } else {
        const item = memoryStore.documents.find((d) => String(d._id || d.id) === String(docId));
        if (item) {
          item.status = 'Indexed';
          item.chunkCount = chunkCount;
        }
      }

      return res.status(201).json({
        message: `Successfully processed and indexed ${originalname}`,
        document: {
          id: docId,
          title: savedDoc.title,
          status: 'Indexed',
          chunkCount: chunkCount
        }
      });
    } catch (processError) {
      console.error('Document ingestion error:', processError.message);
      if (!isMemoryMode) {
        await DocumentModel.findByIdAndUpdate(docId, {
          status: 'Failed',
          errorMessage: processError.message
        });
      } else {
        const item = memoryStore.documents.find((d) => String(d._id || d.id) === String(docId));
        if (item) {
          item.status = 'Failed';
          item.errorMessage = processError.message;
        }
      }
      return res.status(500).json({ error: 'Failed to process document text and generate vector embeddings.' });
    }
  } catch (error) {
    console.error('Document upload error:', error);
    return res.status(500).json({ error: 'An error occurred during document upload.' });
  }
}

export async function getDocuments(req, res) {
  try {
    let docs = [];
    if (!isMemoryMode) {
      docs = await DocumentModel.find({}).sort({ createdAt: -1 });
    } else {
      docs = memoryStore.documents;
    }
    return res.json({ documents: docs });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch knowledge base documents.' });
  }
}

export async function deleteDocument(req, res) {
  try {
    const { id } = req.params;

    // Delete document chunks from vector store
    await deleteDocumentChunks(id);

    if (!isMemoryMode) {
      await DocumentModel.findByIdAndDelete(id);
    } else {
      memoryStore.documents = memoryStore.documents.filter((d) => String(d._id || d.id) !== String(id));
    }

    return res.json({ message: 'Document and vector embeddings removed successfully.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete document.' });
  }
}
