
import React, { useState, useEffect, useRef } from 'react';
import { generateExam } from './services/geminiService';
import { downloadExamDoc } from './services/docxService';
import { ExamData, AppStatus, GradeLevel, MatrixRow } from './types';
import ExamRenderer from './components/ExamRenderer';
import MatrixRenderer from './components/MatrixRenderer';
import { 
  FileText, Download, RefreshCw, Beaker, 
  CheckCircle, AlertCircle, BookOpen, GraduationCap, 
  Settings2, LayoutDashboard, Globe, Library, PlusCircle,
  Info, Image as ImageIcon, X, ArrowRight
} from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [exam, setExam] = useState<ExamData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(1);
  
  const [savedMatrices, setSavedMatrices] = useState<Record<string, MatrixRow[]>>({});
  const [matrixImage, setMatrixImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [grade, setGrade] = useState<GradeLevel>('12');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [details, setDetails] = useState('');

  const gradeTopics = {
    '10': [
      'Chương 1: Cấu tạo nguyên tử',
      'Chương 2: Bảng tuần hoàn & định luật tuần hoàn',
      'Chương 3: Liên kết hóa học',
      'Chương 4: Phản ứng oxi hóa – khử',
      'Chương 5: Năng lượng hóa học',
      'Chương 6: Tốc độ phản ứng',
      'Chương 7: Nguyên tố nhóm halogen'
    ],
    '11': [
      'Chương 1: Cân bằng hóa học',
      'Chương 2: Nitrogen & Sulfur',
      'Chương 3: Đại cương Hóa học hữu cơ',
      'Chương 4: Hydrocarbon',
      'Chương 5: Dẫn xuất Halogen – Alcohol – Phenol',
      'Chương 6: Hợp chất Carbonyl – Carboxylic Acid'
    ],
    '12': [
      'Chương 1: Ester – Lipid',
      'Chương 2: Carbohydrate',
      'Chương 3: Hợp chất chứa nitơ',
      'Chương 4: Polymer',
      'Chương 5: Pin điện & điện phân',
      'Chương 6: Đại cương kim loại',
      'Chương 7: Nguyên tố nhóm IA & IIA',
      'Chương 8: Dãy kim loại chuyển tiếp và phức chất'
    ]
  };

  useEffect(() => {
    setSelectedTopics([]);
    setMatrixImage(null);
  }, [grade]);

  const toggleTopic = (t: string) => {
    setSelectedTopics(prev => 
      prev.includes(t) ? prev.filter(item => item !== t) : [...prev, t]
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setMatrixImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async (mode: 'new' | 'reuse' | 'image') => {
    if (selectedTopics.length === 0) {
      alert("Vui lòng chọn ít nhất một chương học!");
      return;
    }
    
    setStatus(AppStatus.GENERATING);
    setError(null);
    setAttempt(1);
    
    // In 'reuse' mode, we use the matrix stored for the first selected topic if only one is selected
    let matrixToUse = undefined;
    if (mode === 'reuse' && selectedTopics.length === 1) {
      matrixToUse = savedMatrices[selectedTopics[0]];
    }
    
    const maxRetries = 3;
    let currentAttempt = 1;

    while (currentAttempt <= maxRetries) {
      try {
        setAttempt(currentAttempt);
        const data = await generateExam(grade, selectedTopics, details, matrixToUse, mode === 'image' ? matrixImage || undefined : undefined);
        setExam(data);
        // Save the matrix of the generated exam if single topic
        if (selectedTopics.length === 1) {
          setSavedMatrices(prev => ({ ...prev, [selectedTopics[0]]: data.matrix }));
        }
        setStatus(AppStatus.COMPLETED);
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return; // Success, exit loop
      } catch (err: any) {
        console.error(`Attempt ${currentAttempt} failed:`, err);
        if (currentAttempt === maxRetries) {
          setError(err.message || 'Lỗi tạo đề thi sau nhiều lần thử.');
          setStatus(AppStatus.ERROR);
          return;
        }
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
        currentAttempt++;
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-indigo-900 text-white shadow-xl sticky top-0 z-50 border-b border-indigo-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500 rounded-xl shadow-inner"><Beaker className="w-6 h-6 text-white" /></div>
            <div>
              <h1 className="font-bold text-lg md:text-xl tracking-tight uppercase">Ra đề Hóa học 2025</h1>
              <p className="text-[10px] text-indigo-300 uppercase font-semibold">Tích hợp 3 bộ sách & Ma trận tùy biến</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {status === AppStatus.COMPLETED && (
              <button onClick={() => setStatus(AppStatus.IDLE)} className="p-2 hover:bg-indigo-800 rounded-lg transition-colors bg-white/10 flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                <RefreshCw className="w-4 h-4" /> Quay lại
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {status === AppStatus.IDLE && (
          <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['10', '11', '12'].map((g) => (
                <button key={g} onClick={() => setGrade(g as GradeLevel)} className={`p-8 rounded-3xl border-2 transition-all ${grade === g ? 'border-indigo-600 bg-indigo-600 text-white shadow-xl scale-105' : 'border-white bg-white text-slate-500 shadow-lg hover:border-indigo-200'}`}>
                  <GraduationCap className="w-10 h-10 mb-2 mx-auto" /><span className="font-black text-2xl">KHỐI {g}</span>
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2"><BookOpen className="text-indigo-600" /> Chọn chương học (có thể chọn nhiều)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {gradeTopics[grade].map((t) => (
                  <button key={t} onClick={() => toggleTopic(t)} className={`flex items-center p-4 rounded-xl border-2 transition-all text-left ${selectedTopics.includes(t) ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-slate-100 bg-white hover:border-indigo-200'}`}>
                    <div className="flex-grow font-semibold">{t}</div>
                    {savedMatrices[t] && <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full ml-2 font-bold uppercase">Ma trận hiện có</span>}
                    {selectedTopics.includes(t) && <CheckCircle className="w-5 h-5 text-indigo-600 ml-2" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">Yêu cầu nội dung chi tiết</label>
                  <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Nhập lưu ý (vd: tập trung vào các dạng bài điện phân nóng chảy, bài toán kim loại kiềm...)" rows={4} className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all resize-none shadow-inner bg-slate-50/50" />
                </div>
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wider"><ImageIcon className="w-4 h-4" /> Tải lên ma trận từ ảnh</label>
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative min-h-[160px]" onClick={() => fileInputRef.current?.click()}>
                    {matrixImage ? (
                      <div className="text-center">
                        <CheckCircle className="w-8 h-8 text-emerald-500 mb-2 mx-auto" />
                        <p className="text-xs font-bold text-emerald-600 uppercase">Đã tải ảnh ma trận</p>
                        <button onClick={(e) => { e.stopPropagation(); setMatrixImage(null); }} className="mt-2 text-[10px] text-red-500 underline flex items-center gap-1 mx-auto font-bold uppercase"><X className="w-3 h-3"/> Hủy ảnh</button>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-slate-300 mb-2" />
                        <p className="text-xs text-slate-400 font-medium text-center">Nhấp để tải lên ảnh ma trận đã tạo trước đó</p>
                      </>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-slate-50">
                <button onClick={() => handleGenerate('new')} disabled={selectedTopics.length === 0} className="py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm shadow-lg disabled:bg-slate-200 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"><RefreshCw className="w-4 h-4"/> Đề & Ma trận mới</button>
                <button onClick={() => handleGenerate('reuse')} disabled={selectedTopics.length !== 1 || !savedMatrices[selectedTopics[0]]} className="py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm shadow-lg disabled:bg-slate-100 disabled:text-slate-300 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"><PlusCircle className="w-4 h-4"/> Sử dụng ma trận cũ</button>
                <button onClick={() => handleGenerate('image')} disabled={selectedTopics.length === 0 || !matrixImage} className="py-4 bg-slate-800 hover:bg-black text-white rounded-2xl font-black text-sm shadow-lg disabled:bg-slate-100 disabled:text-slate-300 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"><ImageIcon className="w-4 h-4"/> Dùng ma trận từ ảnh</button>
              </div>
            </div>
          </div>
        )}

        {status === AppStatus.GENERATING && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in slide-in-from-bottom-10">
            <div className="relative mb-8">
              <div className="w-24 h-24 border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <Beaker className="w-8 h-8 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-wider uppercase">AI Đang Biên Soạn Đề...</h2>
            <div className="mt-4 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100">
                <RefreshCw className={`w-4 h-4 text-indigo-600 ${attempt > 1 ? 'animate-spin' : ''}`} />
                <span className="text-sm font-bold text-indigo-700 uppercase tracking-widest">Lần thử {attempt}/3</span>
              </div>
              <p className="text-slate-500 font-medium text-center max-w-md">
                {attempt === 1 ? 'Đang kết nối với AI để tạo nội dung...' : 'Đang thử lại để đảm bảo chất lượng đề thi tốt nhất...'}
              </p>
            </div>
            
            <button 
              onClick={() => window.location.reload()} 
              className="mt-10 text-xs font-bold text-slate-400 hover:text-red-500 uppercase tracking-widest flex items-center gap-2 transition-colors"
            >
              <X className="w-4 h-4" /> Hủy và quay lại
            </button>
          </div>
        )}

        {status === AppStatus.COMPLETED && exam && (
          <div className="space-y-10 animate-in slide-in-from-bottom-5 duration-700">
             <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-3xl shadow-lg border border-slate-100 gap-4 sticky top-[72px] z-40">
               <div>
                  <div className="text-[10px] text-indigo-500 font-black uppercase tracking-widest mb-1">Các chương đang ôn tập</div>
                  <div className="font-bold text-lg text-slate-800">{selectedTopics.join(', ')} - Khối {grade}</div>
               </div>
               <div className="flex flex-wrap justify-center gap-2">
                  <button onClick={() => handleGenerate('reuse')} className="bg-indigo-50 text-indigo-700 px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-indigo-100 transition-all border border-indigo-200 uppercase tracking-wider shadow-sm">
                    <ArrowRight className="w-4 h-4"/> Tạo đề tiếp theo
                  </button>
                  <button onClick={() => downloadExamDoc(exam, false)} className="bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-black transition-all shadow-md uppercase tracking-wider">
                    <Download className="w-4 h-4"/> Tải File Đề
                  </button>
                  <button onClick={() => downloadExamDoc(exam, true)} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-md uppercase tracking-wider">
                    <CheckCircle className="w-4 h-4"/> Tải Đáp Án
                  </button>
               </div>
             </div>
             
             <MatrixRenderer data={exam} />
             
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
               <div>
                 <div className="flex items-center gap-2 mb-4 px-2">
                   <FileText className="w-5 h-5 text-slate-400" />
                   <h3 className="font-black text-slate-400 uppercase text-xs tracking-widest">Xem trước Đề thi</h3>
                 </div>
                 <ExamRenderer data={exam} showAnswers={false} />
               </div>
               <div>
                 <div className="flex items-center gap-2 mb-4 px-2">
                   <CheckCircle className="w-5 h-5 text-emerald-500" />
                   <h3 className="font-black text-emerald-600 uppercase text-xs tracking-widest">Xem trước Đáp án</h3>
                 </div>
                 <ExamRenderer data={exam} showAnswers={true} />
               </div>
             </div>

             <div className="flex justify-center pt-10">
                <button onClick={() => setStatus(AppStatus.IDLE)} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-8 py-4 rounded-2xl font-black uppercase text-sm transition-all border border-slate-200 shadow-sm">
                  <RefreshCw className="w-4 h-4" /> Quay lại chọn chương khác
                </button>
             </div>
          </div>
        )}
        
        {status === AppStatus.ERROR && (
          <div className="max-w-xl mx-auto bg-white p-10 rounded-3xl shadow-xl border-t-4 border-red-500 text-center space-y-4 animate-in zoom-in duration-300">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h2 className="text-2xl font-black text-slate-900 uppercase">Đã có lỗi xảy ra!</h2>
            <p className="text-slate-500">{error || 'Không thể tạo đề thi ngay lúc này. Vui lòng thử lại.'}</p>
            <button onClick={() => setStatus(AppStatus.IDLE)} className="mt-6 px-8 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-black transition-all">THỬ LẠI</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
