import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { ApiKeyModal } from './components/ApiKeyModal';
import { MatrixCreator } from './components/matrix/MatrixCreator';
import { ExamCreator } from './components/exam/ExamCreator';
import { HistoryManager } from './components/storage/HistoryManager';
import { ExamData } from './types/exam';
import { MatrixData, SavedConfig } from './types/matrix';
import { BridgeResult, convertMatrixToExamInput } from './services/bridgeService';
import { ExamMixer } from './components/mixer/ExamMixer';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'exam' | 'history' | 'mixer'>('matrix');
  const [bridgeData, setBridgeData] = useState<BridgeResult | null>(null);
  const [transferExamData, setTransferExamData] = useState<ExamData | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [initialMatrix, setInitialMatrix] = useState<MatrixData | null>(null);
  const [loadedConfig, setLoadedConfig] = useState<SavedConfig | null>(null);

  const handleTransferToExam = (matrixData: MatrixData) => {
    const bridge = convertMatrixToExamInput(matrixData);
    setBridgeData(bridge);
    setActiveTab('exam');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTransferToMixer = (examData: ExamData) => {
    setTransferExamData(examData);
    setActiveTab('mixer');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoadMatrixToEditor = (config: SavedConfig) => {
    setLoadedConfig(config);
    if (config.generatedMatrix) {
      setInitialMatrix(config.generatedMatrix);
    }
    setActiveTab('matrix');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearBridge = () => {
    setBridgeData(null);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col font-sans">
      
      {/* Global Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        hasActiveMatrix={Boolean(bridgeData)}
      />

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8 flex-1 w-full">
        {activeTab === 'matrix' && (
          <div className="animate-fade-in">
            <MatrixCreator
              key={loadedConfig ? `edit_${loadedConfig.id}` : 'new_matrix'}
              onTransferToExam={handleTransferToExam}
              initialMatrixData={initialMatrix}
              loadedConfig={loadedConfig}
              onClearLoadedConfig={() => {
                setLoadedConfig(null);
                setInitialMatrix(null);
              }}
            />
          </div>
        )}

        {activeTab === 'exam' && (
          <div className="animate-fade-in">
            <ExamCreator
              bridgeData={bridgeData}
              onClearBridge={handleClearBridge}
              onSwitchToMatrixTab={() => setActiveTab('matrix')}
              onTransferToMixer={handleTransferToMixer}
            />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="animate-fade-in">
            <HistoryManager
              onLoadMatrixToEditor={handleLoadMatrixToEditor}
              onTransferMatrixToExam={handleTransferToExam}
              onTransferExamToMixer={handleTransferToMixer}
            />
          </div>
        )}

        {activeTab === 'mixer' && (
          <div className="animate-fade-in">
            <ExamMixer
              initialExamData={transferExamData}
              onClearInitialExam={() => setTransferExamData(null)}
              onSwitchToCreateTab={() => setActiveTab('exam')}
            />
          </div>
        )}
      </main>

      {/* Global Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 text-center text-xs border-t border-slate-800 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2025 ChemSuite Pro - Phần mềm hỗ trợ giáo viên Hóa học THPT Chương trình GDPT 2018</p>
          <p className="text-slate-500">Phát triển với Google Gemini AI & React Fullstack</p>
        </div>
      </footer>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeySaved={() => {}}
      />

    </div>
  );
};

export default App;
