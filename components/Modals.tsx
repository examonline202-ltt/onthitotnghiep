
import React, { useState, useEffect, useRef } from 'react';
import { Edit, X, Check, FileUp, UploadCloud, Loader2, CheckSquare, FolderPlus, XCircle, Share2, Clock, Copy, Sparkles, Eye, Send, RotateCcw, CheckCircle, ArrowLeft, RefreshCw, UserPlus, Users, Link, FileSpreadsheet, Download, PlayCircle, BookOpen, AlertTriangle, GraduationCap, Lock, EyeOff, Plus, Key, ImageIcon, Trash, Settings, Calculator, ShieldAlert, Calendar } from 'lucide-react';
import { Question, SubQuestion, GradingConfig, Student, ExamConfig } from '../types';
import { MathRenderer, loadExternalLibs, copyToClipboard, parseWordSmart, generateSecurityCode, parseStudentImport } from '../utils/common';

const ImageUploadArea = ({ label, image, onImageChange }: { label: string, image?: string, onImageChange: (img: string) => void }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onImageChange(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const processImageBlob = (blob: Blob) => {
    const reader = new FileReader();
    reader.onloadend = () => onImageChange(reader.result as string);
    reader.readAsDataURL(blob);
  };

  const handlePasteClick = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            processImageBlob(blob);
            return;
          }
        }
      }
      alert("Không tìm thấy hình ảnh trong Clipboard! Hãy thử Sao chép hình ảnh trước.");
    } catch (err) {
      alert("Trình duyệt không cho phép truy cập Clipboard trực tiếp. Vui lòng sử dụng phím tắt Ctrl+V khi nhấp vào khung ảnh.");
    }
  };

  const handlePasteEvent = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) processImageBlob(blob);
          return;
        }
      }
    }
  };

  return (
    <div className="space-y-2 w-full">
      <label className="block text-sm font-bold text-gray-500">{label}</label>
      <div 
        ref={containerRef}
        onPaste={handlePasteEvent}
        tabIndex={0} 
        className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center min-h-[160px] bg-white relative hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 ring-indigo-50 outline-none transition-all group cursor-pointer"
        title="Nhấp vào đây và nhấn Ctrl+V để dán ảnh"
      >
        {image ? (
          <div className="relative w-full">
            <img src={image} alt="Preview" className="max-h-[240px] mx-auto rounded-lg object-contain shadow-sm" />
            <button 
                onClick={(e) => { e.stopPropagation(); onImageChange(''); }} 
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            >
                <Trash className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-gray-300 flex flex-col items-center group-hover:text-indigo-300 transition-colors">
            <ImageIcon className="w-12 h-12 mb-2" />
            <span className="text-sm font-medium">Chưa có ảnh (Dán hoặc Tải lên)</span>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button 
            onClick={() => fileInputRef.current?.click()} 
            className="flex-1 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-indigo-100"
        >
            <UploadCloud className="w-4 h-4" /> Tải ảnh lên
        </button>
        <button 
            onClick={handlePasteClick} 
            className="flex-1 px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-emerald-100"
        >
            <CheckCircle className="w-4 h-4" /> Dán ảnh (Clipboard)
        </button>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFile} />
      </div>
    </div>
  );
};

export const EditQuestionModal = ({ question, onSave, onClose }: { question: Question, onSave: (q: Question) => void, onClose: () => void }) => {
  // Initialize state with padding logic for group questions
  const [editedQ, setEditedQ] = useState<Question>(() => {
      const q = JSON.parse(JSON.stringify(question));
      if (q.type === 'group') {
          q.subQuestions = q.subQuestions || [];
          while (q.subQuestions.length < 4) {
              q.subQuestions.push({
                  id: Date.now() + Math.random().toString(),
                  content: "",
                  correctAnswer: false
              });
          }
      }
      return q;
  });
  
  const handleOptionTextChange = (idx: number, newVal: string) => {
     const newOpts = [...(editedQ.options || [])];
     const oldVal = newOpts[idx];
     newOpts[idx] = newVal;
     
     if (editedQ.answer === oldVal) {
        setEditedQ({ ...editedQ, options: newOpts, answer: newVal });
     } else {
        setEditedQ({ ...editedQ, options: newOpts });
     }
  };

  const handleOptionImageChange = (idx: number, img: string) => {
    const newImgs = [...(editedQ.optionImages || Array(editedQ.options?.length || 4).fill(''))];
    newImgs[idx] = img;
    setEditedQ({ ...editedQ, optionImages: newImgs });
  };

  const handleSubQChange = (idx: number, field: keyof SubQuestion, val: any) => {
     const newSubs = [...(editedQ.subQuestions || [])];
     newSubs[idx] = { ...newSubs[idx], [field]: val };
     setEditedQ({...editedQ, subQuestions: newSubs});
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fade-in font-poppins">
      <div className="bg-white rounded-[24px] w-full max-w-3xl max-h-[95vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center bg-white sticky top-0 z-10">
           <div className="flex items-center gap-3">
              <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600"><Edit className="w-5 h-5"/></div>
              <h3 className="text-xl font-bold text-slate-800">Chỉnh sửa câu hỏi chuyên sâu</h3>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"><X className="w-6 h-6"/></button>
        </div>
        
        <div className="p-8 overflow-y-auto flex-1 space-y-10 bg-white custom-scrollbar">
           <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <ImageUploadArea label="HÌNH ẢNH MINH HỌA (CÂU HỎI)" image={editedQ.image} onImageChange={(img) => setEditedQ({...editedQ, image: img})} />
           </div>

           <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Nội dung câu hỏi (Hỗ trợ Markdown & LaTeX)</label>
              <textarea 
                value={editedQ.question} 
                onChange={e => setEditedQ({...editedQ, question: e.target.value})} 
                className="w-full p-5 border-2 border-gray-100 rounded-2xl outline-none min-h-[140px] text-base focus:border-indigo-500 focus:ring-4 ring-indigo-50 transition-all bg-white font-medium text-slate-700 leading-relaxed shadow-inner"
                placeholder="Nhập nội dung câu hỏi tại đây..."
              />
           </div>

           <div>
              <div className="flex items-center justify-between mb-5">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Danh sách phương án & Hình ảnh đi kèm</label>
                {editedQ.type === 'choice' && (
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100 italic">Nhấp vào hình tròn để chọn đáp án đúng</span>
                )}
              </div>
              
              <div className="space-y-6">
                 {editedQ.type === 'choice' && editedQ.options?.map((opt, i) => (
                   <div key={i} className={`p-6 border-2 rounded-[24px] transition-all ${editedQ.answer === opt ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-50 bg-slate-50/50'}`}>
                      <div className="flex items-start gap-4 mb-4">
                        <button 
                          type="button"
                          onClick={() => setEditedQ({...editedQ, answer: opt})} 
                          className={`mt-3 shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${editedQ.answer === opt ? 'border-emerald-500 bg-emerald-500 shadow-lg shadow-emerald-100' : 'border-gray-300 bg-white hover:border-indigo-400'}`}
                        >
                          {editedQ.answer === opt && <Check className="w-5 h-5 text-white" strokeWidth={3} />}
                        </button>
                        
                        <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="text-lg font-black text-slate-400">{String.fromCharCode(65+i)}.</span>
                                <input 
                                  type="text" 
                                  value={opt} 
                                  onChange={e => handleOptionTextChange(i, e.target.value)} 
                                  className="w-full p-4 bg-white border border-gray-200 rounded-xl outline-none text-sm font-bold focus:border-indigo-500 focus:ring-2 ring-indigo-50 shadow-sm"
                                  placeholder={`Nhập nội dung phương án ${String.fromCharCode(65+i)}`}
                                />
                            </div>
                            
                            <div className="pl-11">
                                <ImageUploadArea 
                                    label={`ẢNH CHO PHƯƠNG ÁN ${String.fromCharCode(65+i)}`} 
                                    image={editedQ.optionImages?.[i]} 
                                    onImageChange={(img) => handleOptionImageChange(i, img)} 
                                />
                            </div>
                        </div>
                      </div>
                   </div>
                 ))}

                 {editedQ.type === 'text' && (
                    <div className="p-6 bg-indigo-50/50 border-2 border-indigo-100 rounded-3xl">
                       <label className="block text-[11px] font-black text-indigo-500 uppercase tracking-widest mb-2 ml-1">Đáp án gợi ý (Hệ thống dùng để so khớp hoặc hiển thị)</label>
                       <textarea 
                         value={editedQ.answer || ''} 
                         onChange={e => setEditedQ({...editedQ, answer: e.target.value})} 
                         className="w-full p-5 bg-white border border-indigo-100 rounded-2xl outline-none text-base focus:border-indigo-500 transition-all min-h-[120px] shadow-sm font-mono"
                         placeholder="Nhập nội dung đáp án chuẩn..."
                       />
                    </div>
                 )}

                 {editedQ.type === 'group' && editedQ.subQuestions?.map((sub, i) => (
                   <div key={i} className="p-6 border-2 border-gray-100 rounded-3xl bg-slate-50/30 space-y-4">
                      <div className="flex items-start gap-4">
                         <span className="mt-3 font-black text-slate-400 text-lg">{String.fromCharCode(97+i)})</span>
                         <textarea 
                           value={sub.content} 
                           onChange={e => handleSubQChange(i, 'content', e.target.value)} 
                           className="flex-1 p-4 bg-white border border-gray-200 rounded-2xl outline-none text-sm font-medium focus:border-indigo-500 shadow-sm"
                           rows={2}
                           placeholder={`Nội dung mệnh đề ${String.fromCharCode(97+i)}...`}
                         />
                      </div>
                      <div className="flex gap-4 pl-12">
                         <button 
                            type="button"
                            onClick={() => handleSubQChange(i, 'correctAnswer', true)}
                            className={`flex-1 py-3 rounded-xl font-black text-xs transition-all border-2 flex items-center justify-center gap-2 ${sub.correctAnswer === true ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-white border-gray-100 text-slate-400 hover:border-emerald-200'}`}
                         >
                            <CheckCircle className="w-4 h-4"/> ĐÚNG
                         </button>
                         <button 
                            type="button"
                            onClick={() => handleSubQChange(i, 'correctAnswer', false)}
                            className={`flex-1 py-3 rounded-xl font-black text-xs transition-all border-2 flex items-center justify-center gap-2 ${sub.correctAnswer === false ? 'bg-red-500 border-red-500 text-white shadow-lg' : 'bg-white border-gray-100 text-slate-400 hover:border-red-200'}`}
                         >
                            <XCircle className="w-4 h-4"/> SAI
                         </button>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end items-center gap-4 sticky bottom-0">
           <button onClick={onClose} className="px-10 py-3 text-sm font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest">Đóng</button>
           <button 
                onClick={() => onSave(editedQ)} 
                className="px-12 py-3.5 text-sm font-black text-white bg-indigo-600 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-2 transform hover:-translate-y-0.5"
           >
                <Check className="w-5 h-5" strokeWidth={3}/> LƯU CẬP NHẬT
           </button>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
};

export const ImportModal = ({ onClose, onImport }: { onClose: () => void, onImport: (q: Question[]) => void }) => {
  const [content, setContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [libStatus, setLibStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  
  useEffect(() => { 
    loadExternalLibs().then(success => setLibStatus(success ? 'ready' : 'error'));
  }, []);
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; 
    if (!file) return;

    if (libStatus !== 'ready') {
        alert("Đang tải các thư viện cần thiết, vui lòng thử lại sau vài giây.");
        return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const arrayBuffer = event.target?.result as ArrayBuffer;
            const mammoth = (window as any).mammoth; 
            if (!mammoth) throw new Error("Thư viện Mammoth chưa sẵn sàng.");
            
            setIsProcessing(true);
            const res = await mammoth.extractRawText({ arrayBuffer: arrayBuffer }); 
            setContent(res.value); 
            setIsProcessing(false); 
        } catch (err: any) { 
            console.error(err);
            alert("Lỗi đọc file: " + (err.message || "Vui lòng kiểm tra lại file Word.")); 
            setIsProcessing(false);
        }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ''; 
  };

  const handleProcess = () => {
    if (!content.trim()) return;
    setIsProcessing(true);
    setTimeout(() => { 
        const res = parseWordSmart(content); 
        if (res.length > 0) { 
            onImport(res); 
            onClose(); 
        } else { 
            alert("Không tìm thấy câu hỏi nào hợp lệ! Hãy đảm bảo định dạng: Câu 1. [Nội dung] A. [Đáp án]..."); 
        } 
        setIsProcessing(false); 
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-teal-900/40 backdrop-blur-sm flex items-center justify-center z-[70] animate-fade-in font-poppins p-4">
      <div className="bg-white rounded-[32px] p-8 w-full max-w-4xl h-[88vh] flex flex-col shadow-2xl border border-teal-100 overflow-hidden">
        <h2 className="text-2xl font-bold mb-6 flex items-center text-teal-800 border-b border-teal-50 pb-4 shrink-0">
            <div className="bg-teal-100 p-2 rounded-xl mr-3"><FileUp className="w-6 h-6 text-teal-600"/></div> 
            Import Đề Thi từ Word (.docx)
        </h2>
        
        <div 
            className={`shrink-0 mb-6 p-10 border-2 border-dashed rounded-[24px] flex flex-col items-center justify-center cursor-pointer transition-all group ${libStatus === 'ready' ? 'border-teal-200 bg-teal-50/50 hover:bg-teal-50 hover:border-teal-300' : 'border-gray-200 bg-gray-50'}`} 
            onClick={() => libStatus === 'ready' && fileInputRef.current?.click()}
        >
             <input type="file" accept=".docx" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
             {libStatus === 'loading' ? (
                 <Loader2 className="w-12 h-12 text-teal-400 animate-spin mb-2"/>
             ) : (
                 <UploadCloud className={`w-14 h-14 mb-3 transition-colors ${libStatus === 'ready' ? 'text-teal-400 group-hover:text-teal-600' : 'text-gray-300'}`}/>
             )}
             <p className="font-black text-teal-800 text-xl tracking-tight">{libStatus === 'loading' ? 'Đang chuẩn bị thư viện...' : 'Chọn file Word của bạn'}</p>
             <p className="text-sm text-teal-600/70 mt-2 font-medium">Lưu ý: Hệ thống sẽ giữ nguyên thứ tự các câu hỏi từ file nhập vào.</p>
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nội dung văn bản nhận diện</label>
            <textarea 
                className="flex-1 p-5 border border-gray-200 rounded-2xl font-mono text-sm resize-none outline-none focus:border-teal-500 transition-colors bg-gray-50 focus:bg-white shadow-inner" 
                value={content} 
                onChange={e => setContent(e.target.value)} 
                placeholder="Nội dung văn bản sẽ xuất hiện ở đây. Bạn có thể sửa trực tiếp hoặc thêm ký hiệu * trước phương án đúng." 
            />
        </div>

        <div className="flex justify-end gap-3 mt-6 border-t border-teal-50 pt-6 shrink-0">
          <button onClick={onClose} className="px-8 py-3 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">Hủy bỏ</button>
          <button 
            onClick={handleProcess} 
            disabled={!content.trim() || isProcessing || libStatus !== 'ready'} 
            className="px-10 py-3 bg-teal-600 text-white rounded-xl font-black text-sm hover:bg-teal-700 shadow-xl shadow-teal-100 flex items-center disabled:opacity-50 transition-all transform hover:-translate-y-0.5"
          >
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin mr-2"/> : <CheckSquare className="w-5 h-5 mr-2"/>} 
            Xử lý & Tạo danh sách câu hỏi
          </button>
        </div>
      </div>
    </div>
  );
};

export const CreateExamModal = ({ onClose, onCreate }: any) => {
  const [form, setForm] = useState({ code: '', title: '', className: '' });
  const isFormValid = form.code.trim() && form.title.trim() && form.className.trim();

  return (
    <div className="fixed inset-0 bg-teal-900/40 backdrop-blur-sm flex items-center justify-center z-[70] animate-fade-in font-poppins">
      <div className="bg-white rounded-[40px] p-10 w-full max-w-[540px] shadow-2xl border border-teal-50 relative">
        <div className="flex items-center justify-between mb-8 border-b border-teal-50/50 pb-6">
           <div className="flex items-center gap-4">
              <div className="bg-white p-1 rounded-lg"><FolderPlus className="w-8 h-8 text-[#0d9488]" strokeWidth={1.5} /></div>
              <h2 className="text-[28px] font-bold text-[#0d9488] tracking-tight">Tạo Đề Thi Mới</h2>
           </div>
           <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><XCircle className="w-8 h-8 text-gray-300" strokeWidth={1.5} /></button>
        </div>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
             <div className="space-y-2"><label className="block text-[13px] font-bold text-[#0d9488] uppercase tracking-wide">Mã đề</label><input type="text" value={form.code} onChange={e => setForm({...form, code: e.target.value})} className="w-full p-4 border border-[#0d9488]/10 rounded-[20px] outline-none bg-[#f0fdfa]/50 focus:bg-white focus:border-[#0d9488] transition-all" placeholder="VD: GK1" /></div>
             <div className="space-y-2"><label className="block text-[13px] font-bold text-[#0d9488] uppercase tracking-wide">Lớp</label><input type="text" value={form.className} onChange={e => setForm({...form, className: e.target.value})} className="w-full p-4 border border-[#0d9488]/10 rounded-[20px] outline-none bg-[#f0fdfa]/50 focus:bg-white focus:border-[#0d9488] transition-all" placeholder="VD: 12A1" /></div>
          </div>
          <div className="space-y-2"><label className="block text-[13px] font-bold text-[#0d9488] uppercase tracking-wide">Tên đề thi</label><input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full p-4 border border-[#0d9488]/10 rounded-[20px] outline-none bg-[#f0fdfa]/50 focus:bg-white focus:border-[#0d9488] transition-all" placeholder="VD: Kiểm tra 1 tiết..." /></div>
        </div>
        <div className="flex justify-end items-center gap-10 mt-12">
          <button onClick={onClose} className="text-lg font-bold text-slate-600 hover:text-slate-800 transition-colors">Hủy bỏ</button>
          <button onClick={() => isFormValid && onCreate({...form, id: Date.now().toString(), questions: [], results: [], createdAt: new Date().toLocaleString(), duration: 45, maxAttempts: 0, securityCode: '', allowHints: false, allowReview: true})} disabled={!isFormValid} className={`px-12 py-4 rounded-[20px] font-bold text-xl text-white shadow-xl transition-all transform hover:-translate-y-1 ${isFormValid ? 'bg-gradient-to-r from-[#0d9488] to-[#14b8a6]' : 'bg-gray-300'}`}>Tạo Ngay</button>
        </div>
      </div>
    </div>
  );
};

export const StudentModal = ({ student, onSave, onClose }: { student?: Student, onSave: (s: Student & { password?: string }) => void, onClose: () => void }) => {
  const [formData, setFormData] = useState<Partial<Student & { password?: string }>>(student || { name: '', className: '', email: '', password: '', isApproved: false });
  const [showPass, setShowPass] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
      if (!formData.name || !formData.className || !formData.email) {
          alert("Vui lòng nhập đầy đủ Tên, Lớp và Email!");
          return;
      }
      
      if ((!student && !formData.password) || (isResetting && !formData.password)) {
          alert("Vui lòng nhập mật khẩu mới!");
          return;
      }

      setLoading(true);
      try {
          await onSave({ ...formData, id: student?.id || Date.now().toString() } as any);
          onClose();
      } catch (err: any) {
          alert("Lỗi: " + err.message);
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[80] animate-fade-in font-poppins p-4">
      <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-500 to-indigo-500"></div>
        
        <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-5">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-50 rounded-xl"><UserPlus className="w-6 h-6 text-teal-600"/></div>
              <h3 className="text-xl font-black text-slate-800">{student ? 'Cập nhật học sinh' : 'Thêm học sinh mới'}</h3>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-full transition-all"><X className="w-6 h-6"/></button>
        </div>

        <div className="space-y-5">
           <div className="space-y-1.5">
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Họ và Tên học sinh</label>
              <input type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-teal-500 transition-all font-bold text-slate-700" placeholder="Nguyễn Văn A" />
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                 <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Lớp học</label>
                 <input type="text" value={formData.className || ''} onChange={e => setFormData({...formData, className: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-teal-500 transition-all font-bold text-slate-700" placeholder="12A1" />
              </div>
              <div className="space-y-1.5">
                 <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Email tài khoản</label>
                 <input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className={`w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-teal-500 transition-all font-bold text-slate-700 ${student ? 'opacity-60 cursor-not-allowed' : ''}`} placeholder="hs@gmail.com" readOnly={!!student} />
              </div>
           </div>

           {(!student || isResetting) ? (
               <div className="space-y-1.5 pt-2 border-t border-slate-50 animate-in fade-in slide-in-from-top-2">
                  <label className="block text-[11px] font-black text-teal-600 uppercase tracking-widest ml-1 flex items-center gap-1">
                      <Lock className="w-3 h-3"/> {student ? 'Đặt mật khẩu mới' : 'Thiết lập mật khẩu ban đầu'}
                  </label>
                  <div className="relative">
                      <input 
                        type={showPass ? "text" : "password"} 
                        value={formData.password || ''} 
                        onChange={e => setFormData({...formData, password: e.target.value})} 
                        className="w-full p-4 bg-teal-50/30 border border-teal-100 rounded-2xl outline-none focus:bg-white focus:border-teal-500 transition-all font-mono font-bold text-teal-700" 
                        placeholder="Ít nhất 6 ký tự" 
                        autoFocus={isResetting}
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPass(!showPass)} 
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-teal-400 hover:text-teal-600"
                      >
                        {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                  </div>
                  {student && (
                      <button type="button" onClick={() => { setIsResetting(false); setFormData({...formData, password: ''}); }} className="text-[10px] font-bold text-red-500 mt-2 hover:underline uppercase">Hủy đặt lại mật khẩu</button>
                  )}
               </div>
           ) : (
               <div className="pt-2 border-t border-slate-50">
                  <button 
                    type="button" 
                    onClick={() => setIsResetting(true)}
                    className="flex items-center gap-2 text-xs font-black text-teal-600 hover:text-teal-700 bg-teal-50 px-4 py-3 rounded-xl transition-all w-full justify-center border border-teal-100 shadow-sm"
                  >
                    <RefreshCw className="w-4 h-4"/> ĐẶT LẠI MẬT KHẨU CHO HỌC SINH
                  </button>
                  <p className="text-[9px] text-slate-400 mt-2 text-center italic">Sử dụng khi học sinh quên mật khẩu hoặc cần cấp lại quyền truy cập.</p>
               </div>
           )}
        </div>

        <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-slate-50">
           <button onClick={onClose} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all">Hủy</button>
           <button 
             disabled={loading}
             onClick={handleSave} 
             className="px-10 py-3 bg-teal-600 text-white rounded-2xl font-black shadow-xl shadow-teal-100 hover:bg-teal-700 transition-all transform hover:-translate-y-1 flex items-center gap-2"
           >
             {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Check className="w-5 h-5"/>}
             {student ? 'Cập nhật' : 'Tạo học sinh'}
           </button>
        </div>
      </div>
    </div>
  );
};

export const ImportStudentModal = ({ onClose, onImport }: { onClose: () => void, onImport: (students: Student[]) => void }) => {
   const [text, setText] = useState('');
   const [fileInputKey, setFileInputKey] = useState(Date.now()); 
   const fileInputRef = useRef<HTMLInputElement>(null);
   useEffect(() => { loadExternalLibs(); }, []);
   const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
         try {
            const data = evt.target?.result;
            const XLSX = (window as any).XLSX;
            if (!XLSX) return;
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
            let resultText = "";
            jsonData.forEach((row: any) => { if (row[0]) resultText += `${row[0]}\t${row[1]}\t${row[2]}\n`; });
            setText(resultText);
         } catch (err) { alert("Lỗi đọc file Excel!"); }
      };
      reader.readAsArrayBuffer(file);
      setFileInputKey(Date.now());
   };
   const handleProcess = () => {
      const students = parseStudentImport(text);
      if (students.length > 0) { onImport(students as Student[]); onClose(); } else { alert("Không có dữ liệu hợp lệ!"); }
   };
   return (
      <div className="fixed inset-0 bg-teal-900/40 backdrop-blur-sm flex items-center justify-center z-[80] animate-fade-in font-poppins p-4">
         <div className="bg-white rounded-[24px] p-8 w-full max-w-4xl shadow-2xl border border-teal-100 h-[85vh] flex flex-col">
            <div className="flex justify-between items-center mb-6 border-b border-teal-50 pb-4"><h2 className="text-2xl font-bold text-teal-800 flex items-center"><UploadCloud className="w-6 h-6 mr-2 text-teal-600"/> Import Danh sách Học sinh</h2><button onClick={onClose}><X className="w-6 h-6 text-gray-400 hover:text-red-500"/></button></div>
            <div className="border-2 border-dashed border-teal-200 rounded-[20px] bg-teal-50/30 p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-teal-50 transition-colors group mb-6" onClick={() => fileInputRef.current?.click()}>
               <FileSpreadsheet className="w-10 h-10 text-teal-400 group-hover:text-teal-600 mb-2"/><span className="font-bold text-teal-700">Nhấn để chọn file Excel</span><input key={fileInputKey} type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleFile} />
            </div>
            <textarea value={text} onChange={e => setText(e.target.value)} className="flex-1 w-full p-4 border border-gray-200 rounded-2xl outline-none font-mono text-sm resize-none bg-gray-50" placeholder="Copy & Paste từ Excel vào đây..."/>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-teal-50"><button onClick={onClose} className="px-6 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-xl">Hủy</button><button onClick={handleProcess} className="px-8 py-2.5 bg-teal-600 text-white rounded-xl font-bold shadow-lg shadow-teal-200 transition-all">Lưu danh sách</button></div>
         </div>
      </div>
   );
};

export const AssignExamModal = ({ exam, students, onClose }: { exam: ExamConfig, students: Student[], onClose: () => void }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const link = `${window.location.protocol}//${window.location.host}${window.location.pathname}?examId=${exam.id}&code=${exam.securityCode}`;
  const handleCopyLink = () => { copyToClipboard(link); setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); };
  const handleCopyCode = () => { copyToClipboard(exam.securityCode); setCopiedCode(true); setTimeout(() => setCopiedCode(false), 2000); };
  return (
    <div className="fixed inset-0 bg-teal-900/50 backdrop-blur-sm flex items-center justify-center z-[80] animate-fade-in font-poppins p-4">
       <div className="bg-white rounded-[24px] p-8 w-full max-w-lg shadow-2xl border border-teal-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal-400 to-emerald-400"></div>
          <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-black text-gray-800 flex items-center gap-2"><div className="bg-teal-100 p-2 rounded-xl"><Share2 className="w-6 h-6 text-teal-600" /></div> Giao bài tập</h2><button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full"><X className="w-5 h-5"/></button></div>
          <div className="bg-teal-50/50 rounded-2xl p-6 border border-teal-100 mb-6"><h3 className="font-bold text-teal-800 text-lg mb-1">{exam.title}</h3><p className="text-sm text-teal-600 flex items-center gap-2"><Clock className="w-3 h-3"/> {exam.duration} phút</p></div>
          <div className="space-y-6">
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Mã đề thi</label>
                  <div className="flex gap-2"><div className="flex-1 p-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl text-center"><span className="text-3xl font-black text-gray-800 tracking-[0.3em] font-mono">{exam.securityCode}</span></div>
                      <button onClick={handleCopyCode} className={`px-5 rounded-xl font-bold flex flex-col items-center justify-center gap-1 min-w-[80px] ${copiedCode ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}>{copiedCode ? <Check className="w-5 h-5"/> : <Copy className="w-5 h-5"/>}<span className="text-[10px]">Copy</span></button>
                  </div>
              </div>
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Link trực tiếp</label>
                  <div className="flex gap-2"><input type="text" readOnly value={link} className="flex-1 p-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 font-medium outline-none shadow-sm" /><button onClick={handleCopyLink} className={`px-4 rounded-xl font-bold transition-all shadow-md ${copiedLink ? 'bg-green-600 text-white' : 'bg-teal-600 text-white shadow-teal-200'}`}>{copiedLink ? 'Đã Copy' : 'Copy Link'}</button></div>
              </div>
          </div>
       </div>
    </div>
  );
};

export const PublishExamModal = ({ exam, onClose, onConfirm, onPlay, onCreateNew }: { exam: ExamConfig, onClose: () => void, onConfirm: (settings: any) => void, onPlay: () => void, onCreateNew: () => void }) => {
  const [settings, setSettings] = useState({
    duration: exam.duration || 45,
    maxAttempts: exam.maxAttempts || 0,
    maxViolations: exam.maxViolations || 3,
    allowHints: exam.allowHints || false,
    allowReview: exam.allowReview !== undefined ? exam.allowReview : true,
    securityCode: exam.securityCode || generateSecurityCode(),
    gradingConfig: exam.gradingConfig || {
      part1Total: 6,
      part2Total: 4,
      part3Total: 0,
      part4Total: 0,
      groupGradingMethod: 'progressive',
      startTime: '',
      endTime: ''
    } as GradingConfig
  });

  const handleSave = async () => {
    await onConfirm(settings);
    onClose();
  };

  const handleGradingChange = (field: keyof GradingConfig, val: any) => {
    setSettings({
        ...settings,
        gradingConfig: {
            ...settings.gradingConfig,
            [field]: val
        }
    });
  };

  return (
    <div className="fixed inset-0 bg-teal-900/40 backdrop-blur-sm flex items-center justify-center z-[80] animate-fade-in font-poppins p-4">
      <div className="bg-white rounded-[32px] p-8 w-full max-w-xl shadow-2xl border border-teal-100 relative overflow-hidden custom-scrollbar max-h-[90vh] overflow-y-auto">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 to-teal-400"></div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <div className="bg-blue-100 p-2 rounded-xl"><Share2 className="w-6 h-6 text-blue-600" /></div> 
            Xuất bản đề thi
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full"><X className="w-5 h-5"/></button>
        </div>

        <div className="space-y-6">
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <h3 className="font-bold text-gray-800 text-sm truncate">{exam.title}</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Mã: {exam.code} • Lớp: {exam.className}</p>
           </div>

           {/* Grading Configuration Section */}
           <div className="p-6 bg-slate-50/50 rounded-[24px] border border-slate-100 space-y-5">
              <div className="flex items-center gap-2 mb-2">
                 <Calculator className="w-5 h-5 text-teal-600" />
                 <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Cài đặt thang điểm (Tổng mặc định là 10)</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tổng điểm P.I (TN)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={settings.gradingConfig.part1Total} 
                      onChange={e => handleGradingChange('part1Total', parseFloat(e.target.value) || 0)} 
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-teal-500 font-bold text-slate-700" 
                    />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tổng điểm P.II (Đúng/Sai)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={settings.gradingConfig.part2Total} 
                      onChange={e => handleGradingChange('part2Total', parseFloat(e.target.value) || 0)} 
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-teal-500 font-bold text-slate-700" 
                    />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tổng điểm P.III (TL Ngắn)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={settings.gradingConfig.part3Total} 
                      onChange={e => handleGradingChange('part3Total', parseFloat(e.target.value) || 0)} 
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-teal-500 font-bold text-slate-700" 
                    />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tổng điểm P.IV (Tự luận)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={settings.gradingConfig.part4Total} 
                      onChange={e => handleGradingChange('part4Total', parseFloat(e.target.value) || 0)} 
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-teal-500 font-bold text-slate-700" 
                    />
                 </div>
              </div>

              <div className="space-y-1.5 pt-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cách tính điểm cho mỗi câu P.II (Đúng/Sai)</label>
                 <select 
                   value={settings.gradingConfig.groupGradingMethod}
                   onChange={e => handleGradingChange('groupGradingMethod', e.target.value)}
                   className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-teal-500 font-bold text-slate-700 text-sm cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207L10%2012L15%207%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat"
                 >
                    <option value="progressive">Lũy tiến (1ý=10%, 2ý=25%, 3ý=50%, 4ý=100% điểm câu)</option>
                    <option value="equal">Chia đều (Điểm chia đều cho số lượng ý đúng/sai)</option>
                 </select>
              </div>
           </div>

           {/* Time Configuration Section */}
           <div className="p-6 bg-slate-50/50 rounded-[24px] border border-slate-100 space-y-5">
              <div className="flex items-center gap-2 mb-2">
                 <Calendar className="w-5 h-5 text-indigo-600" />
                 <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Cấu hình thời gian tổ chức</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mở đề lúc</label>
                    <input 
                      type="datetime-local" 
                      value={settings.gradingConfig.startTime || ''} 
                      onChange={e => handleGradingChange('startTime', e.target.value)} 
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-bold text-slate-700 text-sm" 
                    />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Đóng đề lúc</label>
                    <input 
                      type="datetime-local" 
                      value={settings.gradingConfig.endTime || ''} 
                      onChange={e => handleGradingChange('endTime', e.target.value)} 
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-bold text-slate-700 text-sm" 
                    />
                 </div>
              </div>
           </div>

           {/* Core Timing & Code */}
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Thời gian làm bài (Phút)</label>
                 <input type="number" value={settings.duration} onChange={e => setSettings({...settings, duration: parseInt(e.target.value) || 0})} className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-bold text-gray-700" />
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Mã vào thi (6 ký tự)</label>
                 <div className="flex gap-1">
                    <input type="text" value={settings.securityCode} onChange={e => setSettings({...settings, securityCode: e.target.value.toUpperCase()})} className="w-full p-3 bg-blue-50 border border-blue-100 rounded-xl outline-none focus:border-blue-500 font-black text-blue-700 text-center tracking-widest" maxLength={6} />
                    <button onClick={() => setSettings({...settings, securityCode: generateSecurityCode()})} className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-gray-500"><RefreshCw className="w-4 h-4"/></button>
                 </div>
              </div>
           </div>

           {/* ADVANCED CONFIG GRID (2x2) */}
           <div className="grid grid-cols-2 gap-3">
              {/* Hỗ trợ AI */}
              <button 
                onClick={() => setSettings({...settings, allowHints: !settings.allowHints})}
                className={`p-4 rounded-2xl border-2 flex flex-col gap-2 transition-all text-left ${settings.allowHints ? 'border-purple-200 bg-purple-50' : 'border-gray-100 bg-white'}`}
              >
                 <div className="flex items-center justify-between w-full">
                    <Sparkles className={`w-5 h-5 ${settings.allowHints ? 'text-purple-600' : 'text-gray-300'}`} />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${settings.allowHints ? 'bg-purple-600 border-purple-600' : 'border-gray-200'}`}>
                        {settings.allowHints && <Check className="w-3.5 h-3.5 text-white" strokeWidth={4} />}
                    </div>
                 </div>
                 <span className={`text-[11px] font-black uppercase tracking-tight ${settings.allowHints ? 'text-purple-800' : 'text-gray-500'}`}>Hỗ trợ AI Gợi ý</span>
              </button>

              {/* Xem kết quả */}
              <button 
                onClick={() => setSettings({...settings, allowReview: !settings.allowReview})}
                className={`p-4 rounded-2xl border-2 flex flex-col gap-2 transition-all text-left ${settings.allowReview ? 'border-teal-200 bg-teal-50' : 'border-gray-100 bg-white'}`}
              >
                 <div className="flex items-center justify-between w-full">
                    <Eye className={`w-5 h-5 ${settings.allowReview ? 'text-teal-600' : 'text-gray-300'}`} />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${settings.allowReview ? 'bg-teal-600 border-teal-600' : 'border-gray-200'}`}>
                        {settings.allowReview && <Check className="w-3.5 h-3.5 text-white" strokeWidth={4} />}
                    </div>
                 </div>
                 <span className={`text-[11px] font-black uppercase tracking-tight ${settings.allowReview ? 'text-teal-800' : 'text-gray-500'}`}>Cho phép xem KQ</span>
              </button>

              {/* Số lần được phép làm bài */}
              <div className="p-4 rounded-2xl border-2 border-gray-100 bg-white flex flex-col gap-2 transition-all">
                 <div className="flex items-center justify-between w-full">
                    <RotateCcw className="w-5 h-5 text-indigo-500" />
                    <input 
                        type="number" 
                        min="0"
                        value={settings.maxAttempts} 
                        onChange={e => setSettings({...settings, maxAttempts: parseInt(e.target.value) || 0})}
                        className="w-12 text-right bg-indigo-50 text-indigo-700 font-black text-xs rounded p-1 outline-none border border-indigo-100"
                    />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-tight">Số lần làm bài</span>
                    <span className="text-[8px] text-slate-400 font-bold">(0 = Không giới hạn)</span>
                 </div>
              </div>

              {/* Giới hạn vi phạm */}
              <div className="p-4 rounded-2xl border-2 border-gray-100 bg-white flex flex-col gap-2 transition-all">
                 <div className="flex items-center justify-between w-full">
                    <ShieldAlert className="w-5 h-5 text-red-500" />
                    <input 
                        type="number" 
                        min="1"
                        value={settings.maxViolations} 
                        onChange={e => setSettings({...settings, maxViolations: parseInt(e.target.value) || 1})}
                        className="w-12 text-right bg-red-50 text-red-700 font-black text-xs rounded p-1 outline-none border border-red-100"
                    />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-tight">Giới hạn vi phạm</span>
                    <span className="text-[8px] text-slate-400 font-bold">(Tự nộp bài khi đạt ngưỡng)</span>
                 </div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-10">
           <button onClick={handleSave} className="py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2">
              <Check className="w-5 h-5"/> Lưu thiết lập
           </button>
           <button onClick={onPlay} className="py-4 bg-teal-600 text-white rounded-2xl font-black shadow-lg hover:bg-teal-700 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2">
              <PlayCircle className="w-5 h-5"/> Vào thi thử
           </button>
        </div>
      </div>
    </div>
  );
};
