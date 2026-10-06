
import React, { useState, useEffect } from 'react';
import { CURRICULUM } from './constants';
import { Grade, Chapter, MatrixData, Lesson, ExamType, SavedConfig } from './types';
import { generateMatrix } from './services/matrixService';
import MatrixDisplay from './components/MatrixDisplay';
import { 
  Layout, Plus, Download, FileSpreadsheet, Image as ImageIcon, 
  CheckCircle, School, Trash2, Save, 
  ChevronDown, ChevronUp, ListFilter, MessageSquareQuote,
  Target, AlertTriangle, Settings2, RefreshCw, Check, FileText,
  ChevronRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { domToPng, domToCanvas } from 'modern-screenshot';
import { jsPDF } from 'jspdf';

const App: React.FC = () => {
  const [activeGrade, setActiveGrade] = useState<Grade | null>(null);
  const [selectedChapters, setSelectedChapters] = useState<Chapter[]>([]);
  const [examType, setExamType] = useState<ExamType>(ExamType.REGULAR);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [editableLessons, setEditableLessons] = useState<Lesson[]>([]);
  const [newLessonName, setNewLessonName] = useState('');
  const [extraRequirements, setExtraRequirements] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customChapterName, setCustomChapterName] = useState('Chủ đề tự do');
  const [matrixData, setMatrixData] = useState<MatrixData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(true);
  const [savedConfigs, setSavedConfigs] = useState<SavedConfig[]>([]);
  const [showSavedList, setShowSavedList] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('chemistry_matrix_configs');
    if (saved) {
      try {
        setSavedConfigs(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved configs', e);
      }
    }
  }, []);

  const saveToLocalStorage = (configs: SavedConfig[]) => {
    localStorage.setItem('chemistry_matrix_configs', JSON.stringify(configs));
    setSavedConfigs(configs);
  };

  const handleSaveConfig = () => {
    if (!activeGrade) return;
    
    const name = prompt('Nhập tên để lưu ma trận này:', `Ma trận ${activeGrade} - ${examType} - ${new Date().toLocaleDateString('vi-VN')}`);
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
      customChapterName
    };

    saveToLocalStorage([newConfig, ...savedConfigs]);
    alert('Đã lưu ma trận thành công!');
  };

  const handleLoadConfig = (config: SavedConfig) => {
    setActiveGrade(config.grade);
    setSelectedChapters(config.selectedChapters);
    setExamType(config.examType);
    setEditableLessons(config.editableLessons);
    setExtraRequirements(config.extraRequirements);
    setIsCustomMode(config.isCustomMode);
    setCustomChapterName(config.customChapterName);
    setMatrixData(null);
    setShowEditor(true);
    setCurrentStep(config.isCustomMode ? 2 : 1);
    setShowSavedList(false);
    alert(`Đã tải ma trận: ${config.name}`);
  };

  const handleDeleteConfig = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Bạn có chắc chắn muốn xóa ma trận đã lưu này?')) {
      saveToLocalStorage(savedConfigs.filter(c => c.id !== id));
    }
  };

  useEffect(() => {
    if (selectedChapters.length > 0) {
      // Merge lessons from all selected chapters, but keep track of which chapter they belong to
      // For simplicity in editing, we'll just manage a flat list of lessons
      // but we need to be careful when generating the matrix to map them back if needed.
      // Actually, the current editableLessons state is a flat list. 
      // When chapters change, we should probably re-initialize it.
      const allLessons: Lesson[] = [];
      selectedChapters.forEach(chapter => {
        chapter.lessons.forEach(lesson => {
          // Check if lesson already exists in editableLessons to preserve changes
          const existing = editableLessons.find(l => l.id === lesson.id);
          if (existing) {
            allLessons.push(existing);
          } else {
            allLessons.push({ ...lesson, subItems: lesson.subItems || [], part2Hosts: [] });
          }
        });
      });
      setEditableLessons(allLessons);
    } else {
      setEditableLessons([]);
    }
  }, [selectedChapters]);

  const handleGradeSelect = (grade: Grade) => {
    setIsCustomMode(false);
    setActiveGrade(grade);
    setSelectedChapters([]);
    setExamType(ExamType.REGULAR);
    setMatrixData(null);
    setShowEditor(true);
    setCurrentStep(1);
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
  };

  const handleExamTypeSelect = (type: ExamType) => {
    setExamType(type);
    setMatrixData(null);
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
      setSelectedChapters(CURRICULUM[activeGrade as number]);
    }
  };

  const handleDeselectAllChapters = () => {
    setSelectedChapters([]);
  };

  const handleCreateNew = () => {
    setIsCustomMode(false);
    setActiveGrade(null);
    setSelectedChapters([]);
    setExamType(ExamType.REGULAR);
    setMatrixData(null);
    setEditableLessons([]);
    setExtraRequirements('');
    setShowEditor(true);
    setCurrentStep(1);
  };

  const handleAddLesson = () => {
    if (!newLessonName.trim()) return;
    const newLesson: Lesson = {
      id: `custom_${Date.now()}`,
      name: newLessonName.trim(),
      subItems: [],
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
    
    // Support multiple items separated by commas or semicolons
    const items = itemName.split(/[,;]/).map(i => i.trim()).filter(i => i.length > 0);
    
    setEditableLessons(prev => prev.map(l => {
      if (l.id === lessonId) {
        const currentItems = l.subItems || [];
        const newItems = [...currentItems];
        
        for (const item of items) {
          if (newItems.length >= 10) break;
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

  const togglePart2Host = (lessonId: string, itemName: string) => {
    const totalSelected = editableLessons.reduce((acc, l) => acc + (l.part2Hosts?.length || 0), 0);
    
    setEditableLessons(prev => prev.map(l => {
      if (l.id === lessonId) {
        const currentHosts = l.part2Hosts || [];
        if (currentHosts.includes(itemName)) {
          return { ...l, part2Hosts: currentHosts.filter(h => h !== itemName) };
        } else {
          if (totalSelected >= 4) return l; 
          return { ...l, part2Hosts: [...currentHosts, itemName] };
        }
      }
      return l;
    }));
  };

  const totalPart2Selected = editableLessons.reduce((acc, l) => acc + (l.part2Hosts?.length || 0), 0);

  const handleGenerate = () => {
    if (!activeGrade || selectedChapters.length === 0 || editableLessons.length === 0) return;
    if (totalPart2Selected < 4) {
      alert("Vui lòng chọn đủ 4 mục chi tiết để làm bối cảnh cho Phần II (Đúng/Sai).");
      return;
    }
    setIsGenerating(true);
    
    // Reconstruct chapters with edited lessons
    const customChapters = isCustomMode 
      ? [{
          id: 'custom_main',
          name: customChapterName,
          lessons: editableLessons
        }]
      : selectedChapters.map(chapter => ({
          ...chapter,
          lessons: editableLessons.filter(el => 
            chapter.lessons.some(cl => cl.id === el.id)
          )
        }));

    // For non-custom mode, we still add the virtual chapter for custom lessons if any
    if (!isCustomMode) {
      const customLessonsOnly = editableLessons.filter(el => el.id.startsWith('custom_'));
      if (customLessonsOnly.length > 0) {
        customChapters.push({
          id: 'custom_chapter',
          name: 'Nội dung bổ sung',
          lessons: customLessonsOnly
        });
      }
    }

    setTimeout(() => {
      const data = generateMatrix(activeGrade, customChapters, examType, extraRequirements);
      setMatrixData(data);
      setIsGenerating(false);
      setShowEditor(false);
      window.scrollTo({ top: document.getElementById('matrix-result-anchor')?.offsetTop || 0, behavior: 'smooth' });
    }, 600);
  };

  const exportToExcel = () => {
    if (!matrixData) return;
    const wsData = [
      ['MA TRẬN CHI TIẾT ĐỀ KIỂM TRA HÓA HỌC'],
      [`LỚP ${matrixData.grade} - ${matrixData.examType}`],
      [`PHẠM VI: ${matrixData.chapters.map(c => c.name).join(', ')}`],
      [],
      ['TT', 'Nội dung', 'Đơn vị', 'Chi tiết', 'P1-B', 'P1-H', 'P1-V', 'P2-B', 'P2-H', 'P2-V', 'P3-B', 'P3-H', 'P3-V', 'Tổng', 'Tỉ lệ'],
      ...matrixData.rows.map((row, idx) => [
        idx + 1, row.content, row.lessonName, row.detailName,
        row.part1.know, row.part1.understand, row.part1.apply,
        row.part2.know, row.part2.understand, row.part2.apply,
        row.part3.know, row.part3.understand, row.part3.apply,
        row.total, `${((row.total / 40) * 100).toFixed(1)}%`
      ]),
      [],
      ['Yêu cầu bổ sung:', matrixData.extraRequirements || 'Không có']
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Matrix');
    XLSX.writeFile(wb, `Matrix_Chemistry_Grade${matrixData.grade}_${matrixData.examType}.xlsx`);
  };

  const exportToImage = async () => {
    const element = document.getElementById('matrix-table-container');
    if (!element) return;
    
    const originalStyle = element.getAttribute('style') || '';
    try {
      setIsGenerating(true);
      
      // Optimization for capture: ensure full visibility and clean borders
      element.style.borderRadius = '0';
      element.style.boxShadow = 'none';
      element.style.overflow = 'visible';
      element.style.width = 'fit-content';
      element.style.maxWidth = 'none';
      
      // Wait a tiny bit for styles to settle
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const dataUrl = await domToPng(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        filter: (node) => {
          if (node instanceof HTMLElement && node.classList.contains('no-print')) {
            return false;
          }
          return true;
        }
      });
      
      const link = document.createElement('a');
      link.download = `MaTran_HoaHoc_${matrixData?.grade}_${matrixData?.examType}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error exporting image:', error);
      alert('Có lỗi khi xuất ảnh. Bạn có thể thử "IN" và chọn "Lưu dưới dạng PDF" hoặc chụp màn hình.');
    } finally {
      setIsGenerating(false);
      if (element) {
        element.setAttribute('style', originalStyle);
      }
    }
  };

  const exportToPDF = async () => {
    const element = document.getElementById('matrix-table-container');
    if (!element) return;
    
    const originalStyle = element.getAttribute('style') || '';
    try {
      setIsGenerating(true);
      
      element.style.borderRadius = '0';
      element.style.boxShadow = 'none';
      element.style.overflow = 'visible';
      element.style.width = 'fit-content';
      element.style.maxWidth = 'none';
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const canvas = await domToCanvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        filter: (node) => {
          if (node instanceof HTMLElement && node.classList.contains('no-print')) {
            return false;
          }
          return true;
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`MaTran_HoaHoc_${matrixData?.grade}_${matrixData?.examType}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Có lỗi khi xuất PDF. Vui lòng sử dụng tính năng "IN" của trình duyệt.');
    } finally {
      setIsGenerating(false);
      if (element) {
        element.setAttribute('style', originalStyle);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col pb-16 font-sans">
      <header className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 shadow-2xl no-print">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/20">
              <Layout className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight italic">ChemMatrix <span className="text-amber-400">Pro</span></h1>
              <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-[0.2em] opacity-80"> Assessment Assessment Assessment Assessment Assessment Assessment Assessment Assessment </p>
            </div>
          </div>
          <div className="flex gap-2">
            {matrixData && (
              <button 
                onClick={() => setShowEditor(!showEditor)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-full font-bold border border-white/10 transition-all flex items-center gap-2 text-sm uppercase"
              >
                <Settings2 className="w-4 h-4" /> {showEditor ? 'Ẩn bảng điều khiển' : 'Điều chỉnh lại'}
              </button>
            )}
            <button 
              onClick={() => setShowSavedList(!showSavedList)}
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-full font-bold border border-white/20 transition-all flex items-center gap-2 text-sm uppercase"
            >
              <Save className="w-4 h-4" /> Đã lưu ({savedConfigs.length})
            </button>
            <button 
              onClick={handleCreateNew}
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-full font-bold border border-white/20 transition-all flex items-center gap-2 text-sm uppercase"
            >
              <Plus className="w-4 h-4" /> Reset
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-6 space-y-8">
        {/* Saved Configs List */}
        {showSavedList && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-slate-200 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Save className="w-6 h-6 text-indigo-600" /> Danh sách ma trận đã lưu
              </h3>
              <button 
                onClick={() => setShowSavedList(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest"
              >
                Đóng
              </button>
            </div>
            
            {savedConfigs.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-bold">Chưa có ma trận nào được lưu.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedConfigs.map(config => (
                  <div 
                    key={config.id}
                    onClick={() => handleLoadConfig(config)}
                    className="p-5 bg-white border-2 border-slate-100 rounded-2xl hover:border-indigo-600 hover:shadow-lg transition-all cursor-pointer group relative"
                  >
                    <button 
                      onClick={(e) => handleDeleteConfig(config.id, e)}
                      className="absolute top-3 right-3 p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <h4 className="font-black text-slate-800 mb-1 pr-8 truncate">{config.name}</h4>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-md uppercase">Lớp {config.grade}</span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-black rounded-md uppercase">{config.examType}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold">Lưu lúc: {new Date(config.timestamp).toLocaleString('vi-VN')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Editor Area */}
        {showEditor && (
          <div className="space-y-6 no-print animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Grade & Exam Type & Chapter Selection */}
            {currentStep === 1 && (
              <div className="bg-white rounded-3xl shadow-xl p-10 border border-slate-200 overflow-hidden">
                <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
                  <span className="bg-blue-600 text-white w-10 h-10 rounded-2xl flex items-center justify-center text-sm shadow-lg">1</span>
                  Phạm vi chương trình
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                  {[10, 11, 12].map((g) => (
                    <button
                      key={g}
                      onClick={() => handleGradeSelect(g as Grade)}
                      className={`p-8 rounded-3xl border-4 transition-all text-left group ${
                        activeGrade === g && !isCustomMode
                        ? 'border-blue-600 bg-blue-50/50 scale-[1.02]' 
                        : 'border-slate-50 bg-slate-50 hover:border-slate-200 hover:bg-white'
                      }`}
                    >
                      <span className={`text-5xl font-black mb-1 block tracking-tighter ${activeGrade === g && !isCustomMode ? 'text-blue-700' : 'text-slate-300'}`}>LỚP {g}</span>
                    </button>
                  ))}
                  <button
                    onClick={handleCustomModeSelect}
                    className={`p-8 rounded-3xl border-4 transition-all text-left group ${
                      isCustomMode 
                      ? 'border-amber-500 bg-amber-50/50 scale-[1.02]' 
                      : 'border-slate-50 bg-slate-50 hover:border-slate-200 hover:bg-white'
                    }`}
                  >
                    <span className={`text-5xl font-black mb-1 block tracking-tighter ${isCustomMode ? 'text-amber-700' : 'text-slate-300'}`}>TỰ DO</span>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${isCustomMode ? 'text-amber-600' : 'text-slate-400'}`}>Chủ đề tùy ý</p>
                  </button>
                </div>

                {activeGrade && activeGrade !== 'Tự do' && (
                  <div className="animate-in fade-in slide-in-from-top-4 space-y-8">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Chọn loại hình kiểm tra</p>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {Object.values(ExamType).map((type) => (
                          <button
                            key={type}
                            onClick={() => handleExamTypeSelect(type)}
                            className={`px-4 py-3 rounded-xl border-2 font-bold text-xs transition-all ${
                              examType === type
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg'
                              : 'bg-white text-slate-600 border-slate-100 hover:border-indigo-200'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Chọn các chương (Có thể chọn nhiều)</p>
                        <div className="flex gap-2">
                          <button 
                            onClick={handleSelectAllChapters}
                            className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-800 tracking-widest"
                          >
                            Chọn tất cả
                          </button>
                          <span className="text-slate-300">|</span>
                          <button 
                            onClick={handleDeselectAllChapters}
                            className="text-[10px] font-black uppercase text-slate-400 hover:text-red-500 tracking-widest"
                          >
                            Bỏ chọn
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {CURRICULUM[activeGrade as number].map((chapter) => {
                          const isSelected = selectedChapters.some(c => c.id === chapter.id);
                          return (
                            <button
                              key={chapter.id}
                              onClick={() => toggleChapter(chapter)}
                              className={`p-5 text-left rounded-2xl border-2 transition-all text-sm font-bold leading-snug flex items-center justify-between ${
                                isSelected
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-600 shadow-sm'
                                : 'bg-white text-slate-600 border-slate-100 hover:border-indigo-200'
                              }`}
                            >
                              <span>{chapter.name}</span>
                              {isSelected && <Check className="w-5 h-5 text-indigo-600" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {selectedChapters.length > 0 && (
                      <div className="flex flex-col md:flex-row justify-center items-center gap-4 pt-8">
                        <button 
                          onClick={() => { setCurrentStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-3"
                        >
                          Tiếp tục thiết lập chi tiết <ChevronRight className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={handleSaveConfig}
                          className="bg-white text-indigo-600 border-2 border-indigo-600 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-indigo-50 transition-all flex items-center gap-2"
                        >
                          <Save className="w-5 h-5" /> Lưu cấu hình
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {currentStep === 2 && selectedChapters.length > 0 && (
              <div className="bg-white rounded-3xl shadow-xl p-10 border border-slate-200 animate-in fade-in zoom-in-95">
                <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
                  <div className="flex flex-col gap-2 w-full">
                    <button 
                      onClick={() => { setCurrentStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold uppercase tracking-widest text-left flex items-center gap-1"
                    >
                      ← Quay lại chọn chương
                    </button>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
                      <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                        <span className="bg-indigo-600 text-white w-10 h-10 rounded-2xl flex items-center justify-center text-sm shadow-lg">2</span>
                        Thiết lập nội dung & Bối cảnh
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className={`px-4 py-2 rounded-2xl font-black text-xs uppercase flex items-center gap-2 border-2 ${totalPart2Selected === 4 ? 'bg-green-50 text-green-600 border-green-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                          <Target className="w-4 h-4" /> Bối cảnh Phần II: {totalPart2Selected}/4 mục
                        </div>
                        <button 
                          onClick={handleSaveConfig}
                          className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition-all shadow-lg"
                          title="Lưu ma trận"
                        >
                          <Save className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    {isCustomMode ? (
                      <div className="mt-4 p-6 bg-amber-50 rounded-3xl border-2 border-amber-200 shadow-inner">
                        <div className="flex items-center justify-between mb-4">
                          <label className="text-[10px] font-black uppercase text-amber-600 tracking-widest block">Tên chủ đề tùy ý</label>
                          <button 
                            onClick={() => setEditableLessons([])}
                            className="text-[10px] font-black uppercase text-red-500 hover:text-red-700 tracking-widest flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Xóa tất cả bài học
                          </button>
                        </div>
                        <input 
                          type="text"
                          value={customChapterName}
                          onChange={(e) => setCustomChapterName(e.target.value)}
                          className="w-full bg-white border-2 border-amber-200 rounded-2xl px-6 py-4 text-xl font-black text-slate-800 focus:ring-4 focus:ring-amber-500/20 outline-none transition-all"
                          placeholder="Nhập tên chủ đề (VD: Ôn tập chương I...)"
                        />
                        <p className="text-[10px] text-amber-500 mt-3 font-bold italic">* Bạn có thể tự do thêm các đơn vị kiến thức và mục chi tiết ở phía dưới.</p>
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-tight">
                        {examType} • {selectedChapters.length} Chương đã chọn
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-4">
                    {editableLessons.map((lesson, idx) => (
                      <div key={lesson.id} className="border-2 rounded-2xl overflow-hidden bg-slate-50/50 border-slate-100">
                        <div 
                          className="flex items-center justify-between p-5 bg-white cursor-pointer"
                          onClick={() => setExpandedLessonId(expandedLessonId === lesson.id ? null : lesson.id)}
                        >
                          <div className="flex items-center gap-4">
                            <span className="bg-slate-900 text-white w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-slate-800">{lesson.name}</span>
                          </div>
                          <ChevronDown className={`transition-transform ${expandedLessonId === lesson.id ? 'rotate-180' : ''}`} />
                        </div>

                        {expandedLessonId === lesson.id && (
                          <div className="p-6 bg-slate-50/50 border-t border-slate-100 space-y-4">
                            <div className="grid grid-cols-1 gap-2">
                              {(lesson.subItems || []).map((item, i) => {
                                const isHost = lesson.part2Hosts?.includes(item);
                                return (
                                  <div key={i} className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${isHost ? 'bg-green-50 border-green-400' : 'bg-white border-slate-200'}`}>
                                    <span className={`text-sm font-bold ${isHost ? 'text-green-800' : 'text-slate-600'}`}>Mục {i+1}: {item}</span>
                                    <div className="flex gap-2">
                                      <button 
                                        onClick={() => togglePart2Host(lesson.id, item)}
                                        className={`p-2 rounded-lg transition-colors ${isHost ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-green-100 hover:text-green-600'}`}
                                        title="Sử dụng làm bối cảnh Phần II (Đúng/Sai)"
                                      >
                                        <Target className="w-4 h-4" />
                                      </button>
                                      <button onClick={() => handleRemoveSubItem(lesson.id, i)} className="p-2 bg-slate-100 text-slate-300 hover:text-red-500 rounded-lg">
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="flex gap-2">
                              <input 
                                id={`input-${lesson.id}`}
                                type="text" 
                                placeholder="Nhập mục chi tiết (có thể cách nhau bằng dấu phẩy)..."
                                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleAddSubItem(lesson.id, (e.target as HTMLInputElement).value);
                                    (e.target as HTMLInputElement).value = '';
                                  }
                                }}
                              />
                              <button 
                                onClick={() => {
                                  const input = document.getElementById(`input-${lesson.id}`) as HTMLInputElement;
                                  handleAddSubItem(lesson.id, input.value);
                                  input.value = '';
                                }}
                                className="bg-slate-900 text-white px-4 rounded-xl font-bold hover:bg-black"
                              >
                                THÊM
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="flex gap-2 pt-2">
                      <input 
                        type="text"
                        value={newLessonName}
                        onChange={(e) => setNewLessonName(e.target.value)}
                        placeholder="Thêm đơn vị kiến thức mới..."
                        className="flex-1 p-4 border border-blue-100 rounded-2xl bg-blue-50/30 text-sm font-bold"
                      />
                      <button onClick={handleAddLesson} className="bg-blue-600 text-white px-6 rounded-2xl font-bold">MỚI</button>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-3xl p-6 border-2 border-slate-100 flex flex-col gap-4">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                      <MessageSquareQuote className="w-3 h-3 text-indigo-500" /> Yêu cầu đặc biệt (Linh hoạt)
                    </p>
                    <textarea 
                      value={extraRequirements}
                      onChange={(e) => setExtraRequirements(e.target.value)}
                      placeholder="VD: Tập trung vào bài tập nồng độ, giảm câu hỏi lý thuyết cấu tạo..."
                      className="w-full h-full min-h-[150px] p-4 rounded-2xl border border-slate-200 text-sm italic bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                      <p className="text-[10px] text-amber-800 leading-relaxed font-bold">
                        Hệ thống sẽ tái cấu trúc ma trận bám sát yêu cầu mới này mà không làm mất danh sách nội dung hiện tại.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center mt-8">
                  <button
                    disabled={totalPart2Selected !== 4 || isGenerating}
                    onClick={handleGenerate}
                    className={`w-full max-w-md py-5 rounded-3xl font-black text-xl shadow-2xl transition-all flex items-center justify-center gap-4 ${
                      totalPart2Selected !== 4 || isGenerating
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-slate-900 text-white hover:scale-[1.02] active:scale-95'
                    }`}
                  >
                    {isGenerating ? 'ĐANG TẠO...' : (matrixData ? 'CẬP NHẬT MA TRẬN' : 'XUẤT MA TRẬN HÓA HỌC')}
                    {isGenerating ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Matrix View Area */}
        {matrixData && (
          <div id="matrix-result-anchor" className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl no-print">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 text-green-600 p-4 rounded-2xl"><CheckCircle className="w-8 h-8" /></div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Ma trận sẵn sàng!</h3>
                  <p className="text-slate-500 text-sm">{matrixData.examType} • {matrixData.chapters.length} Chương • Tổng 40 lệnh</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 justify-center">
                {!showEditor && (
                   <button onClick={() => { setShowEditor(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-2xl font-black text-xs hover:bg-amber-600 shadow-lg">
                    <RefreshCw className="w-5 h-5" /> CHỈNH LẠI
                   </button>
                )}
                <button onClick={exportToExcel} className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs hover:bg-emerald-700 shadow-lg">
                  <FileSpreadsheet className="w-5 h-5" /> EXCEL
                </button>
                <button onClick={exportToImage} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs hover:bg-indigo-700 shadow-lg">
                  <ImageIcon className="w-5 h-5" /> ẢNH
                </button>
                <button onClick={exportToPDF} className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl font-black text-xs hover:bg-red-700 shadow-lg">
                  <FileText className="w-5 h-5" /> PDF
                </button>
                <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-2xl font-black text-xs hover:bg-black shadow-lg">
                  <Download className="w-5 h-5" /> IN
                </button>
              </div>
            </div>

            {/* Quick Adjust Input above Matrix */}
            {!showEditor && (
              <div className="bg-slate-800 p-6 rounded-3xl shadow-xl no-print border border-slate-700 flex flex-col md:flex-row items-end gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black uppercase text-indigo-300 tracking-widest flex items-center gap-2">
                    <MessageSquareQuote className="w-3 h-3" /> Chỉnh sửa yêu cầu nhanh
                  </label>
                  <input 
                    type="text"
                    value={extraRequirements}
                    onChange={(e) => setExtraRequirements(e.target.value)}
                    placeholder="Nhập yêu cầu điều chỉnh mới..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white italic focus:ring-2 focus:ring-indigo-500 outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  />
                </div>
                <button 
                  onClick={handleGenerate}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-black text-sm transition-all whitespace-nowrap flex items-center gap-2"
                >
                  {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  CẬP NHẬT LẠI
                </button>
              </div>
            )}

            <MatrixDisplay data={matrixData} />
          </div>
        )}
      </main>

      <footer className="bg-white border-t p-10 mt-auto no-print">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
          <p>© 2025 ChemMatrix Pro • Quy chuẩn GDPT 2018</p>
          <div className="flex gap-8">
            <span className="hover:text-blue-600 transition-colors">Chemistry Engine 3.2</span>
            <span className="hover:text-blue-600 transition-colors">Flexible Matrix System</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
