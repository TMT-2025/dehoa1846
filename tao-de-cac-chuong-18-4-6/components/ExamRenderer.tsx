
import React from 'react';
import { ExamData } from '../types';
import { FormulaRenderer } from '../../src/utils/formulaFormatter';

interface ExamRendererProps {
  data: ExamData;
  showAnswers?: boolean;
}

const ExamRenderer: React.FC<ExamRendererProps> = ({ data, showAnswers = false }) => {
  const formatFormula = (text: string) => {
    if (!text) return null;
    return <FormulaRenderer text={text} />;
  };

  const labelsPart1 = ["A", "B", "C", "D"];
  const labelsPart2 = ["a", "b", "c", "d"];

  return (
    <div className={`bg-white p-6 md:p-10 shadow-xl rounded-lg border border-slate-200 max-w-4xl mx-auto text-slate-800 leading-normal ${showAnswers ? 'bg-blue-50/20' : ''}`}>
      <h1 className="text-lg font-bold text-center mb-6 uppercase border-b pb-3">
        {data.title} {showAnswers && <span className="text-blue-600 block text-xs mt-1">HƯỚNG DẪN CHẤM & ĐÁP ÁN</span>}
      </h1>

      {/* Part 1 */}
      <section className="mb-8">
        <h2 className="font-bold text-sm mb-3">PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn.</h2>
        <div className="space-y-4">
          {data.part1.map((q, idx) => (
            <div key={idx} className="text-[13px]">
              <p className="font-medium mb-1"><span className="font-bold">Câu {idx + 1}.</span> {formatFormula(q.question)}</p>
              <div className="mt-1 flex flex-col gap-1">
                {q.options.map((opt, oIdx) => {
                  const isCorrect = showAnswers && oIdx === q.correctIndex;
                  const cleanOpt = opt.replace(/^[A-D][\.\)]\s*/i, '').replace(/^\.\s*/, '');
                  return (
                    <div key={oIdx} className={`pl-5 py-0.5 ${isCorrect ? 'italic underline font-medium text-blue-700' : ''}`}>
                      <span className="font-bold mr-1">{labelsPart1[oIdx]}.</span> {formatFormula(cleanOpt)}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Part 2 */}
      <section className="mb-8">
        <h2 className="font-bold text-sm mb-3">PHẦN II. Câu trắc nghiệm đúng sai.</h2>
        <div className="space-y-6">
          {data.part2.map((sc, idx) => (
            <div key={idx} className="text-[13px]">
              <div className="font-medium mb-2"><span className="font-bold">Câu {idx + 1}.</span> {formatFormula(sc.context)}</div>
              <div className="space-y-1">
                {sc.statements.map((st, sIdx) => {
                  const isTrueMark = showAnswers && st.isTrue;
                  const cleanText = st.text.replace(/^[a-d][\.\)]\s*/i, '').replace(/^\.\s*/, '');
                  return (
                    <div key={sIdx} className={`flex gap-2 pl-5 py-0.5 items-baseline ${isTrueMark ? 'italic underline font-medium text-blue-700' : ''}`}>
                      <span className="font-bold whitespace-nowrap">{labelsPart2[sIdx]})</span>
                      <p className="flex-1">
                        {formatFormula(cleanText)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Part 3 */}
      <section>
        <h2 className="font-bold text-sm mb-3">PHẦN III. Câu trắc nghiệm trả lời ngắn.</h2>
        <div className="space-y-5">
          {data.part3.map((q, idx) => (
            <div key={idx} className="text-[13px]">
              <div className="font-medium"><span className="font-bold">Câu {idx + 1}.</span> {formatFormula(q.question)}</div>
              <div className="mt-2 pl-5">
                {showAnswers ? (
                  <>
                    <div className="font-bold text-blue-700 italic border-l-4 border-blue-400 pl-3 py-1 bg-blue-50/50">
                      <span className="underline">A. {q.answer}</span>
                    </div>
                    {q.explanation && (
                      <div className="mt-2 text-[12px] text-slate-500 italic border-l-4 border-slate-200 pl-3 py-1">
                        <span className="font-bold">Hướng dẫn giải:</span> {formatFormula(q.explanation)}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2 py-1">
                    <span className="font-bold italic">A.</span>
                    <div className="w-full max-w-[150px] border-b-2 border-dotted border-slate-300 h-5"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ExamRenderer;
