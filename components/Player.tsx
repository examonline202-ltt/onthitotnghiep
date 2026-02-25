
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Trophy, AlertTriangle, CheckCircle, List, EyeOff, LogOut, User, Clock, AlertCircle, ChevronRight, Sparkles, Check, XCircle, Key, Loader2, ChevronLeft, HelpCircle, Maximize, Users, PlayCircle } from 'lucide-react';
import { Question, SubQuestion, User as UserType, Student, GradingConfig } from '../types';
import { MathRenderer, SmartTextRenderer, loadExternalLibs, shuffleArray } from '../utils/common';
import { callGeminiAPI } from '../services/geminiService';

const FLASHCARD_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');
@keyframes urgentPulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 rgba(239, 68, 68, 0.4);
  }
  50% {
    transform: scale(1.06);
    box-shadow: 0 0 25px rgba(239, 68, 68, 0.7);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 rgba(239, 68, 68, 0.4);
  }
}

.timer-urgent-box {
  animation: urgentPulse 0.9s infinite;
  border-color: #ef4444 !important;
  background: linear-gradient(135deg, #fee2e2, #fff1f2);
}

  * { font-family: 'Be Vietnam Pro', sans-serif; }
  body, .font-poppins { font-family: 'Be Vietnam Pro', sans-serif; }
  
  .quiz-background {
    background-color: #e0f7fa !important;
    background-image: 
      radial-gradient(at 0% 0%, rgba(255,255,255,0.8) 0px, transparent 50%),
      radial-gradient(at 90% 90%, rgba(175,238,238,0.5) 0px, transparent 60%) !important;
    background-attachment: fixed;
    min-height: 100vh;
    width: 100%;
    font-family: 'Be Vietnam Pro', sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  h2.question-text { 
    color: #008080; 
    margin: 0 0 20px 0; 
    font-size: 24px; 
    font-weight: 600;
    line-height: 1.5;
    text-align: justify;
  }

  .card-3d {
    background: #ffffff;
    border-radius: 20px;
    box-shadow: 
      0 1px 2px rgba(0,0,0,0.07), 
      0 2px 4px rgba(0,0,0,0.07), 
      0 4px 8px rgba(0,0,0,0.07), 
      0 8px 16px rgba(0,0,0,0.07),
      0 16px 32px rgba(0,0,0,0.07), 
      0 32px 64px rgba(0,0,0,0.07);
    border: 1px solid rgba(0,0,0,0.05);
    transition: transform 0.3s ease;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .card-3d:hover {
    transform: translateY(-5px);
  }

  .card-header {
    background: #f8fbfb;
    padding: 15px 24px;
    border-bottom: 2px solid #e0f2f1;
    font-weight: 700;
    color: #00695c;
    font-size: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .card-body {
    flex: 1;
    padding: 30px;
    color: #333;
    position: relative;
  }

  textarea.flashcard-input {
    width: 100%;
    min-height: 150px;
    border: none;
    border-top: 2px dashed #e0f2f1;
    padding: 20px 0;
    font-family: 'Be Vietnam Pro', sans-serif;
    font-size: 16px;
    resize: none;
    outline: none;
    box-sizing: border-box;
    background: transparent;
    color: #333;
    transition: all 0.3s ease;
  }

  textarea.flashcard-input:focus {
    background: #faffff;
  }
`;

const requestFullscreen = async () => {
    try {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            await elem.requestFullscreen();
        } else if ((elem as any).webkitRequestFullscreen) {
            await (elem as any).webkitRequestFullscreen();
        } else if ((elem as any).msRequestFullscreen) {
            await (elem as any).msRequestFullscreen();
        }
    } catch (err) {
        console.error("Error attempting to enable fullscreen:", err);
    }
};

export const ResultScreen = ({ score, total, violations, onRetry, questions = [], answers = {}, allowReview, counts }: any) => {
  const [activeHint, setActiveHint] = useState<{id: number, content: string} | null>(null);
  const [loadingHintId, setLoadingHintId] = useState<number | null>(null);

  const safeAnswers = answers || {};
  const safeQuestions = Array.isArray(questions) ? questions : [];

  const handleGetReviewHint = async (q: Question) => {
    if (loadingHintId === q.id || activeHint?.id === q.id) return;
    setLoadingHintId(q.id);
    
    const userAns = safeAnswers[q.id];
    let prompt = "";
    if (q.type === 'choice') {
        prompt = `Câu hỏi: "${q.question}". Đáp án đúng là "${q.answer}". Người học chọn "${userAns || 'không chọn'}". Hãy giải thích chi tiết tại sao đáp án "${q.answer}" là đúng và phân tích lỗi sai nếu có.`;
    } else if (q.type === 'group') {
        prompt = `Câu hỏi mệnh đề: "${q.question}". Hãy giải thích từng ý đúng/sai trong câu hỏi này một cách ngắn gọn, rõ ràng.`;
    } else {
        prompt = `Câu hỏi tự luận: "${q.question}". Đáp án gợi ý: "${q.answer}". Hãy giải thích chi tiết cách làm.`;
    }

    const res = await callGeminiAPI(prompt);
    setActiveHint({ id: q.id, content: res });
    setLoadingHintId(null);
  };

  return (
    <div className="quiz-background w-full p-6">
       <style>{FLASHCARD_STYLES}</style>
       <div className="w-full max-w-4xl bg-white p-8 rounded-[30px] shadow-2xl animate-fade-in border-t-8 border-teal-600">
          <div className="text-center mb-8">
              <div className="inline-block bg-yellow-50 p-4 rounded-full mb-4 shadow-sm border border-yellow-100">
                <Trophy className="w-16 h-16 text-yellow-600" />
              </div>
              <h2 className="text-6xl font-black text-teal-800 mb-2 tracking-tight">{typeof score === 'number' ? score.toFixed(2) : '0.00'} <span className="text-3xl text-gray-400 font-medium">/ 10</span></h2>
              <p className="text-gray-500 font-medium uppercase tracking-widest text-sm">Điểm số tổng kết</p>
              
              {violations > 0 ? (
                <div className="mt-6 inline-flex items-center bg-red-50 text-red-600 px-6 py-3 rounded-xl font-bold border border-red-100 animate-pulse">
                    <AlertTriangle className="w-5 h-5 mr-2"/> Phát hiện {violations} lần vi phạm quy chế
                </div>
              ) : (
                <div className="mt-6 inline-flex items-center bg-teal-50 text-teal-700 px-6 py-3 rounded-xl font-bold border border-teal-100">
                    <CheckCircle className="w-5 h-5 mr-2"/> Bài làm hợp lệ
                </div>
              )}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-10">
                <div className="bg-teal-50 p-4 rounded-2xl text-center border border-teal-100 shadow-sm">
                    <p className="text-3xl font-black text-teal-700 mb-1">{counts?.correct || 0}</p>
                    <p className="text-xs text-teal-600 uppercase font-bold tracking-wider">Câu Đúng</p>
                </div>
                <div className="bg-red-50 p-4 rounded-2xl text-center border border-red-100 shadow-sm">
                    <p className="text-3xl font-black text-red-600 mb-1">{counts?.wrong || 0}</p>
                    <p className="text-xs text-red-600 uppercase font-bold tracking-wider">Câu Sai</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl text-center border border-gray-200 shadow-sm">
                    <p className="text-3xl font-black text-gray-600 mb-1">{counts?.empty || 0}</p>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Chưa làm</p>
                </div>
          </div>

          <div className="border-t border-gray-100 pt-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <List className="w-6 h-6 text-teal-600"/> Chi tiết bài làm
                </h3>
                {!allowReview && (
                    <span className="text-xs font-bold bg-gray-100 text-gray-500 px-3 py-1 rounded-full flex items-center">
                      <EyeOff className="w-3 h-3 mr-1"/> Chế độ ẩn đáp án
                    </span>
                )}
              </div>

              {allowReview ? (
                <div className="space-y-6">
                    {safeQuestions.map((q: Question, idx: number) => {
                      if (!q) return null;
                      const userAns = safeAnswers[q.id];
                      return (
                          <div key={q.id} className="card-3d border-none shadow-md">
                             <div className="card-body p-6">
                                <div className="flex items-start gap-3 mb-3">
                                    <span className="bg-teal-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm mt-0.5">Câu {idx+1}</span>
                                    <div className="font-bold text-gray-800 flex-1 quiz-question-container">
                                      <MathRenderer text={q.question} allowMarkdown={true} />
                                      {q.image && (
                                        <div className="mt-4 max-w-lg">
                                          <img src={q.image} alt="Question" className="rounded-xl border shadow-sm max-h-[300px] object-contain" />
                                        </div>
                                      )}
                                    </div>
                                </div>

                                {q.type === 'choice' && (
                                    <div className="ml-10 space-y-2">
                                    {q.options?.map((opt, i) => {
                                        const isSelected = userAns === opt;
                                        const isAnswer = opt === q.answer;
                                        let style = "bg-white border-gray-200 text-gray-500";
                                        let icon = null;
                                        if (isSelected && isAnswer) { style = "bg-teal-50 border-teal-500 text-teal-800 font-bold ring-1 ring-teal-500"; icon = <CheckCircle className="w-5 h-5 text-teal-600 ml-auto"/>; }
                                        else if (isSelected && !isAnswer) { style = "bg-red-50 border-red-400 text-red-800 font-medium ring-1 ring-red-400"; icon = <XCircle className="w-5 h-5 text-red-500 ml-auto"/>; }
                                        else if (!isSelected && isAnswer) { style = "bg-blue-50 border-blue-300 text-blue-800 font-medium border-dashed"; icon = <span className="ml-auto text-xs font-bold bg-blue-200 text-blue-700 px-2 py-0.5 rounded">Đáp án đúng</span>; }
                                        return (
                                          <div key={i} className={`p-3 rounded-lg border flex flex-col gap-2 ${style}`}>
                                            <div className="flex items-center">
                                              <span className="w-6 font-bold">{String.fromCharCode(65+i)}.</span>
                                              <div className="flex-1 quiz-option-container"><MathRenderer text={opt} allowMarkdown={true} /></div>
                                              {icon}
                                            </div>
                                            {q.optionImages?.[i] && (
                                              <div className="ml-6 max-w-[200px]">
                                                <img src={q.optionImages[i]} alt="Option" className="rounded border max-h-[120px] object-contain" />
                                              </div>
                                            )}
                                          </div>
                                        );
                                    })}
                                    </div>
                                )}

                                {q.type === 'group' && (
                                    <div className="ml-0 md:ml-10 overflow-hidden rounded-xl border border-gray-300">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-100 text-gray-600 font-bold"><tr><th className="p-3">Nội dung ý</th><th className="p-3 text-center w-24">Bạn chọn</th><th className="p-3 text-center w-24">Đáp án</th></tr></thead>
                                        <tbody className="divide-y divide-gray-100 bg-white">
                                            {q.subQuestions?.map((sub, i) => {
                                                const userChoice = userAns?.[sub.id];
                                                const correctChoice = sub.correctAnswer;
                                                const renderBool = (val: any) => { if (val === true) return <span className="text-green-600 font-bold">Đúng</span>; if (val === false) return <span className="text-red-600 font-bold">Sai</span>; return <span className="text-gray-400 italic">--</span>; };
                                                return (<tr key={i} className="hover:bg-gray-50 transition-colors"><td className="p-3 font-medium text-gray-700 quiz-question-container"><MathRenderer text={sub.content} allowMarkdown={true} /></td><td className="p-3 text-center border-l border-gray-100">{renderBool(userChoice)}</td><td className="p-3 text-center border-l border-gray-100">{renderBool(correctChoice)}</td></tr>);
                                            })}
                                        </tbody>
                                    </table>
                                    </div>
                                )}
                                
                                {q.type === 'text' && (
                                    <div className="ml-10 mt-2">
                                        <div className="mb-2">
                                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Câu trả lời của bạn:</p>
                                            <div className="p-3 bg-white border border-gray-300 rounded-lg text-gray-800 font-medium min-h-[40px] font-mono text-sm">
                                            {typeof userAns === 'string' ? userAns : <span className="text-gray-400 italic">(Bỏ trống)</span>}
                                            </div>
                                        </div>
                                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200"><p className="text-xs font-bold text-yellow-700 uppercase mb-1 flex items-center"><Key className="w-3 h-3 mr-1"/> Đáp án gợi ý:</p><p className="text-yellow-900 text-sm">{q.answer}</p></div>
                                    </div>
                                )}

                                <div className="mt-4 flex flex-col items-start ml-10">
                                    <button onClick={() => handleGetReviewHint(q)} disabled={loadingHintId === q.id} className="text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-lg flex items-center transition-colors">
                                        {loadingHintId === q.id ? <Loader2 className="w-3 h-3 animate-spin mr-1"/> : <Sparkles className="w-3 h-3 mr-1"/>}
                                        {activeHint?.id === q.id ? 'Tắt gợi ý' : 'Giải thích chi tiết (AI)'}
                                    </button>
                                    {activeHint?.id === q.id && (
                                        <div className="mt-2 p-4 bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-xl text-sm w-full animate-fade-in shadow-sm">
                                            <div className="flex items-center gap-2 mb-2 font-bold text-purple-700 border-b border-purple-100 pb-2"><Sparkles className="w-4 h-4"/> Phân tích của AI:</div>
                                            <SmartTextRenderer text={activeHint.content} />
                                        </div>
                                    )}
                                </div>
                             </div>
                          </div>
                      );
                    })}
                </div>
              ) : (
                <div className="bg-gray-100 p-10 rounded-3xl text-center flex flex-col items-center justify-center text-gray-500">
                    <div className="bg-gray-200 p-4 rounded-full mb-4"><EyeOff className="w-8 h-8 text-gray-400"/></div>
                    <p className="font-bold text-lg">Chi tiết bài làm đã bị ẩn</p>
                    <p className="text-sm">Giáo viên không cho phép xem lại đáp án của đề thi này.</p>
                </div>
              )}
          </div>

          <div className="mt-10 flex justify-center w-full">
              <button type="button" onClick={onRetry} className="w-full py-4 bg-[#00897B] text-white rounded-xl font-bold shadow-lg uppercase flex items-center justify-center gap-2 hover:bg-[#00796B] transition-all transform hover:-translate-y-1">
                <LogOut className="w-5 h-5"/> Thoát
              </button>
          </div>
       </div>
    </div>
  );
};

export const StartScreen = ({ exam, onStart, initialCode, initialName, initialClass, user, studentsList = [] }: any) => {
   const [name, setName] = useState(initialName || '');
   const [code, setCode] = useState(initialCode || '');
   const [inputClass, setInputClass] = useState(initialClass || '');
   const [error, setError] = useState('');
   
   useEffect(() => {
       if (user) {
           if (user.email && studentsList.length > 0) {
               const matchedStudent = studentsList.find((s: Student) => 
                   s.email && s.email.trim().toLowerCase() === user.email.trim().toLowerCase()
               );
               if (matchedStudent) {
                   setName(matchedStudent.name);
                   setInputClass(matchedStudent.className);
               } else {
                   setName(user.name);
                   setInputClass(user.className || (user.role !== 'student' ? 'Giáo viên' : ''));
               }
           } else {
               setName(user.name);
               setInputClass(user.className || (user.role !== 'student' ? 'Giáo viên' : ''));
           }
           
           // Tự động điền mã bảo mật cho giáo viên/admin
           if (user.role !== 'student') {
               setCode(exam.securityCode);
           }
       } else {
           if (initialName) setName(initialName);
           if (initialClass) setInputClass(initialClass);
       }
   }, [user, studentsList, initialName, initialClass, exam.securityCode]);
   
   useEffect(() => { if(initialCode) setCode(initialCode); }, [initialCode]);

   const handleLogin = async () => { 
      // Bỏ qua kiểm tra mã bảo mật nếu là giáo viên/admin
      if (user && user.role !== 'student') {
          // Bỏ qua
      } else if (code.toUpperCase() !== exam.securityCode) { 
          setError('Mã bảo mật sai!'); 
          return; 
      } 
      
      if ((!user || user.role === 'student') && exam.maxAttempts && exam.maxAttempts > 0) {
          const prevAttempts = (exam.results || []).filter((r: any) => 
              r.name.trim().toLowerCase() === name.trim().toLowerCase() && 
              r.className.trim().toLowerCase() === inputClass.trim().toLowerCase()
          ).length;
          if (prevAttempts >= exam.maxAttempts) {
              setError(`Bạn đã làm bài ${prevAttempts}/${exam.maxAttempts} lần. Không thể làm tiếp.`);
              return;
          }
      }
      
      await requestFullscreen();
      onStart(name, inputClass); 
   };

   const isFormFilled = (user && user.role !== 'student') ? (name && inputClass) : (name && code && inputClass);
   
   return (
      <div className="quiz-background w-full p-4 justify-center items-center flex min-h-screen font-poppins">
         <div className="bg-white w-full max-w-[380px] rounded-[30px] shadow-2xl overflow-hidden relative border border-gray-100">
             <div className="p-6 relative">
                 <div className="absolute top-0 left-0 w-1.5 h-full bg-[#00897B]"></div>
                 
                 <div className="inline-block bg-teal-50 text-teal-700 text-xs font-black px-3 py-1 rounded-full border border-teal-100 mb-3 shadow-sm">
                     {exam.className || "KHÁC"}
                 </div>
                 <h2 className="text-3xl font-black text-gray-800 mb-1 tracking-tight leading-tight">
                     {exam.title}
                 </h2>
                 <p className="text-xs text-gray-400 font-mono mb-6">{exam.createdAt || new Date().toLocaleString()}</p>
                 <div className="space-y-3">
                     <div className="flex items-center gap-3 text-gray-600">
                         <List className="w-5 h-5 text-teal-500" />
                         <span className="font-bold text-sm text-gray-700">{exam.questions?.length || 0}</span> <span className="text-sm">câu hỏi</span>
                     </div>
                     <div className="flex items-center gap-3 text-gray-600">
                         <Clock className="w-5 h-5 text-teal-500" />
                         <span className="font-bold text-sm text-gray-700">{exam.duration}</span> <span className="text-sm">phút</span>
                     </div>
                     <div className="flex items-center gap-3 text-gray-600">
                         <AlertTriangle className="w-5 h-5 text-teal-500" />
                         <span className="font-bold text-sm text-gray-700">{exam.maxViolations || 1}</span> <span className="text-sm">cảnh báo tối đa</span>
                     </div>
                 </div>
             </div>

             <div className="bg-gray-50 p-6 border-t border-gray-100">
                {error && (
                    <div className="w-full bg-red-50 text-red-600 text-xs p-3 rounded-xl mb-4 font-bold flex items-center gap-2 animate-pulse border border-red-100">
                        <AlertCircle className="w-4 h-4" /> {error}
                    </div>
                )}
                <div className="space-y-3">
                     <input type="text" className={`w-full p-3 bg-white border border-gray-200 rounded-xl outline-none text-sm font-bold text-gray-700 focus:border-teal-500 focus:ring-2 ring-teal-100 transition-all ${user ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`} placeholder="Họ và tên học sinh" value={name} onChange={e => !user && setName(e.target.value)} readOnly={!!user} />
                    <div className={(user && user.role !== 'student') ? '' : 'grid grid-cols-2 gap-3'}>
                         <input type="text" className={`w-full p-3 bg-white border border-gray-200 rounded-xl outline-none font-bold text-gray-700 focus:border-teal-500 focus:ring-2 ring-teal-100 transition-all ${user ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`} placeholder="Lớp" value={inputClass} onChange={e => !user && setInputClass(e.target.value)} readOnly={!!user} />
                         {(!user || user.role === 'student') && (
                             <input type="text" className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none text-sm font-black text-gray-700 text-center tracking-widest uppercase focus:border-teal-500 focus:ring-2 ring-teal-100 transition-all" placeholder="MÃ ĐỀ" value={code} onChange={e => setCode(e.target.value)} maxLength={6} />
                         )}
                    </div>
                </div>
                <button onClick={handleLogin} disabled={!isFormFilled} className={`w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-wide mt-6 transition-all shadow-lg flex items-center justify-center gap-2 ${isFormFilled ? 'bg-[#00897B] text-white hover:bg-[#00796B] transform hover:-translate-y-0.5' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                   <PlayCircle className="w-5 h-5" /> VÀO THI NGAY
               </button>
             </div>
         </div>
      </div>
   );
};

export const QuizScreen = ({ questions = [], duration, allowHints, onFinish, studentName, className, examId, maxViolations = 1, gradingConfig, onCancel }: { 
    questions: Question[], 
    duration: number, 
    allowHints?: boolean, 
    onFinish: any, 
    studentName: string, 
    className: string, 
    examId: string, 
    maxViolations?: number,
    gradingConfig?: GradingConfig,
    onCancel?: () => void
}) => {
  const [orderedQuestions, setOrderedQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [timeLeft, setTimeLeft] = useState(duration * 60); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [violations, setViolations] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [unansweredCount, setUnansweredCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const BACKUP_KEY = `quiz_backup_${examId}_${encodeURIComponent(studentName || '')}_${encodeURIComponent(className || '')}`;

  useEffect(() => {
    loadExternalLibs();
    
    const savedData = localStorage.getItem(BACKUP_KEY);
    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            if (parsed.orderedQuestions && parsed.orderedQuestions.length > 0) {
                setOrderedQuestions(parsed.orderedQuestions);
                setAnswers(parsed.answers || {});
                setTimeLeft(parsed.timeLeft || duration * 60);
                setViolations(parsed.violations || 0);
                setCurrentIdx(parsed.currentIdx || 0);
                setIsInitialized(true);
                return;
            }
        } catch (e) {
            console.error("Session restore error:", e);
        }
    }

    // --- LOGIC XÁO TRỘN VÀ PHÂN NHÓM ---
    const choiceQs = questions.filter((q: Question) => q.type === 'choice');
    const groupQs = questions.filter((q: Question) => q.type === 'group');
    const textQs = questions.filter((q: Question) => q.type === 'text');

    const shuffledChoice = shuffleArray(choiceQs).map(q => {
        if (q.mixOptions && q.options && q.options.length > 0) {
            const originalOptions = [...q.options];
            const originalImages = q.optionImages ? [...q.optionImages] : [];
            const indices = originalOptions.map((_, i) => i);
            const shuffledIndices = shuffleArray(indices);
            const newOptions = shuffledIndices.map(i => originalOptions[i]);
            const newImages = originalImages.length > 0 ? shuffledIndices.map(i => originalImages[i]) : undefined;
            return { ...q, options: newOptions, optionImages: newImages };
        }
        return q;
    });
    
    const shuffledGroup = shuffleArray(groupQs);
    const shuffledText = shuffleArray(textQs);

    const finalOrder = [...shuffledChoice, ...shuffledGroup, ...shuffledText];
    
    setOrderedQuestions(finalOrder);
    setIsInitialized(true);
  }, [questions, duration, BACKUP_KEY]);

  useEffect(() => {
    if (isInitialized && !isSubmitting && timeLeft > 0) {
        localStorage.setItem(BACKUP_KEY, JSON.stringify({ 
            orderedQuestions,
            answers, 
            timeLeft, 
            violations, 
            currentIdx, 
            timestamp: Date.now() 
        }));
    }
  }, [orderedQuestions, answers, timeLeft, violations, currentIdx, isSubmitting, isInitialized, BACKUP_KEY]);

  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', prevent);
    document.addEventListener('copy', prevent);
    document.addEventListener('paste', prevent);

    const handleViolation = () => {
        if (!isSubmitting && isInitialized) {
            const newViolations = violations + 1;
            setViolations(newViolations);
            if (maxViolations > 0 && newViolations >= maxViolations) {
                 alert(`Bạn đã vi phạm quá ${maxViolations} lần cho phép. Hệ thống tự động nộp bài!`);
                 doSubmit();
            } else { setShowWarning(true); }
        }
    };
    const handleVisibility = () => { if (document.hidden) handleViolation(); };
    const handleFullscreenChange = () => {
        if (!document.fullscreenElement) {
            setIsFullscreen(false);
            if (!isSubmitting) handleViolation();
        } else { setIsFullscreen(true); }
    };
    const handleWindowBlur = () => handleViolation();
    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('blur', handleWindowBlur);
    if (!document.fullscreenElement) setIsFullscreen(false);

    return () => {
        document.removeEventListener('contextmenu', prevent);
        document.removeEventListener('copy', prevent);
        document.removeEventListener('paste', prevent);
        document.removeEventListener('visibilitychange', handleVisibility);
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isSubmitting, violations, maxViolations, isInitialized]);

  useEffect(() => {
    const timer = setInterval(() => {
        setTimeLeft((prev) => prev <= 0 ? 0 : prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { if (timeLeft === 0 && !isSubmitting && isInitialized) doSubmit(); }, [timeLeft, isSubmitting, isInitialized]);

  const currentQ = orderedQuestions[currentIdx];

  const handleChoice = (val: string) => setAnswers({...answers, [currentQ.id]: val});
  const handleGroupChoice = (subId: string, val: boolean) => {
     const prevGroup = answers[currentQ.id] || {};
     setAnswers({...answers, [currentQ.id]: { ...prevGroup, [subId]: val }});
  };

  const isQuestionDone = (q: Question) => {
    if (q.type === 'group') {
        const userAns = answers[q.id] || {};
        return Object.keys(userAns).length === (q.subQuestions?.length || 0);
    }
    if (q.type === 'text') return !!answers[q.id]?.trim();
    return !!answers[q.id];
  };

  const progressInfo = useMemo(() => {
    const doneCount = orderedQuestions.filter(isQuestionDone).length;
    const percent = Math.round((doneCount / orderedQuestions.length) * 100);
    
    let colorClass = "bg-red-500";
    if (percent > 80) colorClass = "bg-emerald-500";
    else if (percent > 60) colorClass = "bg-blue-500";
    else if (percent > 40) colorClass = "bg-amber-500";
    else if (percent > 20) colorClass = "bg-orange-500";
    
    return { doneCount, percent, colorClass };
  }, [orderedQuestions, answers]);

  const checkSubmit = () => {
     let unanswered = 0;
     orderedQuestions.forEach((q: any) => {
         if (!isQuestionDone(q)) unanswered++;
     });
     setUnansweredCount(unanswered);
     setShowConfirm(true); 
  };

  const doSubmit = () => {
     setIsSubmitting(true);
     localStorage.removeItem(BACKUP_KEY);
     const config = gradingConfig || { part1Total: 6, part2Total: 4, part3Total: 0, part4Total: 0, groupGradingMethod: 'progressive' };
     const part1Qs = orderedQuestions.filter(q => q.type === 'choice');
     const part2Qs = orderedQuestions.filter(q => q.type === 'group');
     const part3Qs = orderedQuestions.filter(q => q.type === 'text');
     let correctCount = 0, wrongCount = 0;
     let totalScore = 0;
     if (part1Qs.length > 0) {
         const pointsPerQ = config.part1Total / part1Qs.length;
         part1Qs.forEach(q => {
             const userAns = answers[q.id];
             if (userAns) {
                if (userAns === q.answer) { correctCount++; totalScore += pointsPerQ; } else { wrongCount++; }
             }
         });
     }
     if (part2Qs.length > 0) {
         const pointsPerGroupQ = config.part2Total / part2Qs.length;
         part2Qs.forEach(q => {
             const userAns = answers[q.id] || {};
             const subQs = q.subQuestions || [];
             if (subQs.length === 0) return;
             let correctInQ = 0;
             const answeredCountInQ = Object.keys(userAns).length;
             subQs.forEach(sub => { if (userAns[sub.id] === sub.correctAnswer) { correctInQ++; } });
             if (answeredCountInQ > 0) {
                 if (correctInQ === subQs.length) { correctCount++; } else { wrongCount++; }
                 if (config.groupGradingMethod === 'progressive') {
                     const multipliers: Record<number, number> = { 1: 0.1, 2: 0.25, 3: 0.5, 4: 1.0 };
                     const multiplier = multipliers[correctInQ] || 0;
                     totalScore += pointsPerGroupQ * multiplier;
                 } else { totalScore += pointsPerGroupQ * (correctInQ / subQs.length); }
             }
         });
     }
     if (part3Qs.length > 0) {
         const pointsPerQ = config.part3Total / part3Qs.length;
         part3Qs.forEach(q => {
             const userAnsRaw = answers[q.id];
             const userAns = typeof userAnsRaw === 'string' ? userAnsRaw.trim().toLowerCase() : "";
             if (userAns) {
                 const correctAns = (q.answer || "").trim().toLowerCase();
                 if (userAns === correctAns) { correctCount++; totalScore += pointsPerQ; } else { wrongCount++; }
             }
         });
     }
     const emptyCount = orderedQuestions.length - correctCount - wrongCount;
     const finalScore = Math.round(totalScore * 100) / 100;
     setTimeout(() => {
         onFinish(answers, duration * 60 - timeLeft, violations, { correct: correctCount, wrong: wrongCount, empty: emptyCount }, finalScore);
     }, 800);
  };
  
  const handleReturnToExam = async () => {
      await requestFullscreen();
      setShowWarning(false);
  };

  if (!isInitialized || !currentQ) return <div className="min-h-screen flex items-center justify-center text-teal-600 font-bold quiz-background">Đang thiết lập đề thi...</div>;
  if (isSubmitting) return <div className="min-h-screen w-full flex flex-col items-center justify-center quiz-background"><style>{FLASHCARD_STYLES}</style><div className="card-3d p-10 flex flex-col items-center h-auto"><Loader2 className="w-12 h-12 animate-spin text-teal-600 mb-4"/><p className="font-bold text-gray-600">Hệ thống đang lưu bài làm...</p></div></div>;

  return (
    <div className="quiz-background w-full p-6 pt-10 relative">
       <style>{FLASHCARD_STYLES}</style>
       {!isFullscreen && !showWarning && !isSubmitting && (
         <div className="fixed inset-0 bg-teal-900/95 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md text-center shadow-2xl border-4 border-teal-500">
                <div className="bg-teal-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"><Maximize className="w-10 h-10 text-teal-600" /></div>
                <h2 className="text-2xl font-black text-teal-800 mb-4 uppercase">Toàn màn hình</h2>
                <p className="text-gray-600 mb-8 font-medium">Bắt buộc làm bài ở chế độ toàn màn hình để đảm bảo công bằng.</p>
                <button onClick={handleReturnToExam} className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg uppercase">Bật và Tiếp tục</button>
            </div>
         </div>
       )}
       
       {showWarning && (
        <div className="fixed inset-0 bg-red-900/95 z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl p-8 max-w-md text-center shadow-2xl">
              <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle className="w-10 h-10 text-red-600" /></div>
              <h2 className="text-2xl font-black text-red-600 mb-2 uppercase">Cảnh báo vi phạm!</h2>
              <p className="text-gray-700 mb-4 font-medium">Bạn đã thoát toàn màn hình hoặc chuyển tab.</p>
              <div className="bg-gray-100 p-3 rounded-xl mb-6 flex justify-around">
                  <div><p className="text-xs font-bold text-gray-500 uppercase">Vi phạm</p><p className="text-4xl font-black text-red-600">{violations}</p></div>
                  <div><p className="text-xs font-bold text-gray-500 uppercase">Tối đa</p><p className="text-4xl font-black text-gray-400">{maxViolations}</p></div>
              </div>
              <button onClick={handleReturnToExam} className="w-full py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg uppercase">Quay lại bài thi</button>
           </div>
        </div>
       )}

       {showConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-[520px] rounded-[16px] shadow-2xl overflow-hidden animate-fade-in font-poppins">
              <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-2 bg-[#fcfcfc]">
                  <CheckCircle className="w-4 h-4 text-[#00897B]"/>
                  <span className="text-[12px] font-black text-[#00897B] uppercase tracking-wider">Xác nhận nộp bài</span>
              </div>
              <div className="px-8 py-10 text-center">
                  <h3 className="text-xl font-black text-slate-800 mb-2">Bạn đã làm xong chưa?</h3>
                  <div className="mb-8">
                    {unansweredCount > 0 ? (
                        <p className="text-slate-500 font-bold text-sm">
                          Còn <span className="text-red-500 font-black text-base mx-0.5">{unansweredCount}</span> câu chưa làm.
                        </p>
                    ) : (
                        <p className="text-emerald-600 font-bold text-sm flex items-center justify-center gap-1">
                          <Check className="w-4 h-4"/> Bạn đã hoàn thành tất cả câu hỏi.
                        </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <button 
                        onClick={doSubmit} 
                        className="w-full py-3.5 bg-[#00897B] hover:bg-[#00796B] text-white font-black rounded-xl shadow-md transition-all uppercase tracking-widest text-xs"
                    >
                        Nộp bài ngay
                    </button>
                    <button 
                        onClick={() => setShowConfirm(false)} 
                        className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-slate-600 font-black rounded-xl transition-all uppercase tracking-widest text-xs border border-gray-200"
                    >
                        Kiểm tra lại
                    </button>
                    {onCancel && (
                        <button 
                            onClick={onCancel} 
                            className="w-full mt-2 text-red-500 text-[10px] font-black uppercase tracking-widest hover:underline"
                        >
                            Hủy bài thi
                        </button>
                    )}
                  </div>
              </div>
           </div>
        </div>
       )}

       <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-start">
          <div className="lg:col-span-9 flex flex-col">
             <div className="flex flex-col mb-6 gap-3">
                 <div className="flex justify-between items-center">
                    <h2 className="text-3xl text-teal-700 uppercase tracking-wide font-bold">{currentQ.section || 'BÀI THI'}</h2>
                    <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-xs font-bold border border-teal-200">{currentIdx + 1} / {orderedQuestions.length}</span>
                 </div>
                 
                 {/* Thanh tiến độ nằm ngang bên dưới tiêu đề */}
                 <div className="w-full space-y-1">
                    <div className="flex justify-between items-end px-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tiến độ hoàn thành</span>
                        <span className="text-[11px] font-black text-red-500">{progressInfo.percent}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden shadow-inner border border-gray-100">
                        <div 
                           className={`h-full transition-all duration-700 ease-in-out ${progressInfo.colorClass}`} 
                           style={{ width: `${progressInfo.percent}%` }} 
                        />
                    </div>
                 </div>
             </div>

             <div className="card-3d h-full min-h-[500px] border-none shadow-xl">
                <div className="card-body flex flex-col p-8">
                   <div className="flex items-start gap-4 mb-6">
                      <div className="bg-[#00897B] text-white font-bold text-base px-3 py-1.5 rounded-lg shadow-md whitespace-nowrap min-w-[80px] text-center">Câu {currentIdx + 1}:</div>
                      <div className="question-text flex-1 text-lg text-[#004D40] quiz-question-container">
                        <MathRenderer text={currentQ.question} allowMarkdown={true} />
                        {currentQ.image && (
                          <div className="mt-4">
                            <img src={currentQ.image} alt="Question Attachment" className="max-h-[350px] rounded-2xl border shadow-sm object-contain" />
                          </div>
                        )}
                      </div>
                   </div>
                   <div className="flex-grow pl-2 overflow-y-auto">
                      {currentQ.type === 'choice' && (
                         <div className="space-y-4">
                            {currentQ.options?.map((opt: string, i: number) => (
                               <label key={i} className={`flex flex-col p-4 border-2 rounded-2xl cursor-pointer transition-all group ${answers[currentQ.id] === opt ? 'border-teal-500 bg-teal-50/50' : 'border-gray-100 hover:border-teal-200 hover:bg-gray-50'}`}>
                                  <div className="flex items-center">
                                    <input type="radio" className="hidden" checked={answers[currentQ.id] === opt} onChange={() => handleChoice(opt)} />
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-4 ${answers[currentQ.id] === opt ? 'border-teal-600 bg-teal-600' : 'border-gray-300'}`}>{answers[currentQ.id] === opt && <Check className="w-5 h-5 text-white" />}</div>
                                    <span className="font-bold text-gray-400 w-8 text-lg">{String.fromCharCode(65+i)}.</span>
                                    <div className={`text-lg flex-1 quiz-option-container ${answers[currentQ.id] === opt ? 'text-teal-900 font-medium' : 'text-gray-600'}`}><MathRenderer text={opt} allowMarkdown={true} /></div>
                                  </div>
                                  {currentQ.optionImages?.[i] && (
                                    <div className="ml-12 mt-3 max-w-[250px]">
                                      <img src={currentQ.optionImages[i]} alt="Option Attachment" className="rounded-lg border shadow-sm max-h-[150px] object-contain" />
                                    </div>
                                  )}
                               </label>
                            ))}
                         </div>
                      )}
                      {currentQ.type === 'group' && (
                         <div className="border border-gray-200 rounded-2xl overflow-hidden">
                            <div className="bg-gray-50 p-4 flex items-center font-bold text-gray-500 text-xs uppercase tracking-wider gap-4">
                               <div className="flex-1">Nội dung mệnh đề</div><div className="w-14 text-center">Đúng</div><div className="w-14 text-center">Sai</div>
                            </div>
                            <div className="divide-y divide-gray-100">
                               {currentQ.subQuestions?.map((sub: SubQuestion, i: number) => {
                                  const userChoice = answers[currentQ.id]?.[sub.id];
                                  return (
                                    <div key={i} className="flex items-center p-4 hover:bg-teal-50/30 transition-colors gap-4">
                                       <div className="flex-1 text-gray-800 font-medium quiz-question-container"><span className="font-bold mr-2 text-gray-400">{String.fromCharCode(97+i)})</span> <MathRenderer text={sub.content} allowMarkdown={true} /></div>
                                       <div className="w-14 text-center"><input type="radio" name={`sub_${sub.id}`} className="w-6 h-6 accent-green-600" checked={userChoice === true} onChange={() => handleGroupChoice(sub.id, true)} /></div>
                                       <div className="w-14 text-center"><input type="radio" name={`sub_${sub.id}`} className="w-6 h-6 accent-red-600" checked={userChoice === false} onChange={() => handleGroupChoice(sub.id, false)} /></div>
                                    </div>
                                  );
                               })}
                            </div>
                         </div>
                      )}
                      {currentQ.type === 'text' && <textarea className="flashcard-input" placeholder="Nhập câu trả lời..." value={answers[currentQ.id] || ''} onChange={e => handleChoice(e.target.value)} />}
                   </div>
                   <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
                      <button onClick={() => setCurrentIdx(p => Math.max(0, p-1))} disabled={currentIdx===0} className="px-5 py-3 bg-gray-100 rounded-xl font-bold text-gray-600 disabled:opacity-50 hover:bg-gray-200 flex items-center"><ChevronLeft className="w-5 h-5 mr-1"/> Trước</button>
                      <button onClick={() => setCurrentIdx(p => Math.min(orderedQuestions.length-1, p+1))} disabled={currentIdx===orderedQuestions.length-1} className="px-8 py-3 bg-[#00897B] text-white rounded-xl font-bold disabled:opacity-50 hover:bg-[#00796B] shadow-lg flex items-center">Tiếp theo <ChevronRight className="w-5 h-5 ml-1"/></button>
                   </div>
                </div>
             </div>
          </div>
          <div className="lg:col-span-3 flex flex-col gap-6">
             <div className="card-3d h-auto">
                <div className="card-header text-[#00695C] bg-white justify-center border-b border-gray-100 py-4"><span className="flex items-center gap-2 text-xs font-bold uppercase"><User className="w-3.5 h-3.5"/> THÍ SINH</span></div>
                <div className="card-body p-5 space-y-4">
                    <div className="flex justify-between items-center gap-4 border-b border-gray-50 pb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase whitespace-nowrap">Họ và Tên</span>
                        <span className="text-sm font-black text-slate-800 text-right truncate">{studentName}</span>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                        <span className="text-[10px] font-bold text-gray-400 uppercase whitespace-nowrap">Lớp</span>
                        <div className="px-3 py-1 bg-teal-50 rounded-lg border border-teal-100">
                            <span className="text-sm font-black text-teal-600">{className}</span>
                        </div>
                    </div>
                </div>
             </div>
            <div className={`card-3d h-auto transition-all duration-300 ${timeLeft < 60 ? 'timer-urgent-box' : ''}`}>
              <div className="card-header text-[#00695C] bg-white justify-center border-b border-gray-100 py-4">
                <span className="flex items-center gap-2 text-xs font-bold uppercase">
                  <Clock className="w-3.5 h-3.5" /> CÒN LẠI
                </span>
              </div>
              <div className="card-body p-6 text-center">
                <div className={`text-4xl font-mono font-black transition-all ${timeLeft < 60 ? 'text-red-600 animate-pulse' : 'text-[#00897B]'}`}>
                  {Math.floor(timeLeft / 60)} : {String(timeLeft % 60).padStart(2, '0')}
                </div>
                <div className="mt-2 text-[11px] font-black uppercase tracking-widest text-red-500 flex items-center justify-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Vi phạm: {violations} / {maxViolations}
                </div>
              </div>
            </div>
             <div className="card-3d flex-1 min-h-[200px]">
                <div className="card-header text-[#00695C] bg-white justify-center border-b border-gray-100 py-4"><span className="text-xs font-bold uppercase">DANH SÁCH CÂU</span></div>
                <div className="card-body p-4 overflow-y-auto">
                    <div className="grid grid-cols-5 gap-2">
                        {orderedQuestions.map((q: Question, i: number) => {
                            const isDone = isQuestionDone(q);
                            const isCurrent = currentIdx === i;
                            let btnClass = "aspect-square rounded-lg font-bold text-xs border transition-all flex items-center justify-center ";
                            if (isCurrent) btnClass += "bg-[#00897B] text-white border-[#00897B] shadow-md ";
                            else if (isDone) btnClass += "bg-[#436EEE] text-white border-[#436EEE] ";
                            else btnClass += "bg-white text-gray-400 border-gray-100 hover:bg-gray-50 ";
                            return <button key={q.id} onClick={() => setCurrentIdx(i)} className={btnClass}>{i+1}</button>
                        })}
                    </div>
                </div>
             </div>
             <button onClick={checkSubmit} className="w-full py-4 bg-[#00897B] hover:bg-[#00796B] text-white rounded-xl font-bold shadow-lg uppercase flex justify-center items-center"><CheckCircle className="w-5 h-5 mr-2"/> NỘP BÀI</button>
          </div>
       </div>
    </div>
  );
};
