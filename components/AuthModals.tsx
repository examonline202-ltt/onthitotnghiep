
import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, Loader2, ShieldCheck, Mail, UserPlus, CheckCircle2, GraduationCap, Info, XCircle } from 'lucide-react';
import { authService } from '../services/auth';
import { User as UserType } from '../types';

interface LoginModalProps {
    onClose: () => void;
    onLoginSuccess: (user: UserType) => void;
}

export const LoginModal = ({ onClose, onLoginSuccess }: LoginModalProps) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [role, setRole] = useState<'teacher' | 'student'>('student');
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [className, setClassName] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [infoMsg, setInfoMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        setInfoMsg('');
        setLoading(true);

        try {
            if (isRegistering) {
                // Kiểm tra ràng buộc cho học sinh
                if (role === 'student' && !className.trim()) {
                    throw new Error("Vui lòng nhập tên lớp học.");
                }

                await authService.register(email.trim(), password.trim(), fullName.trim(), role, className.trim());
                const msg = role === 'teacher' 
                    ? 'Đăng ký thành công! Vui lòng chờ Quản trị viên hệ thống phê duyệt tài khoản giáo viên của bạn.' 
                    : 'Đăng ký thành công! Bạn đã được thêm vào danh sách chờ duyệt. Vui lòng liên hệ giáo viên để được vào thi.';
                setSuccessMsg(msg);
                setIsRegistering(false);
            } else {
                const user = await authService.login(email.trim(), password.trim(), role);
                if (user) {
                    onLoginSuccess(user);
                }
            }
        } catch (err: any) {
            setError(err.message || (isRegistering ? 'Đăng ký thất bại' : 'Đăng nhập thất bại'));
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = () => {
        setInfoMsg("Bạn hãy liên hệ giáo viên để được reset mật khẩu !");
        setError('');
        setSuccessMsg('');
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in font-poppins p-4">
            <div className="bg-white w-full max-w-[420px] rounded-[30px] shadow-2xl p-8 relative overflow-hidden">
                {/* Close Button for the whole modal */}
                <button 
                    onClick={onClose} 
                    className="absolute top-6 right-6 text-gray-300 hover:text-gray-500 transition-colors z-10"
                >
                    <XCircle className="w-7 h-7" />
                </button>

                {/* Decoration Line */}
                <div className={`absolute top-0 left-0 w-full h-2 transition-all duration-500 ${role === 'teacher' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>

                <div className="text-center mb-8">
                    <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg transform rotate-3 transition-all duration-500 ${role === 'teacher' ? 'bg-emerald-500 shadow-emerald-200' : 'bg-blue-500 shadow-blue-200'}`}>
                        {isRegistering ? <UserPlus className="w-10 h-10 text-white" /> : <Lock className="w-10 h-10 text-white" />}
                    </div>
                    <h2 className="text-3xl font-black text-gray-800 tracking-tight">
                        {isRegistering ? 'Tạo tài khoản' : 'Trang Đăng Nhập'}
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        {isRegistering ? 'Điền thông tin bên dưới để bắt đầu' : 'Dành cho Thí sinh và Giáo viên'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* Role Tabs */}
                    <div className="bg-gray-100 p-1.5 rounded-2xl flex gap-1 mb-2">
                        <button 
                            type="button"
                            onClick={() => { setRole('student'); setError(''); setInfoMsg(''); setSuccessMsg(''); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${role === 'student' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <User className="w-4 h-4" /> Học sinh
                        </button>
                        <button 
                            type="button"
                            onClick={() => { setRole('teacher'); setError(''); setInfoMsg(''); setSuccessMsg(''); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${role === 'teacher' ? 'bg-white text-emerald-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <ShieldCheck className="w-4 h-4" /> Giáo viên
                        </button>
                    </div>

                    {error && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold text-center animate-pulse">
                            {error}
                        </div>
                    )}

                    {successMsg && (
                        <div className="p-4 rounded-xl bg-green-50 border border-green-100 text-green-700 text-xs font-bold text-center flex flex-col items-center gap-2">
                            <CheckCircle2 className="w-8 h-8 shrink-0 text-green-500" /> 
                            <span>{successMsg}</span>
                        </div>
                    )}

                    {infoMsg && (
                        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold text-center flex flex-col items-center gap-2 animate-in slide-in-from-top-2">
                            <Info className="w-8 h-8 shrink-0 text-blue-500" /> 
                            <span>{infoMsg}</span>
                        </div>
                    )}

                    {isRegistering && (
                        <div className="animate-in fade-in slide-in-from-left-2">
                            <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1 ml-1">Họ và tên</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className={`h-5 w-5 transition-colors ${role === 'teacher' ? 'group-focus-within:text-emerald-500' : 'group-focus-within:text-blue-500'} text-gray-400`} />
                                </div>
                                <input
                                    type="text"
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 font-bold focus:outline-none focus:bg-white transition-all placeholder-gray-400"
                                    placeholder="Nguyễn Văn A"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required={isRegistering}
                                />
                            </div>
                        </div>
                    )}

                    {isRegistering && role === 'student' && (
                        <div className="animate-in fade-in slide-in-from-left-2">
                            <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1 ml-1">Lớp học</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <GraduationCap className={`h-5 w-5 transition-colors group-focus-within:text-blue-500 text-gray-400`} />
                                </div>
                                <input
                                    type="text"
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 font-bold focus:outline-none focus:bg-white transition-all placeholder-gray-400"
                                    placeholder="12A1, 10C3..."
                                    value={className}
                                    onChange={(e) => setClassName(e.target.value)}
                                    required={isRegistering && role === 'student'}
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1 ml-1">Email</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail className={`h-5 w-5 transition-colors ${role === 'teacher' ? 'group-focus-within:text-emerald-500' : 'group-focus-within:text-blue-500'} text-gray-400`} />
                            </div>
                            <input
                                type="email"
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 font-bold focus:outline-none focus:bg-white transition-all placeholder-gray-400"
                                placeholder="example@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1 ml-1">Mật khẩu</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className={`h-5 w-5 transition-colors ${role === 'teacher' ? 'group-focus-within:text-emerald-500' : 'group-focus-within:text-blue-500'} text-gray-400`} />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 font-bold focus:outline-none focus:bg-white transition-all placeholder-gray-400"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    {!isRegistering && (
                        <div className="flex items-center justify-between mt-1">
                            <label className="flex items-center">
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 accent-blue-500" />
                                <span className="ml-2 text-xs text-gray-600 font-medium">Ghi nhớ</span>
                            </label>
                            <button 
                                type="button" 
                                onClick={handleForgotPassword}
                                className="text-xs font-bold text-blue-500 hover:text-blue-700 transition-colors"
                            >
                                Quên mật khẩu?
                            </button>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 rounded-2xl font-black text-white text-lg shadow-lg transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 mt-4
                            ${role === 'teacher' 
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-100' 
                                : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-blue-100'
                            }
                        `}
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (isRegistering ? 'Đăng ký ngay' : 'Đăng nhập')}
                    </button>
                </form>

                <div className="mt-6 text-center space-y-3">
                    <p className="text-sm text-gray-500 font-medium">
                        {isRegistering ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
                        <button 
                            onClick={() => { setIsRegistering(!isRegistering); setError(''); setSuccessMsg(''); setInfoMsg(''); }}
                            className={`ml-1 font-bold hover:underline ${role === 'teacher' ? 'text-emerald-600' : 'text-blue-600'}`}
                        >
                            {isRegistering ? 'Đăng nhập ngay' : 'Đăng ký'}
                        </button>
                    </p>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xs font-bold transition-colors">
                        Quay lại trang chủ
                    </button>
                </div>
            </div>
        </div>
    );
};
