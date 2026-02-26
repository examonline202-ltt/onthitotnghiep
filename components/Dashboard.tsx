

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  PenTool, 
  Share2, 
  LogOut, 
  FolderPlus, 
  Trash2, 
  Clock, 
  List, 
  Users, 
  FileUp, 
  Plus, 
  PlayCircle, 
  Edit, 
  ArrowLeft, 
  Copy, 
  BarChart3, 
  Search, 
  Download, 
  Filter, 
  Eye, 
  X, 
  UserPlus, 
  Upload, 
  BookOpen, 
  CircleCheck, 
  GraduationCap, 
  Calendar, 
  TriangleAlert, 
  Trophy, 
  FileText, 
  Bell, 
  UserMinus, 
  Check, 
  LogIn, 
  Lock, 
  Mail, 
  MoreHorizontal, 
  FileCode, 
  ChevronRight, 
  Settings, 
  Globe, 
  Info, 
  User, 
  FileSpreadsheet, 
  EyeOff, 
  ClipboardList, 
  Trash, 
  RefreshCw, 
  ShieldAlert, 
  Loader2, 
  Sparkles, 
  WandSparkles, 
  Type, 
  Key, 
  Send, 
  RotateCcw, 
  Calculator, 
  CheckSquare, 
  UploadCloud,
  Menu,
  Hourglass
} from 'lucide-react';
import { ExamConfig, Question, StudentResult, Student, User as UserType, QuestionType } from '../types';
import { copyToClipboard, MathRenderer, loadExternalLibs, exportResultsToExcel, exportExamToDocx, exportStudentsToExcel } from '../utils/common';
import { EditQuestionModal, ImportModal, PublishExamModal, StudentModal, ImportStudentModal, AssignExamModal } from './Modals';
import { ResultScreen } from './Player';
import { dataService } from '../services/dataService';

const DASHBOARD_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');

  body {
    background-color: #f1f8f7;
    background-image: 
      radial-gradient(at 0% 0%, rgba(255,255,255,0.8) 0px, transparent 50%),
      radial-gradient(at 90% 90%, rgba(175, 238, 238, 0.4) 0px, transparent 60%);
    background-attachment: fixed;
    font-family: 'Be Vietnam Pro', sans-serif;
  }

  .font-poppins { font-family: 'Be Vietnam Pro', sans-serif !important; }
  
  .sidebar-btn {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 12px 16px;
    margin-bottom: 4px;
    border-radius: 12px;
    font-weight: 500;
    transition: all 0.2s ease;
  }
  
  .stat-card-3d {
    background: #ffffff;
    border-radius: 32px;
    padding: 32px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid #eef2f6;
    box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.12);
    position: relative;
    transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    cursor: default;
  }

  .stat-card-3d:hover {
    transform: translateY(-10px) rotate(-1.5deg) scale(1.03);
    box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25);
    border-color: #0d948830;
  }

  .stat-card-3d::before {
    content: '';
    position: absolute;
    bottom: -6px;
    right: -6px;
    width: 100%;
    height: 100%;
    background: #0d9488;
    border-radius: 32px;
    z-index: -1;
    box-shadow: 4px 4px 15px rgba(13, 148, 136, 0.3);
    transition: all 0.4s ease;
  }
  
  .stat-card-3d:hover::before {
    bottom: -10px;
    right: -10px;
    transform: rotate(1.5deg);
    opacity: 0.8;
  }

  .stat-icon-box-3d {
    width: 72px;
    height: 72px;
    border-radius: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  
  .stat-card-3d:hover .stat-icon-box-3d {
    transform: scale(1.1) rotate(8deg);
  }

  .exam-card {
    background: white;
    border-radius: 32px;
    border: 1px solid #f1f5f9;
    padding: 32px;
    transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 40px -12px rgba(15, 23, 42, 0.12);
  }

  .exam-card:hover {
    transform: translateY(-12px) rotateZ(1.5deg) scale(1.02);
    box-shadow: 0 35px 70px -15px rgba(15, 23, 42, 0.2);
    border-color: #0d948860;
  }

  .rank-badge {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    font-size: 13px;
    color: white;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
  .rank-1 { background: #facc15; }
  .rank-default { background: #94a3b8; }

  .score-text {
    font-size: 32px;
    font-weight: 900;
    color: #e11d48;
    font-family: 'Be Vietnam Pro', sans-serif;
  }

  .switch {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 26px;
  }
  .switch input { opacity: 0; width: 0; height: 0; }
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0; left: 0; right: 0; bottom: 0;
    background-color: #cbd5e1;
    transition: .4s;
    border-radius: 34px;
  }
  .slider:before {
    position: absolute;
    content: "";
    height: 18px; width: 18px;
    left: 4px; bottom: 4px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  }
  input:checked + .slider { background-color: #0d9488; }
  input:checked + .slider:before { transform: translateX(24px); }

  /* New Styles for Question Sections and Group Questions */
  .section-pill {
    background: #e0f2f1;
    color: #00897B;
    border: 1px solid #b2dfdb;
    padding: 8px 24px;
    border-radius: 99px;
    font-weight: 900;
    font-size: 14px;
    text-transform: uppercase;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    display: inline-block;
    margin-bottom: 24px;
  }

  .question-badge {
      background: #00897B;
      color: white;
      font-weight: 800;
      padding: 6px 16px;
      border-radius: 12px;
      font-size: 14px;
      display: inline-flex;
      align-items: center;
      box-shadow: 0 4px 6px -1px rgba(0, 137, 123, 0.3);
  }

  .choice-grid {
      display: grid;
      grid-template-columns: repeat(1, 1fr);
      gap: 12px;
  }
  @media (min-width: 768px) {
      .choice-grid { grid-template-columns: repeat(2, 1fr); }
  }

  .choice-item-box {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      background: white;
      transition: all 0.2s ease;
  }
  .choice-item-box.correct {
      border-color: #00897B;
      background-color: #f0fdfa;
      box-shadow: 0 0 0 1px #00897B;
  }

  /* Style cho bảng câu hỏi Đúng/Sai */
  .group-q-row {
    display: flex;
    align-items: flex-start; /* Changed from center to flex-start for multiline support */
    padding: 12px 16px;
    border-bottom: 1px solid #f1f5f9;
  }
  .group-q-row:last-child {
    border-bottom: none;
  }
  .group-q-label {
    font-weight: 900;
    color: #cbd5e1;
    width: 24px;
    font-size: 15px;
    padding-top: 2px; /* Adjust for alignment */
  }
  .group-q-content {
    flex: 1;
    font-size: 14px;
    color: #334155;
    font-weight: 500;
    padding-right: 16px;
    text-align: justify;
    word-break: break-word; /* Ensure code blocks don't overflow */
  }
  .group-q-badge {
    padding: 4px 16px;
    border-radius: 8px;
    font-size: 10px;
    font-weight: 900;
    text-transform: uppercase;
    min-width: 70px;
    text-align: center;
    margin-top: 2px; /* Align with text */
  }
  .badge-true {
    background-color: #dcfce7;
    color: #166534;
  }
  .badge-false {
    background-color: #fee2e2;
    color: #991b1b;
  }
  .group-header {
    display: flex;
    background-color: #f8fafc;
    padding: 12px 16px;
    border-bottom: 1px solid #f1f5f9;
    font-size: 10px;
    font-weight: 900;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`;

export const DashboardOverview = ({ 
  students, 
  exams, 
  user, 
  showScoresToStudents = false, 
  onToggleScores 
}: { 
  students: Student[], 
  exams: ExamConfig[], 
  user: UserType | null,
  showScoresToStudents?: boolean,
  onToggleScores?: (val: boolean) => void
}) => {
  const dateStr = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  const stats = useMemo(() => {
    const activeStudentSet = new Set<string>();
    let totalViolations = 0;
    let totalAttempts = 0;
    let totalScoreSum = 0;
    let publishedCount = 0;

    exams.forEach(exam => {
      if (exam.securityCode && exam.securityCode.trim() !== '') {
          publishedCount++;
      }

      if (exam.results && Array.isArray(exam.results)) {
          exam.results.forEach(result => {
            totalAttempts++;
            totalScoreSum += (Number(result.score) || 0);
            totalViolations += (Number(result.violations) || 0);
            
            const emailPart = (result.email || '').trim().toLowerCase();
            const namePart = (result.name || '').trim().toLowerCase();
            const classPart = (result.className || '').trim().toLowerCase();
            
            const identifier = emailPart !== '' ? emailPart : `${namePart}_${classPart}`;
            if (identifier !== '') activeStudentSet.add(identifier);
          });
      }
    });

    const avg = totalAttempts > 0 ? (totalScoreSum / totalAttempts).toFixed(2) : "0.00";

    return { activeCount: activeStudentSet.size, totalViolations, totalAttempts, publishedCount, avg };
  }, [exams]);

  const isTeacher = user && user.role !== 'student';

  const statsRows = [
    [
      { label: 'Tổng số học sinh', value: students.length, badge: 'Hệ thống', icon: Users, color: 'bg-blue-600', textColor: 'text-blue-600' },
      { label: 'Học sinh đã dự thi', value: stats.activeCount, badge: `${stats.totalAttempts} lượt nộp bài`, icon: GraduationCap, color: 'bg-indigo-600', textColor: 'text-indigo-600' },
      { label: 'Lượt vi phạm', value: stats.totalViolations, badge: 'Toàn hệ thống', icon: TriangleAlert, color: 'bg-red-600', textColor: 'text-red-600' },
    ],
    [
      { label: 'Tổng số đề thi', value: exams.length, badge: 'Kho dữ liệu', icon: FileText, color: 'bg-teal-600', textColor: 'text-teal-600' },
      { label: 'Số đề đang mở', value: stats.publishedCount, badge: 'Đang diễn ra', icon: Share2, color: 'bg-purple-600', textColor: 'text-purple-600' },
      { label: 'Điểm TB hệ thống', value: stats.avg, badge: 'Năng lực chung', icon: Trophy, color: 'bg-yellow-600', textColor: 'text-yellow-600' },
    ]
  ];

  return (
    <div className="space-y-12 font-poppins animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">
            {isTeacher ? "Quản trị hệ thống" : "Bảng tin chung"}
          </h2>
          <p className="text-slate-500 mt-1 font-medium">{dateStr}</p>
        </div>
        {!isTeacher && user && (
           <div className="bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-black border border-teal-100 uppercase">
                {user.name?.charAt(0) || 'U'}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Thí sinh</span>
                <span className="text-sm font-black text-gray-700">{user.name}</span>
              </div>
           </div>
        )}
      </div>

      {isTeacher && (
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-500">
           <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
                 <Settings className="w-8 h-8" />
              </div>
              <div>
                 <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase">Cấu hình hiển thị bảng điểm</h3>
                 <p className="text-sm text-slate-400 font-bold">Quyết định việc học sinh có thể truy cập vào tab "Báo cáo điểm" hay không.</p>
              </div>
           </div>
           <div className="flex items-center gap-4 bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100 w-full md:w-auto justify-between md:justify-start">
              <span className={`text-xs font-black uppercase tracking-widest ${showScoresToStudents ? 'text-teal-600' : 'text-slate-400'}`}>
                 {showScoresToStudents ? 'Đang mở bảng điểm' : 'Đang ẩn bảng điểm'}
              </span>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={showScoresToStudents} 
                  onChange={(e) => onToggleScores?.(e.target.checked)} 
                />
                <span className="slider"></span>
              </label>
           </div>
        </div>
      )}

      <div className="space-y-10">
        {statsRows.map((row, rIdx) => (
          <div key={rIdx} className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {row.map((stat, sIdx) => (
              <div key={sIdx} className="stat-card-3d">
                <div className="flex flex-col h-full justify-between">
                  <h3 className="text-[15px] font-bold text-gray-800 mb-2 leading-tight">{stat.label}</h3>
                  <p className={`text-5xl font-black my-4 ${stat.textColor} tracking-tighter`}>{stat.value}</p>
                  <div><span className="px-3 py-1 bg-gray-50 text-gray-500 text-[10px] font-black rounded-lg border border-gray-100 uppercase tracking-widest">{stat.badge}</span></div>
                </div>
                <div className={`stat-icon-box-3d ${stat.color} text-white shadow-lg`}>
                  <stat.icon className="w-9 h-9" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const DashboardLayout = ({ 
  children, 
  activeTab, 
  onTabChange, 
  user, 
  isGuest = false, 
  showScoresToStudents = false,
  onLoginClick, 
  onLogoutClick 
}: any) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const sidebarItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Quản lý học sinh', icon: Users },
    { id: 'list', label: 'Quản lý đề thi', icon: FileText },
    { id: 'scores', label: 'Báo cáo điểm', icon: BarChart3 },
    { id: 'publish', label: 'Phòng thi', icon: Share2 },
  ];

  return (
    <div className="flex h-screen bg-transparent font-poppins overflow-hidden">
      <style>{DASHBOARD_STYLES}</style>
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 
        w-64 bg-[#0D9488] border-2 border-gray-100 flex flex-col shadow-2xl m-0 lg:m-4 rounded-r-[20px] lg:rounded-[20px] text-white shrink-0
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
         <div className="p-6 border-b border-white/20 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30"><GraduationCap className="w-6 h-6 text-white"/></div>
              <div><h1 className="text-sm font-black text-white uppercase">Quiz Master ONLINE</h1><p className="text-[10px] text-teal-100 font-bold opacity-80 uppercase tracking-widest">LTT EDU</p></div>
            </div>
            {/* Close button for mobile */}
            <button className="lg:hidden p-1 hover:bg-white/10 rounded-lg" onClick={() => setIsSidebarOpen(false)}>
              <X className="w-5 h-5 text-white" />
            </button>
         </div>
         <div className="flex-1 py-6 px-4 overflow-y-auto">
            <nav className="space-y-2">
               {sidebarItems.map((item) => {
                  if (user?.role === 'student') {
                      const isVisibleForStudent = ['overview', 'publish', 'scores'].includes(item.id);
                      if (!isVisibleForStudent) return null;
                  }

                  const isActive = activeTab === item.id;
                  return (
                    <button 
                      key={item.id} 
                      onClick={() => {
                        if (!isGuest) {
                          onTabChange(item.id);
                          setIsSidebarOpen(false); // Close sidebar on selection (mobile)
                        }
                      }} 
                      disabled={isGuest && item.id !== 'overview'} 
                      className={`sidebar-btn group transition-all duration-300 ${isActive ? 'bg-white text-[#0D9488] font-bold shadow-lg translate-x-2' : 'text-teal-50 hover:bg-white/10'} ${isGuest && item.id !== 'overview' ? 'opacity-30' : ''}`}
                    >
                       <div className="mr-3">{isGuest && item.id !== 'overview' ? <Lock className="w-4 h-4"/> : <item.icon className="w-5 h-5"/>}</div>
                       <span className="flex-1 text-left">{item.label}</span>
                    </button>
                  );
               })}
            </nav>
         </div>
         <div className="p-4 border-t border-white/20">
             {isGuest ? (
                 <button onClick={onLoginClick} className="w-full flex items-center justify-center gap-2 bg-white text-teal-700 font-bold text-sm p-3 rounded-xl shadow-xl hover:bg-gray-100"><LogIn className="w-4 h-4" /> Đăng nhập</button>
             ) : (
                 <button onClick={onLogoutClick} className="w-full flex items-center gap-3 text-white/90 p-3 hover:bg-white/10 rounded-xl border border-transparent hover:border-white/20 group">
                     <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center group-hover:bg-white/20 uppercase font-black">{user?.name?.charAt(0)}</div>
                     <div className="flex flex-col items-start overflow-hidden"><span className="font-bold text-sm">Đăng xuất</span><span className="text-[11px] text-teal-100 truncate w-full text-left" title={user?.name}>{user?.name}</span></div>
                 </button>
             )}
         </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden w-full">
           <header className="bg-[#0D9488] text-white shadow-2xl m-0 lg:m-4 rounded-b-[20px] lg:rounded-[20px] border-b-2 lg:border-2 border-gray-100 shrink-0 relative">
             {/* Hamburger Menu Button */}
             <button 
               onClick={() => setIsSidebarOpen(true)}
               className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 rounded-lg lg:hidden hover:bg-white/20 transition-colors"
             >
               <Menu className="w-6 h-6 text-white" />
             </button>

             <div className="px-6 py-6 text-center">
                <h1 className="text-xl md:text-2xl lg:text-3xl font-black uppercase tracking-tight">Hệ Thống Thi Trắc Nghiệm Online</h1>
                <h3 className="text-xs md:text-sm lg:text-lg mt-1 opacity-90 font-medium">Thầy Lê Văn Đông - Chuyên Lê Thánh Tông</h3>
             </div>
         </header>
         <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-2">{children}</div>
      </div>
    </div>
  );
};

export const ScoreManager = ({ exams, user, showScoresToStudents = false, onRefresh }: { exams: ExamConfig[], user: UserType | null, showScoresToStudents?: boolean, onRefresh?: () => any }) => {
    const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<StudentResult[]>([]);
    
    // State để giáo viên xem chi tiết bài làm
    const [viewingResult, setViewingResult] = useState<StudentResult | null>(null);

    useEffect(() => {
        // Preload export libraries when entering Score Manager
        loadExternalLibs();
    }, []);

    useEffect(() => {
        if (!selectedExamId && exams.length > 0) {
            setSelectedExamId(String(exams[0].id));
            if (exams[0].results && exams[0].results.length > 0) {
                setResults(exams[0].results);
            }
        }
    }, [exams, selectedExamId]);

    useEffect(() => {
        const fetchResults = async () => {
            if (!selectedExamId) return;
            const cachedExam = exams.find(e => String(e.id) === String(selectedExamId));
            if (cachedExam && cachedExam.results && cachedExam.results.length > 0) {
                setResults(cachedExam.results);
            }
            setLoading(true);
            try {
                const data = await dataService.getResultsByExamId(selectedExamId);
                if (data && data.length > 0) {
                    setResults(data);
                } else if (!cachedExam || !cachedExam.results || cachedExam.results.length === 0) {
                    setResults([]);
                }
            } catch (err) {
                console.error("Lỗi tải bảng điểm:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, [selectedExamId, exams]);

    const isTeacher = user && user.role !== 'student';
    const canSeeScores = isTeacher || showScoresToStudents;

    // Tìm đề thi hiện tại để lấy danh sách câu hỏi khi xem chi tiết
    const currentExam = useMemo(() => exams.find(e => String(e.id) === String(selectedExamId)), [exams, selectedExamId]);

    if (!canSeeScores) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] bg-white rounded-[40px] shadow-xl border border-gray-100 font-poppins text-center p-10 animate-fade-in">
                <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-red-100">
                    <EyeOff className="w-12 h-12" />
                </div>
                <h2 className="text-3xl font-black text-slate-800 mb-4 uppercase">Bảng điểm đang ẩn</h2>
                <p className="text-slate-500 font-bold max-w-md">Giáo viên đã tạm khóa chức năng xem điểm chung. Vui lòng quay lại sau khi kỳ thi kết thúc.</p>
            </div>
        );
    }

    const filteredResults = useMemo(() => {
        return results.filter(r => {
            const name = String(r.name || '').toLowerCase();
            const className = String(r.className || '').toLowerCase();
            const search = searchTerm.toLowerCase();
            return name.includes(search) || className.includes(search);
        });
    }, [results, searchTerm]);

    const currentExamTitle = currentExam?.title || "Báo cáo kết quả";

    const formatTime = (seconds: number) => {
        const p = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${p}p ${s}s`;
    };

    const handleForceRefresh = async () => {
        setLoading(true);
        try {
            if (onRefresh) await onRefresh();
            if (selectedExamId) {
                const data = await dataService.getResultsByExamId(selectedExamId);
                setResults(data);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-10 animate-fade-in font-poppins pb-10 relative">
            {/* Modal xem chi tiết bài làm - Chỉ dành cho giáo viên */}
            {viewingResult && currentExam && (
                <div className="fixed inset-0 z-[100] bg-white overflow-y-auto animate-fade-in">
                    <div className="max-w-7xl mx-auto p-4 md:p-8">
                        <div className="flex items-center gap-4 mb-8">
                            <button 
                                onClick={() => setViewingResult(null)} 
                                className="p-3 bg-gray-100 hover:bg-gray-200 rounded-2xl text-slate-600 transition-all shadow-sm flex items-center gap-2 font-bold"
                            >
                                <ArrowLeft className="w-5 h-5"/> Quay lại bảng điểm
                            </button>
                            <div className="flex flex-col">
                                <h2 className="text-2xl font-black text-slate-800">Chi tiết bài làm: {viewingResult.name}</h2>
                                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Đề thi: {currentExam.title}</p>
                            </div>
                        </div>
                        <ResultScreen 
                            {...viewingResult} 
                            questions={currentExam.questions} 
                            allowReview={true} // Giáo viên luôn được phép xem lại toàn bộ
                            onRetry={() => setViewingResult(null)} 
                        />
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-end px-2">
                <div>
                    <h2 className="text-4xl font-black text-slate-800 tracking-tight">Báo cáo kết quả</h2>
                    <p className="text-base text-slate-400 font-bold mt-2">Bảng xếp hạng và thống kê chi tiết học sinh.</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto items-center">
                    <button 
                        onClick={handleForceRefresh}
                        disabled={loading}
                        className={`p-4 bg-white text-slate-600 rounded-2xl border border-slate-100 shadow-sm transition-all hover:bg-slate-50 ${loading ? 'animate-spin opacity-50' : ''}`}
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                    <div className="relative flex-1 md:w-80">
                        <select 
                            className="w-full p-4 bg-white border-none rounded-2xl outline-none font-bold text-slate-600 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207L10%2012L15%207%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-12 shadow-sm"
                            value={selectedExamId || ''}
                            onChange={(e) => setSelectedExamId(e.target.value)}
                        >
                            {exams.length > 0 ? exams.map(ex => <option key={ex.id} value={ex.id}>{ex.title.toUpperCase()}</option>) : <option>Chưa có đề thi</option>}
                        </select>
                    </div>
                    {isTeacher && (
                      <button 
                          onClick={() => exportResultsToExcel(results, currentExamTitle)}
                          className="px-8 py-4 bg-[#0D9488] text-white rounded-2xl font-black text-sm shadow-xl flex items-center gap-2 hover:bg-teal-700 transition-all transform hover:-translate-y-1 uppercase tracking-widest whitespace-nowrap"
                      >
                          <FileSpreadsheet className="w-5 h-5" /> Xuất Excel
                      </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden shadow-slate-200/50">
                <div className="p-6 border-b border-gray-50 flex items-center gap-4 bg-slate-50/30">
                    <Search className="w-5 h-5 text-slate-300" />
                    <input 
                        type="text" 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        placeholder="Lọc theo tên học sinh hoặc lớp..." 
                        className="flex-1 bg-transparent border-none outline-none font-bold text-slate-600 placeholder:text-slate-300"
                    />
                </div>
                <div className="overflow-x-auto min-h-[300px]">
                    {loading && results.length === 0 ? (
                        <div className="p-20 flex flex-col items-center justify-center">
                            <Loader2 className="w-12 h-12 text-teal-600 animate-spin mb-4" />
                            <p className="text-slate-400 font-black uppercase tracking-widest">Đang tải dữ liệu điểm...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead className="bg-[#f8fafc] text-slate-400 font-black text-[11px] uppercase tracking-[0.1em]">
                                <tr>
                                    <th className="p-3 md:p-6 md:pl-10">Top</th>
                                    <th className="p-3 md:p-6">Họ và tên</th>
                                    <th className="p-3 md:p-6">Lớp</th>
                                    <th className="p-3 md:p-6">Điểm</th>
                                    <th className="p-3 md:p-6 whitespace-nowrap">Đúng/Sai</th>
                                    <th className="p-3 md:p-6 whitespace-nowrap">Thời gian</th>
                                    <th className="p-3 md:p-6 text-center md:pr-10">Xem</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {filteredResults.length > 0 ? (
                                    filteredResults.sort((a,b) => (b.score ?? 0) - (a.score ?? 0)).map((res, idx) => (
                                        <tr key={res.id} className="student-row group hover:bg-slate-50/50 transition-colors">
                                            <td className="p-3 md:p-6 md:pl-10">
                                                <div className={`rank-badge ${idx === 0 ? 'rank-1' : 'rank-default'}`}>{idx + 1}</div>
                                            </td>
                                            <td className="p-3 md:p-6 font-black text-slate-800 text-sm md:text-lg min-w-[120px]">{res.name}</td>
                                            <td className="p-3 md:p-6"><span className="px-2 md:px-3 py-1 bg-gray-100 text-gray-500 text-[10px] font-black rounded-lg uppercase">{res.className}</span></td>
                                            <td className="p-3 md:p-6"><span className="score-text text-xl md:text-3xl">{(res.score ?? 0).toFixed(2)}</span></td>
                                            <td className="p-3 md:p-6">
                                                <div className="flex items-center gap-2 font-black text-sm md:text-lg whitespace-nowrap">
                                                    <span className="text-green-500">{res.counts?.correct || 0}</span>
                                                    <span className="text-slate-200">/</span>
                                                    <span className="text-red-500">{res.counts?.wrong || 0}</span>
                                                </div>
                                            </td>
                                            <td className="p-3 md:p-6 text-slate-400 font-bold text-xs md:text-sm tracking-tight whitespace-nowrap">{formatTime(res.timeSpent || 0)}</td>
                                            <td className="p-3 md:p-6 text-center md:pr-10">
                                                {/* Hiển thị biểu tượng con mắt cho tất cả người dùng, nhưng khóa đối với học sinh */}
                                                <button 
                                                    onClick={() => {
                                                        if (isTeacher) {
                                                            setViewingResult(res);
                                                        } else {
                                                            alert("Chi tiết bài làm chỉ dành cho giáo viên kiểm tra.");
                                                        }
                                                    }}
                                                    className={`w-8 h-8 md:w-10 md:h-10 rounded-full border flex items-center justify-center transition-all shadow-sm ${
                                                        isTeacher 
                                                        ? 'border-slate-100 text-slate-300 hover:text-teal-600 hover:border-teal-100' 
                                                        : 'border-slate-100 text-slate-200 bg-gray-50/50 cursor-not-allowed'
                                                    }`}
                                                    title={isTeacher ? "Xem chi tiết bài làm" : "Chức năng bị khóa đối với học sinh"}
                                                >
                                                    {isTeacher ? (
                                                        <Eye className="w-4 h-4 md:w-5 md:h-5" />
                                                    ) : (
                                                        <div className="relative">
                                                            <Eye className="w-4 h-4 md:w-5 md:h-5 opacity-30" />
                                                            <Lock className="w-2 md:w-2.5 h-2 md:h-2.5 absolute -top-1 -right-1 text-red-400" />
                                                        </div>
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="p-20 text-center text-slate-400 font-bold italic">
                                            {loading ? "Đang đồng bộ..." : "Chưa có dữ liệu bài thi cho đề này. Hãy kiểm tra lại sau hoặc nhấn Làm mới."}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export const ExamList = ({ exams, onSelectExam, onDeleteExam, onPlayExam, onPublish, onUnpublish, onCreate, onResetResults }: any) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');

  useEffect(() => {
    // Đảm bảo thư viện docx được tải sẵn sàng khi vào màn hình danh sách đề thi
    loadExternalLibs();
  }, []);

  // Tự động lấy danh sách lớp duy nhất từ các đề thi
  const uniqueClasses = useMemo(() => {
    const classes = new Set(exams.map((e: any) => e.className).filter(Boolean));
    return Array.from(classes).sort();
  }, [exams]);

  // Lọc danh sách đề thi dựa trên tìm kiếm và lớp
  const filteredExams = useMemo(() => {
    return exams.filter((exam: any) => {
        const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesClass = selectedClass === 'all' || exam.className === selectedClass;
        return matchesSearch && matchesClass;
    });
  }, [exams, searchTerm, selectedClass]);

  return (
    <div className="space-y-8 animate-fade-in font-poppins pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Kho đề thi</h2>
          <p className="text-slate-400 font-bold mt-1">Quản lý và chỉnh sửa nội dung bài thi của bạn.</p>
        </div>
        <button onClick={onCreate} className="w-full md:w-auto px-8 py-4 bg-[#0D9488] text-white rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 hover:bg-teal-700 transition-all transform hover:-translate-y-1 uppercase tracking-widest">
           <Plus className="w-5 h-5" /> Tạo đề thi mới
        </button>
      </div>

      {/* Bộ lọc và Tìm kiếm */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-[24px] shadow-sm border border-gray-100">
         <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo tên đề thi..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-slate-600 focus:bg-white focus:border-teal-500 transition-all placeholder:text-slate-400"
            />
         </div>
         <div className="md:w-64 relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select 
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full pl-12 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-slate-600 focus:bg-white focus:border-teal-500 transition-all appearance-none cursor-pointer"
            >
              <option value="all">Tất cả các lớp</option>
              {uniqueClasses.map((cls: any) => (
                <option key={cls} value={cls}>Lớp {cls}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronRight className="w-4 h-4 text-slate-400 rotate-90" />
            </div>
         </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredExams.length > 0 ? filteredExams.map((exam: any) => {
          const isPublished = exam.securityCode && exam.securityCode.trim().length > 0;
          return (
            <div key={exam.id} className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:border-teal-200 flex flex-col relative group">
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-teal-50 text-teal-600 text-[10px] font-black rounded-lg uppercase tracking-widest">{exam.code}</span>
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg uppercase tracking-widest">{exam.className}</span>
                </div>
                {isPublished && (
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                )}
              </div>
              
              <h3 className="text-xl font-black text-slate-800 mb-4 leading-tight line-clamp-2">{exam.title}</h3>
              
              <div className="flex items-center gap-4 text-slate-500 text-xs font-bold mb-6 pb-6 border-b border-slate-100 border-dashed">
                 <span className="flex items-center gap-1.5"><List className="w-4 h-4 text-slate-400" /> {exam.questions?.length || 0} câu</span>
                 <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400" /> {exam.duration}p</span>
                 <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-slate-400" /> {exam.results?.length || 0}</span>
              </div>
              
              <div className="grid grid-cols-4 gap-2 mb-6">
                 <button onClick={() => onPlayExam(exam)} className="flex flex-col items-center justify-center gap-1.5 py-3 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition-colors">
                    <PlayCircle className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Thi</span>
                 </button>
                 <button onClick={() => onSelectExam(exam)} className="flex flex-col items-center justify-center gap-1.5 py-3 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition-colors">
                    <Edit className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Sửa</span>
                 </button>
                 {isPublished ? (
                   <button onClick={() => onUnpublish(exam)} className="flex flex-col items-center justify-center gap-1.5 py-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-colors">
                      <EyeOff className="w-5 h-5" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Dừng</span>
                   </button>
                 ) : (
                   <button onClick={() => onPublish(exam)} className="flex flex-col items-center justify-center gap-1.5 py-3 bg-teal-50 text-teal-600 rounded-2xl hover:bg-teal-100 transition-colors">
                      <Share2 className="w-5 h-5" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Phát</span>
                   </button>
                 )}
                 <button onClick={() => onDeleteExam(exam.id)} className="flex flex-col items-center justify-center gap-1.5 py-3 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition-colors">
                    <Trash2 className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Xóa</span>
                 </button>
              </div>
              
              <div className="flex justify-between items-center mt-auto">
                 <button onClick={() => exportExamToDocx(exam)} className="flex items-center gap-1.5 text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-600 transition-colors">
                    <Download className="w-3.5 h-3.5" /> Tải đề gốc
                 </button>
                 <button onClick={() => onResetResults && onResetResults(exam.id)} className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">
                    <RotateCcw className="w-3.5 h-3.5" /> Reset KQ
                 </button>
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full py-20 text-center bg-white rounded-[40px] border border-dashed border-slate-200">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300"><FileText className="w-10 h-10"/></div>
             <p className="text-slate-400 font-bold">
               {exams.length === 0 
                 ? "Chưa có đề thi nào. Hãy bắt đầu bằng cách tạo mới!" 
                 : "Không tìm thấy đề thi nào phù hợp với bộ lọc."}
             </p>
          </div>
        )}
      </div>
    </div>
  );
};

export const StudentManager = ({ students, onAddStudent, onEditStudent, onDeleteStudent, onImportStudents, onApproveStudent }: any) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const filteredStudents = useMemo(() => {
    return students.filter((s: Student) => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.className?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  return (
    <div className="space-y-8 animate-fade-in font-poppins pb-10">
      {showAdd && <StudentModal onClose={() => setShowAdd(false)} onSave={(s: any) => { onAddStudent(s); setShowAdd(false); }} />}
      {editingStudent && <StudentModal student={editingStudent} onClose={() => setEditingStudent(null)} onSave={(s: any) => { onEditStudent(s); setEditingStudent(null); }} />}
      {showImport && <ImportStudentModal onClose={() => setShowImport(false)} onImport={onImportStudents} />}
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Quản lý học sinh</h2>
           <p className="text-slate-400 font-bold mt-1">Danh sách học sinh và kiểm duyệt tài khoản.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
           <button onClick={() => setShowImport(true)} className="px-6 py-3 bg-white text-teal-600 border border-teal-100 rounded-xl font-bold text-sm shadow-sm hover:bg-teal-50 flex items-center gap-2 transition-all">
               <UploadCloud className="w-5 h-5"/> Import Excel
           </button>
           <button onClick={() => setShowAdd(true)} className="px-6 py-3 bg-[#0D9488] text-white rounded-xl font-bold text-sm shadow-xl flex items-center gap-2 hover:bg-teal-700 transition-all transform hover:-translate-y-1">
               <UserPlus className="w-5 h-5"/> Thêm học sinh
           </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden">
         <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50">
             <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Tìm tên, lớp, email..." 
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-600 focus:border-teal-500 transition-all placeholder:text-slate-300"
                />
             </div>
             <button onClick={() => exportStudentsToExcel(students)} className="text-teal-600 font-bold text-xs uppercase hover:underline flex items-center gap-1">
                <FileSpreadsheet className="w-4 h-4"/> Xuất danh sách
             </button>
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                  <tr>
                     <th className="p-4 pl-8 w-16 text-center">STT</th>
                     <th className="p-4">Họ và tên</th>
                     <th className="p-4">Lớp</th>
                     <th className="p-4">Email / Tài khoản</th>
                     <th className="p-4 text-center">Trạng thái</th>
                     <th className="p-4 text-right pr-8">Thao tác</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {filteredStudents.map((s: Student, index: number) => (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="p-4 pl-8 text-center">
                              <span className="font-bold text-slate-400">{index + 1}</span>
                          </td>
                          <td className="p-4">
                              <span className="font-bold text-slate-700">{s.name}</span>
                          </td>
                          <td className="p-4"><span className="bg-gray-100 text-gray-500 px-2 py-1 rounded-lg text-xs font-bold">{s.className}</span></td>
                          <td className="p-4 text-sm font-medium text-slate-500">{s.email || '--'}</td>
                          <td className="p-4 text-center">
                              <button 
                                onClick={() => onApproveStudent(s.email, s.id, !s.isApproved)}
                                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border transition-all ${s.isApproved ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-red-50 hover:text-red-600 hover:border-red-100' : 'bg-orange-50 text-orange-600 border-orange-100 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100'}`}
                              >
                                {s.isApproved ? 'Đã duyệt' : 'Chờ duyệt'}
                              </button>
                          </td>
                          <td className="p-4 text-right pr-8">
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => setEditingStudent(s)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg"><Edit className="w-4 h-4"/></button>
                                  <button onClick={() => onDeleteStudent(s.id, s.email)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash className="w-4 h-4"/></button>
                              </div>
                          </td>
                      </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                      <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-bold italic">Không tìm thấy học sinh nào.</td></tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export const PublishView = ({ exams, onPlayExam, user }: any) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    
    // Filter exams that have a security code (published)
    const publishedExams = useMemo(() => {
        return exams.filter((e: ExamConfig) => {
            if (!e.securityCode || e.securityCode.trim().length === 0) return false;
            const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  (e.className && e.className.toLowerCase().includes(searchTerm.toLowerCase()));
            return matchesSearch;
        });
    }, [exams, searchTerm]);

    const formatDateTime = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    };

    const getCountdown = (startTimeStr: string) => {
        const startTime = new Date(startTimeStr).getTime();
        const diff = startTime - now.getTime();
        
        if (diff <= 0) return null;
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        return { hours, minutes, seconds };
    };

    return (
        <div className="space-y-8 animate-fade-in font-poppins max-w-6xl mx-auto pb-20">
             <div className="space-y-2 pt-6">
                 <h2 className="text-3xl font-black text-slate-800 tracking-tight">Phòng Thi Trực Tuyến</h2>
                 <p className="text-slate-500 font-bold">Danh sách các kỳ thi đang diễn ra.</p>
             </div>
             
             <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                     <Search className="h-5 w-5 text-slate-400" />
                 </div>
                 <input 
                    type="text" 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm theo tên đề hoặc lớp..." 
                    className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none font-medium text-slate-700 placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 ring-teal-50 transition-all shadow-sm"
                 />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publishedExams.map((exam: ExamConfig) => {
                    const isUpcoming = exam.gradingConfig?.startTime && new Date(exam.gradingConfig.startTime).getTime() > now.getTime();
                    const countdown = isUpcoming ? getCountdown(exam.gradingConfig!.startTime!) : null;

                    return (
                        <div key={exam.id} className="bg-white rounded-[24px] border border-gray-100 shadow-sm hover:shadow-xl transition-all flex flex-col overflow-hidden relative pt-2">
                             <div className={`absolute top-0 left-0 w-full h-2 ${isUpcoming ? 'bg-yellow-500' : 'bg-teal-500'}`}></div>
                             <div className="p-6 flex-1 flex flex-col">
                                 <div className="flex justify-between items-center mb-4">
                                     <div className="flex gap-2">
                                         <span className="bg-teal-50 text-teal-700 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">MÃ ĐỀ: {exam.code}</span>
                                         <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">LỚP: {exam.className}</span>
                                     </div>
                                     {isUpcoming ? (
                                         <span className="flex items-center gap-1 bg-yellow-50 text-yellow-600 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider border border-yellow-100">
                                             <Hourglass className="w-3 h-3" /> SẮP MỞ
                                         </span>
                                     ) : (
                                         <span className="flex items-center gap-1 bg-red-50 text-red-500 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider border border-red-100">
                                             <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div> LIVE
                                         </span>
                                     )}
                                 </div>
                                 
                                 <h4 className="text-xl font-black text-slate-800 mb-4 line-clamp-2">{exam.title}</h4>
                                 
                                 <div className="flex gap-4 text-xs font-bold text-slate-500 mb-6">
                                     <span className="flex items-center gap-1.5"><List className="w-4 h-4 text-teal-500"/> {exam.questions.length} câu</span>
                                     <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-teal-500"/> {exam.duration} phút</span>
                                 </div>
                                 
                                 {isUpcoming && countdown ? (
                                     <div className="mt-auto bg-yellow-50/50 rounded-xl p-4 mb-6 border border-yellow-100 text-center">
                                         <div className="text-[10px] font-black text-yellow-600 uppercase tracking-widest mb-2">
                                             Tự động mở sau
                                         </div>
                                         <div className="text-xl font-black text-yellow-600 flex justify-center items-baseline gap-1">
                                             {countdown.hours > 0 && <><span className="text-2xl">{countdown.hours}</span><span className="text-sm">h</span></>}
                                             <span className="text-2xl">{countdown.minutes}</span><span className="text-sm">m</span>
                                             <span className="text-2xl">{countdown.seconds}</span><span className="text-sm">s</span>
                                         </div>
                                     </div>
                                 ) : (
                                     <div className="mt-auto bg-slate-50 rounded-xl p-3 mb-6 border border-slate-100">
                                         <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                             <Calendar className="w-3.5 h-3.5" /> Thời gian mở đề
                                         </div>
                                         <div className="text-xs font-bold text-slate-700">
                                             {exam.gradingConfig?.startTime ? formatDateTime(exam.gradingConfig.startTime) : 'Không giới hạn'} 
                                             {exam.gradingConfig?.endTime ? ` ➔ ${formatDateTime(exam.gradingConfig.endTime)}` : ''}
                                         </div>
                                     </div>
                                 )}
                                 
                                 {isUpcoming ? (
                                     <button 
                                        disabled
                                        className="w-full py-3.5 bg-yellow-100 text-yellow-600 font-bold rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
                                     >
                                        <Clock className="w-5 h-5"/> ĐANG CHỜ MỞ ĐỀ
                                     </button>
                                 ) : (
                                     <button 
                                        onClick={() => onPlayExam(exam, exam.securityCode)}
                                        className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                     >
                                        <PlayCircle className="w-5 h-5"/> VÀO THI NGAY
                                     </button>
                                 )}
                             </div>
                        </div>
                    );
                })}
                
                {publishedExams.length === 0 && (
                    <div className="col-span-full py-20 text-center">
                        <div className="inline-block p-4 bg-slate-50 rounded-full mb-4"><Search className="w-8 h-8 text-slate-300" /></div>
                        <h3 className="text-lg font-bold text-slate-600">Không tìm thấy kỳ thi nào</h3>
                        <p className="text-slate-400 text-sm mt-1">Vui lòng thử lại với từ khóa khác hoặc liên hệ giáo viên.</p>
                    </div>
                )}
             </div>
        </div>
    );
};

export const ExamEditor = ({ exam, onUpdate, onBack, onPublish, initialShowImport }: { exam: ExamConfig, onUpdate: (e: ExamConfig) => void, onBack: () => void, onPublish: () => void, initialShowImport?: boolean }) => {
    const [localExam, setLocalExam] = useState<ExamConfig>(exam);
    const [editingQ, setEditingQ] = useState<Question | null>(null);
    const [showImport, setShowImport] = useState(initialShowImport || false);
    
    // Sync local state when prop changes, but only if IDs match (to avoid overwriting work in progress if parent updates unexpectedly)
    useEffect(() => {
        if (exam.id === localExam.id) {
            // We might want to sync, but usually editor state is source of truth until saved.
            // Let's just initialize.
        }
    }, [exam.id]);

    const handleSave = () => {
        onUpdate(localExam);
    };

    const addQuestion = (type: 'choice' | 'text' | 'group') => {
        const newQ: Question = {
            id: Date.now(),
            type,
            question: '',
            options: type === 'choice' ? ['', '', '', ''] : undefined,
            answer: '',
            subQuestions: type === 'group' ? [] : undefined,
            section: 'PHẦN I. TRẮC NGHIỆM KHÁCH QUAN'
        };
        const updated = { ...localExam, questions: [...localExam.questions, newQ] };
        setLocalExam(updated);
        setEditingQ(newQ);
    };

    const updateQuestion = (q: Question) => {
        const updatedQs = localExam.questions.map(item => item.id === q.id ? q : item);
        setLocalExam({ ...localExam, questions: updatedQs });
        setEditingQ(null);
    };

    const deleteQuestion = (id: number) => {
        if (!confirm("Bạn có chắc muốn xóa câu hỏi này?")) return;
        const updatedQs = localExam.questions.filter(q => q.id !== id);
        setLocalExam({ ...localExam, questions: updatedQs });
    };

    const handleImport = (importedQs: Question[]) => {
        setLocalExam({ ...localExam, questions: [...localExam.questions, ...importedQs] });
        setShowImport(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 font-poppins pb-20">
            {editingQ && <EditQuestionModal question={editingQ} onSave={updateQuestion} onClose={() => setEditingQ(null)} />}
            {showImport && <ImportModal onClose={() => setShowImport(false)} onImport={handleImport} />}

            <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm px-4 py-3">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-slate-500 transition-colors"><ArrowLeft className="w-6 h-6"/></button>
                        <div>
                            <input 
                                type="text" 
                                value={localExam.title} 
                                onChange={e => setLocalExam({...localExam, title: e.target.value})}
                                className="text-lg md:text-xl font-black text-slate-800 bg-transparent outline-none placeholder:text-slate-300 w-full md:w-96 truncate"
                                placeholder="Nhập tên đề thi..."
                            />
                            <div className="flex gap-3 text-xs font-bold text-slate-400">
                                <span>{localExam.questions.length} câu hỏi</span>
                                <span>•</span>
                                <span>{localExam.duration} phút</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowImport(true)} className="hidden md:flex px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm items-center gap-2 hover:bg-indigo-100 transition-all border border-indigo-100">
                            <UploadCloud className="w-4 h-4"/> Import
                        </button>
                        <button onClick={handleSave} className="px-6 py-2 bg-teal-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-teal-700 transition-all flex items-center gap-2">
                            <Check className="w-4 h-4"/> Lưu
                        </button>
                        <button onClick={onPublish} className="hidden md:flex px-4 py-2 bg-slate-800 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-slate-900 transition-all items-center gap-2">
                            <Share2 className="w-4 h-4"/> Xuất bản
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
                {localExam.questions.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-gray-200">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300"><FileText className="w-12 h-12"/></div>
                        <h3 className="text-2xl font-black text-slate-700 mb-2">Đề thi chưa có câu hỏi nào</h3>
                        <p className="text-slate-400 font-medium mb-8">Hãy bắt đầu bằng cách thêm thủ công hoặc import từ file Word.</p>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => addQuestion('choice')} className="px-6 py-3 bg-white border border-gray-200 text-slate-600 font-bold rounded-xl shadow-sm hover:border-teal-500 hover:text-teal-600 transition-all">Thêm câu hỏi</button>
                            <button onClick={() => setShowImport(true)} className="px-6 py-3 bg-teal-600 text-white font-bold rounded-xl shadow-lg hover:bg-teal-700 transition-all">Import từ Word</button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {localExam.questions.map((q, idx) => {
                            const showSection = idx === 0 || q.section !== localExam.questions[idx - 1].section;
                            const sectionName = q.section || 'PHẦN I. TRẮC NGHIỆM KHÁCH QUAN';
                            
                            return (
                                <React.Fragment key={q.id}>
                                    {showSection && (
                                        <div className="flex justify-center my-6">
                                            <div className="px-6 py-2 bg-teal-50 border border-teal-200 text-teal-700 font-bold rounded-full text-sm uppercase tracking-wide">
                                                {sectionName}
                                            </div>
                                        </div>
                                    )}
                                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-4 relative group">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="px-4 py-1.5 bg-teal-700 text-white font-bold rounded-full text-sm">
                                                Câu {idx + 1}
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => setEditingQ(q)} className="px-4 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-xs font-bold hover:bg-orange-100 transition-colors">Sửa</button>
                                                <button onClick={() => deleteQuestion(q.id)} className="px-4 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors">Xóa</button>
                                            </div>
                                        </div>
                                        <div className="text-slate-800 font-medium mb-4 quiz-question-container">
                                            <MathRenderer text={q.question} allowMarkdown={true} />
                                            {q.image && (
                                                <div className="mt-4">
                                                    <img src={q.image} alt="Question" className="max-h-64 rounded-lg border border-gray-200 shadow-sm object-contain" />
                                                </div>
                                            )}
                                        </div>
                                        {q.type === 'choice' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {q.options?.map((opt, i) => {
                                                    const isSelected = opt === q.answer;
                                                    return (
                                                        <div key={i} className={`flex flex-col p-3 rounded-xl border ${isSelected ? 'border-2 border-teal-600 bg-teal-50' : 'border-gray-200 bg-white'}`}>
                                                            <div className="flex items-center">
                                                                <span className={`font-bold mr-3 ${isSelected ? 'text-teal-600' : 'text-gray-400'}`}>{String.fromCharCode(65+i)}.</span>
                                                                <span className={isSelected ? 'text-teal-800' : 'text-slate-700'}><MathRenderer text={opt} allowMarkdown={true}/></span>
                                                            </div>
                                                            {q.optionImages && q.optionImages[i] && (
                                                                <div className="mt-3 ml-7">
                                                                    <img src={q.optionImages[i]} alt={`Option ${String.fromCharCode(65+i)}`} className="max-h-32 rounded border border-gray-200 object-contain" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {q.type === 'group' && (
                                            <div className="space-y-2 mt-2">
                                                {q.subQuestions?.map((sub, i) => (
                                                    <div key={i} className="text-sm flex flex-col gap-2 p-3 rounded-xl border border-gray-200 bg-white">
                                                        <div className="flex items-start gap-3">
                                                            <span className="font-bold text-gray-400">{String.fromCharCode(97+i)})</span>
                                                            <span className="flex-1 text-slate-700"><MathRenderer text={sub.content} allowMarkdown={true}/></span>
                                                            <span className={`text-xs font-black px-3 py-1 rounded-lg ${sub.correctAnswer ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{sub.correctAnswer ? 'ĐÚNG' : 'SAI'}</span>
                                                        </div>
                                                        {sub.image && (
                                                            <div className="mt-2 ml-7">
                                                                <img src={sub.image} alt={`Subquestion ${String.fromCharCode(97+i)}`} className="max-h-32 rounded border border-gray-200 object-contain" />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {q.type === 'text' && (
                                            <div className="mt-2 p-4 bg-yellow-50 border border-yellow-100 rounded-xl text-sm text-yellow-800 font-medium">
                                                <span className="font-black uppercase text-xs mr-2">Đáp án:</span> {q.answer}
                                            </div>
                                        )}
                                    </div>
                                </React.Fragment>
                            );
                        })}
                        
                        <div className="flex flex-wrap justify-center gap-4 mt-8 pt-4">
                            <button onClick={() => addQuestion('choice')} className="px-6 py-2.5 bg-teal-600 text-white font-bold rounded-full shadow-md hover:bg-teal-700 flex items-center gap-2 transition-all">
                                + TRẮC NGHIỆM
                            </button>
                            <button onClick={() => addQuestion('group')} className="px-6 py-2.5 bg-indigo-500 text-white font-bold rounded-full shadow-md hover:bg-indigo-600 flex items-center gap-2 transition-all">
                                + ĐÚNG/SAI
                            </button>
                            <button onClick={() => addQuestion('text')} className="px-6 py-2.5 bg-slate-800 text-white font-bold rounded-full shadow-md hover:bg-slate-900 flex items-center gap-2 transition-all">
                                + TRẢ LỜI NGẮN
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};