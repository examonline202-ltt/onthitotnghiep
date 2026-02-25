
import { createClient } from '@supabase/supabase-js';
import { supabase, supabaseUrl, supabaseAnonKey } from './supabase';
import { User, UserRole } from '../types';

// Client tạm thời để đăng ký học sinh mà không làm gián đoạn session của giáo viên
const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
    }
});

export const authService = {
    async login(identifier: string, password: string, role: UserRole): Promise<User | null> {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: identifier.trim().toLowerCase(),
            password: password,
        });

        if (error) throw error;
        if (!data.user) return null;

        // Lấy thông tin từ bảng profiles
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

        // Bổ sung kiểm tra bảng students nếu là học sinh (hoặc role được chọn là học sinh)
        let studentRecord = null;
        const effectiveRole = (profile?.role || data.user.user_metadata?.role) as UserRole || role;
        
        if (effectiveRole === 'student') {
            const { data: stData } = await supabase
                .from('students')
                .select('*')
                .eq('id', data.user.id)
                .maybeSingle();
            studentRecord = stData;
        }

        const userData: User = {
            id: data.user.id,
            username: profile?.username || data.user.email?.split('@')[0] || '',
            name: profile?.full_name || studentRecord?.name || data.user.user_metadata?.full_name || 'Người dùng',
            email: data.user.email || '',
            role: effectiveRole,
            className: profile?.class_name || studentRecord?.class_name || data.user.user_metadata?.class_name,
            school: profile?.school,
            // Ưu tiên trạng thái từ profile, sau đó đến students, cuối cùng là metadata
            isApproved: profile?.is_approved ?? studentRecord?.is_approved ?? data.user.user_metadata?.is_approved ?? false
        };

        if (userData.isApproved === false) {
            await supabase.auth.signOut();
            const message = (userData.role === 'teacher' || userData.role === 'admin')
                ? "Tài khoản giáo viên của bạn đang chờ Quản trị viên hệ thống phê duyệt." 
                : "Tài khoản của bạn đang chờ giáo viên phê duyệt. Vui lòng quay lại sau.";
            throw new Error(message);
        }

        return userData;
    },

    async register(email: string, password: string, fullName: string, role: UserRole, className?: string): Promise<void> {
        const isApprovedInit = false; 
        
        const { data, error } = await supabase.auth.signUp({
            email: email.trim().toLowerCase(),
            password: password.trim(),
            options: {
                data: {
                    full_name: fullName.trim(),
                    role: role,
                    class_name: className?.trim() || 'Chưa xếp lớp',
                    is_approved: isApprovedInit
                }
            }
        });
        
        if (error) throw new Error(error.message);

        if (role === 'student' && data.user) {
            await this.syncStudentData(data.user.id, email, fullName, className, isApprovedInit);
        }
    },

    async adminCreateStudent(email: string, password: string, fullName: string, className: string): Promise<void> {
        const { data, error } = await tempClient.auth.signUp({
            email: email.trim().toLowerCase(),
            password: password.trim(),
            options: {
                data: {
                    full_name: fullName.trim(),
                    role: 'student',
                    class_name: className.trim(),
                    is_approved: true
                }
            }
        });

        if (error) throw new Error("Lỗi tạo tài khoản Auth: " + error.message);
        if (data.user) {
            await this.syncStudentData(data.user.id, email, fullName, className, true);
        }
    },

    async adminUpdateStudentPassword(email: string, newPassword: string): Promise<void> {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
            redirectTo: window.location.origin
        });
        if (error) throw new Error("Lỗi hệ thống Auth: " + error.message);
        alert(`Hệ thống đã gửi email hướng dẫn đặt lại mật khẩu tới hòm thư: ${email}`);
    },

    async syncStudentData(userId: string, email: string, name: string, className: string | undefined, isApproved: boolean) {
        const cleanEmail = email.toLowerCase().trim();
        
        const { data: existing } = await supabase.from('students').select('id').eq('email', cleanEmail).maybeSingle();
        
        const payload = {
            id: userId,
            email: cleanEmail,
            name: name.trim(),
            class_name: className?.trim() || 'Chưa xếp lớp',
            is_approved: isApproved
        };

        if (existing && existing.id !== userId) {
            await supabase.from('students').delete().eq('id', existing.id);
            await supabase.from('students').insert([payload]);
        } else if (existing) {
            await supabase.from('students').update(payload).eq('id', userId);
        } else {
            await supabase.from('students').insert([payload]);
        }
        
        if (userId) {
            // Sử dụng upsert để đảm bảo profile luôn tồn tại và đồng bộ
            await supabase.from('profiles').upsert({
                id: userId,
                full_name: payload.name,
                class_name: payload.class_name,
                is_approved: payload.is_approved,
                role: 'student',
                email: cleanEmail
            });
        }
    },

    async logout() {
        await supabase.auth.signOut();
        // Xóa sạch localStorage liên quan đến session để tránh lỗi token cũ
        for (let key in localStorage) {
            if (key.startsWith('sb-')) {
                localStorage.removeItem(key);
            }
        }
        window.location.reload();
    },

    async getCurrentUser(): Promise<User | null> {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
                if (error.message.includes('Refresh Token Not Found') || error.message.includes('invalid_grant')) {
                    console.warn("Session expired or invalid, signing out...");
                    await supabase.auth.signOut();
                }
                return null;
            }

            if (!session?.user) return null;

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();

            const role = (profile?.role || session.user.user_metadata?.role) as UserRole;
            let studentRecord = null;

            if (role === 'student') {
                const { data: stData } = await supabase
                    .from('students')
                    .select('*')
                    .eq('id', session.user.id)
                    .maybeSingle();
                studentRecord = stData;
            }

            return {
                id: session.user.id,
                username: profile?.username || session.user.email?.split('@')[0],
                name: profile?.full_name || studentRecord?.name || session.user.user_metadata?.full_name || 'Người dùng',
                email: session.user.email || '',
                role: role,
                className: profile?.class_name || studentRecord?.class_name || session.user.user_metadata?.class_name,
                school: profile?.school,
                isApproved: profile?.is_approved ?? studentRecord?.is_approved ?? session.user.user_metadata?.is_approved ?? false
            };
        } catch (e) {
            console.error("Auth initialization error:", e);
            return null;
        }
    }
};
