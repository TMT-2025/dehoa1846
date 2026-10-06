import { SavedConfig, MatrixData } from '../types/matrix';
import { ExamData } from '../types/exam';

const STORAGE_KEY_MATRICES = 'chem_saved_matrices';
const STORAGE_KEY_EXAMS = 'chem_saved_exams';

export const getSavedMatrices = (): SavedConfig[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MATRICES);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading saved matrices:', e);
    return [];
  }
};

export const saveMatrixConfig = async (config: SavedConfig): Promise<void> => {
  try {
    const existing = getSavedMatrices();
    const updated = [config, ...existing.filter(item => item.id !== config.id)];
    localStorage.setItem(STORAGE_KEY_MATRICES, JSON.stringify(updated));

    // Also sync to backend API if available
    try {
      await fetch('/api/matrices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
    } catch {
      // Backend optional
    }
  } catch (e) {
    console.error('Error saving matrix:', e);
  }
};

export const deleteSavedMatrix = async (id: string): Promise<void> => {
  try {
    const existing = getSavedMatrices();
    const updated = existing.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY_MATRICES, JSON.stringify(updated));

    try {
      await fetch(`/api/matrices/${id}`, { method: 'DELETE' });
    } catch {
      // Backend optional
    }
  } catch (e) {
    console.error('Error deleting matrix:', e);
  }
};

export const getSavedExams = (): ExamData[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EXAMS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading saved exams:', e);
    return [];
  }
};

export const saveExamData = async (exam: ExamData): Promise<void> => {
  try {
    const existing = getSavedExams();
    const withId = {
      ...exam,
      id: exam.id || `exam_${Date.now()}`,
      createdAt: exam.createdAt || Date.now()
    };
    const updated = [withId, ...existing.filter(item => item.id !== withId.id)];
    localStorage.setItem(STORAGE_KEY_EXAMS, JSON.stringify(updated));

    try {
      await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(withId)
      });
    } catch {
      // Backend optional
    }
  } catch (e) {
    console.error('Error saving exam:', e);
  }
};

export const deleteSavedExam = async (id: string): Promise<void> => {
  try {
    const existing = getSavedExams();
    const updated = existing.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY_EXAMS, JSON.stringify(updated));

    try {
      await fetch(`/api/exams/${id}`, { method: 'DELETE' });
    } catch {
      // Backend optional
    }
  } catch (e) {
    console.error('Error deleting exam:', e);
  }
};
