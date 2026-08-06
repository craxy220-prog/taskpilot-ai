import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Document, Summary, DocumentTask, UploadedFile } from '../types';

const EDGE_FUNCTION_URL = 'https://cgksadcrorettklvytbp.supabase.co/functions/v1/document-ai';

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDoc, setCurrentDoc] = useState<Document | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [tasks, setTasks] = useState<DocumentTask[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) setDocuments(data);
  }, []);

  useEffect(() => {
    fetchDocuments().finally(() => setLoading(false));
  }, [fetchDocuments]);

  async function uploadDocument(file: File): Promise<UploadedFile | null> {
    setUploading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Not authenticated');
      setUploading(false);
      return null;
    }

    const uploadId = crypto.randomUUID();
    const filePath = `${user.id}/${uploadId}/${file.name}`;

    const uploaded: UploadedFile = {
      id: uploadId,
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0,
      status: 'uploading',
    };

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return { ...uploaded, status: 'error', error: uploadError.message };
    }

    // Read file content for AI processing
    let contentText = '';
    if (file.type === 'text/plain' || file.type === 'text/markdown') {
      contentText = await file.text();
    } else if (file.type === 'application/pdf') {
      // For PDF we'll send to edge function for processing
      contentText = '[PDF content uploaded - will be processed server-side]';
    } else if (file.type.includes('wordprocessingml')) {
      contentText = '[DOCX content uploaded - will be processed server-side]';
    }

    // Insert document record
    const { data: docData, error: insertError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        title: file.name.replace(/\.[^/.]+$/, ''),
        file_type: file.type,
        file_size_bytes: file.size,
        file_path: filePath,
        original_filename: file.name,
        content_text: contentText || null,
        status: 'processing',
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setUploading(false);
      return { ...uploaded, status: 'error', error: insertError.message };
    }

    // Add to local documents list
    setDocuments(prev => [docData as Document, ...prev]);
    setCurrentDoc(docData as Document);

    // Process with AI
    if (contentText) {
      processDocumentWithAI(docData.id, contentText);
    } else {
      // Mark as ready if no text extraction needed
      await supabase
        .from('documents')
        .update({ status: 'ready' })
        .eq('id', docData.id);

      setDocuments(prev =>
        prev.map(d => d.id === docData.id ? { ...d, status: 'ready' } : d)
      );
      if (currentDoc?.id === docData.id) {
        setCurrentDoc(prev => prev ? { ...prev, status: 'ready' } : null);
      }
    }

    setUploading(false);
    return { ...uploaded, status: 'ready' };
  }

  async function processDocumentWithAI(docId: string, content: string) {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) throw new Error('No auth token');

      // Get summary
      const summaryRes = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'summarize',
          documentContent: content,
        }),
      });

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();

        // Save summary
        const { data: savedSummary } = await supabase
          .from('summaries')
          .insert({
            document_id: docId,
            user_id: (await supabase.auth.getUser()).data.user?.id,
            summary_text: summaryData.summary,
            key_points: summaryData.keyPoints || [],
          })
          .select()
          .single();

        if (savedSummary) setSummary(savedSummary as Summary);
      }

      // Extract tasks
      const tasksRes = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'extract-tasks',
          documentContent: content,
        }),
      });

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        const userId = (await supabase.auth.getUser()).data.user?.id;

        if (tasksData.tasks && Array.isArray(tasksData.tasks)) {
          const newTasks: DocumentTask[] = [];
          for (const t of tasksData.tasks) {
            const { data } = await supabase
              .from('document_tasks')
              .insert({
                document_id: docId,
                user_id: userId,
                title: t.title,
                description: t.description || null,
                priority: t.priority || 'medium',
                deadline: t.deadline || null,
              })
              .select()
              .single();
            if (data) newTasks.push(data as DocumentTask);
          }
          setTasks(newTasks);
        }
      }

      // Mark document as ready
      await supabase
        .from('documents')
        .update({ status: 'ready' })
        .eq('id', docId);

      setDocuments(prev =>
        prev.map(d => d.id === docId ? { ...d, status: 'ready' } : d)
      );
      setCurrentDoc(prev => prev?.id === docId ? { ...prev, status: 'ready' } : prev);
    } catch (err) {
      console.error('AI processing error:', err);
      await supabase
        .from('documents')
        .update({ status: 'error' })
        .eq('id', docId);
    }
  }

  async function loadDocument(doc: Document) {
    setCurrentDoc(doc);

    // Load summary
    const { data: sumData } = await supabase
      .from('summaries')
      .select('*')
      .eq('document_id', doc.id)
      .single();
    setSummary(sumData as Summary | null);

    // Load tasks
    const { data: taskData } = await supabase
      .from('document_tasks')
      .select('*')
      .eq('document_id', doc.id)
      .order('created_at');
    setTasks(taskData as DocumentTask[] || []);
  }

  async function deleteDocument(id: string) {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;

    // Delete from storage
    await supabase.storage.from('documents').remove([doc.file_path]);

    // Delete from database (cascades to summaries, chats, tasks)
    await supabase.from('documents').delete().eq('id', id);

    setDocuments(prev => prev.filter(d => d.id !== id));
    if (currentDoc?.id === id) {
      setCurrentDoc(null);
      setSummary(null);
      setTasks([]);
    }
  }

  return {
    documents,
    loading,
    currentDoc,
    summary,
    tasks,
    uploading,
    error,
    uploadDocument,
    loadDocument,
    deleteDocument,
    fetchDocuments,
    setCurrentDoc,
  };
}