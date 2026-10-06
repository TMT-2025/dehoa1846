import React, { useState, useEffect } from 'react';
import { CURRICULUM } from '../../constants/curriculum';
import { Grade, Chapter, MatrixData, Lesson, ExamType, SavedConfig } from '../../types/matrix';
import { generateMatrix } from '../../services/matrixService';
import { MatrixDisplay } from './MatrixDisplay';
import { 
  Layout, Plus, CheckCircle, Trash2, Save, 
  ChevronDown, ChevronUp, AlertTriangle, Settings2, RefreshCw, 
  Check, FileText, ChevronRight, Sparkles, Layers, ListFilter,
  Edit3, X, CheckCircle2
} from 'lucide-react';
import { saveMatrixConfig } from '../../services/storageService';

interface MatrixCreatorProps {
  onTransferToExam: (matrixData: MatrixData) => void;
  initialMatrixData?: MatrixData | null;
  loadedConfig?: SavedConfig | null;
  onClearLoadedConfig?: () => void;
}

export const MatrixCreator: React.FC<MatrixCreatorProps> = ({ 
  onTransferToExam,
  initialMatrixData,
  loadedConfig,
  onClearLoadedConfig
}) => {
  const [activeGrade, setActiveGrade] = useState<Grade | null>(12);
  const [selectedChapters, setSelectedChapters] = useState<Chapter[]>([]);
  const [examType, setExamType] = useState<ExamType>(ExamType.REGULAR);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [editableLessons, setEditableLessons] = useState<Lesson[]>([]);
  const [newLessonName, setNewLessonName] = useState('');
  const [extraRequirements, setExtraRequirements] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customChapterName, setCustomChapterName] = useState('Chủ đề tự do');
  const [matrixData, setMatrixData] = useState<MatrixData | null>(initialMatrixData || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);
  const [expandAllLessons, setExpandAllLessons] = useState(false);
  const [showEditor, setShowEditor] = useState(true);

  // Track if we are editing an existing saved matrix
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  const [editingConfigName, setEditingConfigName] = useState<string | null>(null);

  // Load configuration when user clicks "Mở chỉnh sửa" from Storage
  useEffect(() => {
    if (loadedConfig) {
      setActiveGrade(loadedConfig.grade);
      setExamType(loadedConfig.examType);
      setSelectedChapters(loadedConfig.selectedChapters || []);
      setEditableLessons(loadedConfig.editableLessons || []);
      setExtraRequirements(loadedConfig.extraRequirements || '');
      setIsCustomMode(loadedConfig.isCustomMode || false);
      setCustomChapterName(loadedConfig.customChapterName || 'Chủ đề tự do');
      setMatrixData(loadedConfig.generatedMatrix || null);
      setEditingConfigId(loadedConfig.id);
      setEditingConfigName(loadedConfig.name);
      
      // Directly jump into Step 2: Phân bổ & Chọn câu Phần II
      setCurrentStep(2);
      setShowEditor(true);
      setExpandAllLessons(true);

      const hostLesson = (loadedConfig.editableLessons || []).find(l => (l.part2Hosts?.length || 0) > 0);
      if (hostLesson) {
        setExpandedLessonId(hostLesson.id);
      }
    }
  }, [loadedConfig]);

  // Auto initialize default chapter selection for default grade (only on fresh start)
  useEffect(() => {
    if (!editingConfigId && activeGrade && activeGrade !== 'Tự do' && selectedChapters.length === 0) {
      const defaultChapters = CURRICULUM[activeGrade as number] || [];
      if (defaultChapters.length > 0) {
        setSelectedChapters([defaultChapters[0]]);
      }
    }
  }, [activeGrade, editingConfigId]);

  // Synchronize lessons with selected chapters safely (preserving part2Hosts and custom edits)
  useEffect(() => {
    if (isCustomMode) return;
    if (selectedChapters.length === 0) return;

    setEditableLessons(prevLessons => {
      const validLessonIds = new Set<string>();
      const lessonsToAdd: Lesson[] = [];

      selectedChapters.forEach(chapter => {
        chapter.lessons.forEach(cl => {
          validLessonIds.add(cl.id);
          const existing = prevLessons.find(l => l.id === cl.id);
          if (!existing) {
            lessonsToAdd.push({
              ...cl,
              subItems: cl.subItems && cl.subItems.length > 0 
                ? cl.subItems 
                : [`Khái niệm cơ bản & tính chất`, `Ứng dụng & điều chế`],
              part2Hosts: []
            });
          }
        });
      });

      // Keep custom lessons plus lessons from selected chapters
      const keptLessons = prevLessons.filter(l => l.id.startsWith('custom_') || validLessonIds.has(l.id));

      if (lessonsToAdd.length === 0 && keptLessons.length === prevLessons.length) {
        return prevLessons;
      }

      return [...keptLessons, ...lessonsToAdd];
    });
  }, [selectedChapters, isCustomMode]);

  const handleGradeSelect = (grade: Grade) => {
    setIsCustomMode(false);
    setActiveGrade(grade);
    setSelectedChapters([]);
    setExamType(ExamType.REGULAR);
    setMatrixData(null);
    setShowEditor(true);
    setCurrentStep(1);
    setEditingConfigId(null);
    setEditingConfigName(null);
  };

  const handleCustomModeSelect = () => {
    setIsCustomMode(true);
    setActiveGrade('Tự do');
    setExamType(ExamType.CUSTOM);
    setCustomChapterName('Chủ đề tự do');
    setSelectedChapters([{
      id: 'custom_main',
      name: 'Chủ đề tự do',
      lessons: []
    }]);
    setEditableLessons([]);
    setMatrixData(null);
    setShowEditor(true);
    setCurrentStep(2);
    setEditingConfigId(null);
    setEditingConfigName(null);
  };

  const toggleChapter = (chapter: Chapter) => {
    const isMultiple = [
      ExamType.MID_TERM_1, ExamType.END_TERM_1, 
      ExamType.MID_TERM_2, ExamType.END_TERM_2, 
      ExamType.CUSTOM
    ].includes(examType);

    setSelectedChapters(prev => {
      const exists = prev.find(c => c.id === chapter.id);
      if (exists) {
        return prev.filter(c => c.id !== chapter.id);
      } else {
        if (isMultiple) {
          return [...prev, chapter];
        } else {
          return [chapter];
        }
      }
    });
  };

  const handleSelectAllChapters = () => {
    if (activeGrade && activeGrade !== 'Tự do') {
      setSelectedChapters(CURRICULUM[activeGrade as number] || []);
    }
  };

  const handleDeselectAllChapters = () => {
    setSelectedChapters([]);
  };

  const handleAddLesson = () => {
    if (!newLessonName.trim()) return;
    const newLesson: Lesson = {
      id: `custom_${Date.now()}`,
      name: newLessonName.trim(),
      subItems: ['Khái niệm cơ bản', 'Bài tập vận dụng'],
      part2Hosts: []
    };
    setEditableLessons([...editableLessons, newLesson]);
    setNewLessonName('');
    setExpandedLessonId(newLesson.id);
  };

  const handleRemoveLesson = (id: string) => {
    setEditableLessons(editableLessons.filter(l => l.id !== id));
  };

  const handleAddSubItem = (lessonId: string, itemName: string) => {
    if (!itemName.trim()) return;
    const items = itemName.split(/[,;]/).map(i => i.trim()).filter(i => i.length > 0);
    
    setEditableLessons(prev => prev.map(l => {
      if (l.id === lessonId) {
        const currentItems = l.subItems || [];
        const newItems = [...currentItems];
        for (const item of items) {
          if (!newItems.includes(item)) {
            newItems.push(item);
          }
        }
        return { ...l, subItems: newItems };
      }
      return l;
    }));
  };

  const handleRemoveSubItem = (lessonId: string, index: number) => {
    setEditableLessons(prev => prev.map(l => {
      if (l.id === lessonId) {
        const itemName = (l.subItems || [])[index];
        const newHosts = (l.part2Hosts || []).filter(h => h !== itemName);
        return { 
          ...l, 
          subItems: (l.subItems || []).filter((_, i) => i !== index),
          part2Hosts: newHosts
        };
      }
      return l;
    }));
  };

  // Toggle Part II context on/off
  const togglePart2Host = (lessonId: string, itemName: string) => {
    const totalSelected = editableLessons.reduce((acc, l) => acc + (l.part2Hosts?.length || 0), 0);
    
    setEditableLessons(prev => prev.map(l => {
      if (l.id === lessonId) {
        const currentHosts = l.part2Hosts || [];
        if (currentHosts.includes(itemName)) {
          // Bỏ chọn bối cảnh này
          return { ...l, part2Hosts: currentHosts.filter(h => h !== itemName) };
        } else {
          // Thêm bối cảnh này
          if (totalSelected >= 4) {
            alert("Bạn đã chọn đủ 4 bối cảnh cho Phần II (Đúng/Sai). Vui lòng bỏ chọn bớt một bối cảnh (nhấn dấu ✕ ở bảng trên) nếu muốn chọn mục này!");
            return l; 
          }
          return { ...l, part2Hosts: [...currentHosts, itemName] };
        }
      }
      return l;
    }));
  };

  const totalPart2Selected = editableLessons.reduce((acc, l) => acc + (l.part2Hosts?.length || 0), 0);

  // Extract all selected Part II items for the summary panel
  const selectedPart2Items = editableLessons.flatMap(l => 
    (l.part2Hosts || []).map(item => ({
      lessonId: l.id,
      lessonName: l.name,
      item
    }))
  );

  // Auto select 4 hosts if user hasn't selected yet
  const handleAutoSelectHosts = () => {
    let count = 0;
    const newLessons = editableLessons.map(l => ({ ...l, part2Hosts: [] as string[] }));
    
    for (let l of newLessons) {
      if (!l.subItems) continue;
      for (let s of l.subItems) {
        if (count < 4) {
          l.part2Hosts.push(s);
          count++;
        }
      }
      if (count >= 4) break;
    }
    setEditableLessons(newLessons);
  };

  const handleGenerate = () => {
    if (!activeGrade || selectedChapters.length === 0 || editableLessons.length === 0) {
      alert("Vui lòng chọn ít nhất một chương và có bài học!");
      return;
    }
    
    if (totalPart2Selected < 4) {
      const confirmAuto = confirm(`Bạn mới chọn ${totalPart2Selected}/4 bối cảnh cho Phần II. Bạn có muốn hệ thống tự động chọn bù đủ 4 bối cảnh không?`);
      if (confirmAuto) {
        handleAutoSelectHosts();
      } else {
        return;
      }
    }

    setIsGenerating(true);

    const customChapters = isCustomMode 
      ? [{
          id: 'custom_main',
          name: customChapterName,
          lessons: editableLessons
        }]
      : selectedChapters.map(chapter => ({
          ...chapter,
          lessons: editableLessons.filter(el => 
            chapter.lessons.some(cl => cl.id === el.id) || el.id.startsWith('custom_')
          )
        }));

    setTimeout(() => {
      const data = generateMatrix(activeGrade, customChapters, examType, extraRequirements);
      setMatrixData(data);
      setIsGenerating(false);
      setShowEditor(false);
      window.scrollTo({ top: document.getElementById('matrix-result-anchor')?.offsetTop || 0, behavior: 'smooth' });
    }, 400);
  };

  const handleSaveConfig = () => {
    if (!activeGrade) return;

    if (editingConfigId) {
      const confirmUpdate = confirm(`Bạn đang chỉnh sửa ma trận "${editingConfigName}".\n\n• Nhấn [OK] để CẬP NHẬT ĐÈ lên mẫu ma trận này.\n• Nhấn [Cancel] để LƯU THÀNH BẢN SAO MỚI.`);
      if (confirmUpdate) {
        const updatedConfig: SavedConfig = {
          id: editingConfigId,
          name: editingConfigName || `Ma trận ${activeGrade} - ${examType}`,
          timestamp: Date.now(),
          grade: activeGrade,
          selectedChapters,
          examType,
          editableLessons,
          extraRequirements,
          isCustomMode,
          customChapterName,
          generatedMatrix: matrixData || undefined
        };
        saveMatrixConfig(updatedConfig);
        alert(`Đã cập nhật thành công ma trận: "${updatedConfig.name}"!`);
        return;
      }
    }

    const defaultName = editingConfigName 
      ? `${editingConfigName} (Bản sao)` 
      : `Ma trận ${activeGrade} - ${examType} - ${new Date().toLocaleDateString('vi-VN')}`;
    const name = prompt('Nhập tên để lưu mẫu ma trận:', defaultName);
    if (!name) return;

    const newConfig: SavedConfig = {
      id: `config_${Date.now()}`,
      name,
      timestamp: Date.now(),
      grade: activeGrade,
      selectedChapters,
      examType,
      editableLessons,
      extraRequirements,
      isCustomMode,
      customChapterName,
      generatedMatrix: matrixData || undefined
    };

    saveMatrixConfig(newConfig);
    setEditingConfigId(newConfig.id);
    setEditingConfigName(newConfig.name);
    alert('Đã lưu mẫu ma trận thành công vào kho lưu trữ!');
  };

  const handleCancelEditing = () => {
    setEditingConfigId(null);
    setEditingConfigName(null);
    if (onClearLoadedConfig) onClearLoadedConfig();
    setCurrentStep(1);
    setMatrixData(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Editing Mode Banner (When loaded from Storage) */}
      {editingConfigId && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 p-4 rounded-2xl shadow-lg border border-amber-300 flex flex-col md:flex-row items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-950 text-amber-400 rounded-xl shadow-md">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-950 text-amber-300">
                  Đang Chỉnh Sửa Ma Trận Đã Lưu
                </span>
                <span className="text-xs font-bold text-slate-900">
                  {activeGrade === 'Tự do' ? 'Tự do' : `Khối lớp ${activeGrade}`} • {examType}
                </span>
              </div>
              <p className="text-base font-black text-slate-950 mt-0.5">
                {editingConfigName}
              </p>
              <p className="text-xs text-slate-800 font-medium">
                Bạn có thể thay đổi các câu Phần II, điều chỉnh bài học bên dưới, sau đó bấm <b>"Cập nhật ma trận"</b> để tái tạo bảng.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCancelEditing}
              className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-sm"
            >
              Hủy chỉnh sửa (Tạo mới)
            </button>
          </div>
        </div>
      )}

      {/* Editor Panel */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden no-print">
        
        {/* Step Indicator Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl shadow">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                {editingConfigId ? `Chỉnh Sửa Ma Trận: ${editingConfigName}` : 'Thiết Lập Ma Trận Đề Kiểm Tra (GDPT 2018)'}
              </h2>
              <p className="text-xs text-indigo-300">
                Phân bổ chuẩn 40 lệnh hỏi (16 Biết, 12 Hiểu, 12 Vận dụng)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {matrixData && (
              <button
                onClick={() => setShowEditor(!showEditor)}
                className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>{showEditor ? 'Thu gọn bảng chọn' : 'Mở bảng chỉnh sửa'}</span>
              </button>
            )}

            <div className="flex items-center bg-slate-800/80 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setCurrentStep(1)}
                className={`px-3 py-1 rounded-lg transition-colors ${currentStep === 1 ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'}`}
              >
                Bước 1: Phạm vi
              </button>
              <button
                onClick={() => setCurrentStep(2)}
                className={`px-3 py-1 rounded-lg transition-colors ${currentStep === 2 ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'}`}
              >
                Bước 2: Phân bổ câu Phần II
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        {showEditor && (
          <div className="p-6 space-y-6">
            
            {/* STEP 1: Grade, ExamType, Chapters */}
            {currentStep === 1 && (
              <div className="space-y-6">
                
                {/* Grade Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    1. Chọn Khối Lớp Học
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[10, 11, 12].map((g) => (
                      <button
                        key={g}
                        onClick={() => handleGradeSelect(g as Grade)}
                        className={`p-4 rounded-xl border text-center transition-all font-bold ${
                          activeGrade === g && !isCustomMode
                            ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-md ring-2 ring-indigo-500/20'
                            : 'border-slate-200 hover:border-indigo-300 text-slate-700 bg-white'
                        }`}
                      >
                        <div className="text-xl font-extrabold text-indigo-600">Lớp {g}</div>
                        <div className="text-[11px] font-medium text-slate-500 mt-1">
                          {CURRICULUM[g].length} chương sách
                        </div>
                      </button>
                    ))}

                    <button
                      onClick={handleCustomModeSelect}
                      className={`p-4 rounded-xl border text-center transition-all font-bold ${
                        isCustomMode
                          ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-md ring-2 ring-indigo-500/20'
                          : 'border-slate-200 hover:border-indigo-300 text-slate-700 bg-white'
                      }`}
                    >
                      <div className="text-xl font-extrabold text-amber-600">Tự do</div>
                      <div className="text-[11px] font-medium text-slate-500 mt-1">Tự nhập nội dung</div>
                    </button>
                  </div>
                </div>

                {/* Exam Type Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    2. Hình thức kiểm tra
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {Object.values(ExamType).map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setExamType(type);
                          setMatrixData(null);
                        }}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                          examType === type
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chapter Selection (if not custom mode) */}
                {!isCustomMode && activeGrade && activeGrade !== 'Tự do' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        3. Chọn Chương Học Áp Dụng (Đã chọn: {selectedChapters.length})
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSelectAllChapters}
                          className="text-xs font-bold text-indigo-600 hover:underline"
                        >
                          Chọn tất cả
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          onClick={handleDeselectAllChapters}
                          className="text-xs font-bold text-slate-500 hover:underline"
                        >
                          Bỏ chọn
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {CURRICULUM[activeGrade as number]?.map((chapter) => {
                        const isSelected = selectedChapters.some(c => c.id === chapter.id);
                        return (
                          <div
                            key={chapter.id}
                            onClick={() => toggleChapter(chapter)}
                            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                              isSelected
                                ? 'bg-indigo-50/70 border-indigo-500 shadow-sm'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-indigo-950' : 'text-slate-800'}`}>
                                {chapter.name}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-1">
                                {chapter.lessons.length} bài học: {chapter.lessons.map(l => l.name).join(', ')}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Custom mode chapter name */}
                {isCustomMode && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Tên chủ đề / phạm vi kiến thức
                    </label>
                    <input
                      type="text"
                      value={customChapterName}
                      onChange={(e) => setCustomChapterName(e.target.value)}
                      placeholder="VD: Ôn tập Este - Cacbohidrat"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none text-sm"
                    />
                  </div>
                )}

                {/* Move to Step 2 Button */}
                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => {
                      if (selectedChapters.length === 0 && !isCustomMode) {
                        alert("Vui lòng chọn ít nhất một chương học!");
                        return;
                      }
                      setCurrentStep(2);
                    }}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    <span>Tiếp tục: Phân bổ câu hỏi & Chọn bối cảnh Phần II</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}

            {/* STEP 2: Lesson items & Part II Host selection */}
            {currentStep === 2 && (
              <div className="space-y-6">
                
                {/* 1. DEDICATED PANEL: Các bối cảnh đã chọn cho Phần II (Đúng/Sai) */}
                <div className="p-4 bg-emerald-50/90 border border-emerald-300 rounded-2xl space-y-3 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
                      <h4 className="text-xs font-black uppercase tracking-wider text-emerald-950">
                        4 Bối cảnh đã ấn định cho Phần II (Đúng/Sai):
                      </h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                        totalPart2Selected === 4 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-amber-500 text-white animate-bounce'
                      }`}>
                        {totalPart2Selected}/4 bối cảnh
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {totalPart2Selected < 4 && (
                        <button
                          type="button"
                          onClick={handleAutoSelectHosts}
                          className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          ⚡ Tự động bù đủ 4 bối cảnh
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-emerald-800">
                    Mỗi bối cảnh Phần II tương ứng với 1 câu Đúng/Sai (gồm 4 ý: 1 Biết, 2 Hiểu, 1 Vận dụng). Bạn có thể bấm dấu <b>✕</b> để bỏ chọn một bối cảnh và chọn bối cảnh khác từ danh sách bài học bên dưới.
                  </p>

                  {/* Visual Selected Context Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {selectedPart2Items.map(({ lessonId, lessonName, item }, idx) => (
                      <div 
                        key={`${lessonId}-${item}-${idx}`} 
                        className="flex items-center justify-between p-3 bg-white border border-emerald-300 rounded-xl shadow-xs text-xs group hover:border-emerald-500 transition-colors"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black uppercase px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                              Câu {idx + 1}
                            </span>
                            <p className="text-[11px] text-slate-500 font-bold truncate">{lessonName}</p>
                          </div>
                          <p className="font-extrabold text-emerald-950 truncate mt-0.5">• {item}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => togglePart2Host(lessonId, item)}
                          className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                          title="Bỏ chọn bối cảnh này"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {/* Empty Slots */}
                    {Array.from({ length: Math.max(0, 4 - totalPart2Selected) }).map((_, i) => (
                      <div 
                        key={`empty-${i}`} 
                        className="flex items-center justify-center p-3 border-2 border-dashed border-amber-300 bg-amber-50/50 rounded-xl text-xs text-amber-800 font-bold text-center"
                      >
                        <span>+ Còn trống vị trí {totalPart2Selected + i + 1} (Chọn từ bài học bên dưới)</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Lessons & Sub-items Selection List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Danh sách bài học & Chi tiết nội dung ({editableLessons.length} bài)
                    </h3>
                    <button
                      type="button"
                      onClick={() => setExpandAllLessons(!expandAllLessons)}
                      className="text-xs font-bold text-indigo-600 hover:underline"
                    >
                      {expandAllLessons ? 'Thu gọn tất cả bài học' : 'Mở rộng tất cả bài học'}
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
                    {editableLessons.map((lesson) => {
                      const isExpanded = expandAllLessons || expandedLessonId === lesson.id;
                      const hostCount = lesson.part2Hosts?.length || 0;

                      return (
                        <div key={lesson.id} className="border border-slate-200 rounded-xl bg-slate-50/50 overflow-hidden shadow-xs">
                          <div 
                            onClick={() => {
                              if (expandAllLessons) setExpandAllLessons(false);
                              setExpandedLessonId(isExpanded ? null : lesson.id);
                            }}
                            className="p-3.5 bg-white hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors border-b border-slate-100"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-800">{lesson.name}</span>
                              <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-semibold">
                                {lesson.subItems?.length || 0} mục
                              </span>
                              {hostCount > 0 && (
                                <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>{hostCount} bối cảnh P.II</span>
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {lesson.id.startsWith('custom_') && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveLesson(lesson.id);
                                  }}
                                  className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </div>
                          </div>

                          {/* Subitems container */}
                          {isExpanded && (
                            <div className="p-4 bg-slate-50 space-y-3">
                              <p className="text-[11px] font-semibold text-slate-600">
                                Bấm vào nút <span className="text-emerald-700 font-bold">"+ Đặt làm P.II"</span> để chọn mục này làm bối cảnh Đúng/Sai:
                              </p>

                              <div className="space-y-1.5">
                                {lesson.subItems?.map((item, idx) => {
                                  const isHost = lesson.part2Hosts?.includes(item);
                                  return (
                                    <div 
                                      key={idx} 
                                      className={`p-2.5 rounded-lg border flex items-center justify-between text-xs transition-colors ${
                                        isHost 
                                          ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold shadow-xs' 
                                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                                      }`}
                                    >
                                      <span>• {item}</span>
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => togglePart2Host(lesson.id, item)}
                                          className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                                            isHost
                                              ? 'bg-emerald-600 hover:bg-rose-600 text-white shadow-xs'
                                              : 'bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900'
                                          }`}
                                          title={isHost ? "Bấm để bỏ chọn mục này" : "Bấm để chọn làm bối cảnh Phần II"}
                                        >
                                          {isHost ? '✓ Bối cảnh P.II' : '+ Đặt làm P.II'}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveSubItem(lesson.id, idx)}
                                          className="text-slate-400 hover:text-rose-500 p-1"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Add subitem input */}
                              <div className="flex items-center gap-2 pt-1">
                                <input
                                  type="text"
                                  placeholder="Thêm mục chi tiết mới (Nhấn Enter)..."
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleAddSubItem(lesson.id, (e.target as HTMLInputElement).value);
                                      (e.target as HTMLInputElement).value = '';
                                    }
                                  }}
                                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs outline-none focus:border-indigo-500 bg-white"
                                />
                                <span className="text-[10px] text-slate-400 font-medium">Nhấn Enter</span>
                              </div>

                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Custom Lesson */}
                  <div className="flex items-center gap-2 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                    <input
                      type="text"
                      value={newLessonName}
                      onChange={(e) => setNewLessonName(e.target.value)}
                      placeholder="Thêm bài học mới hoặc chủ đề tự chọn..."
                      className="flex-1 px-3.5 py-2 rounded-lg border border-indigo-200 text-xs outline-none focus:border-indigo-500 bg-white"
                    />
                    <button
                      onClick={handleAddLesson}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm bài</span>
                    </button>
                  </div>
                </div>

                {/* Extra requirements textarea */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Yêu cầu bổ sung cho ma trận (Tùy chọn)
                  </label>
                  <textarea
                    rows={2}
                    value={extraRequirements}
                    onChange={(e) => setExtraRequirements(e.target.value)}
                    placeholder="VD: Chú trọng các câu hỏi gắn liền thực tiễn, thí nghiệm hóa học sản xuất, các bài toán nhiệt động học..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-indigo-500 outline-none"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    ← Quay lại Bước 1
                  </button>

                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-extrabold text-sm shadow-xl hover:shadow-indigo-500/20 transition-all cursor-pointer"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang tính toán phân bổ 40 lệnh...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>{editingConfigId ? 'CẬP NHẬT & TÁI TẠO MA TRẬN' : 'TẠO MA TRẬN ĐỀ (40 LỆNH HỎI)'}</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            )}

          </div>
        )}
      </div>

      {/* Result Matrix Display */}
      {matrixData && (
        <div id="matrix-result-anchor">
          <MatrixDisplay
            data={matrixData}
            onTransferToExam={onTransferToExam}
            onSaveConfig={handleSaveConfig}
            onEditMatrix={() => {
              setShowEditor(true);
              setCurrentStep(2);
              setExpandAllLessons(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      )}

    </div>
  );
};
