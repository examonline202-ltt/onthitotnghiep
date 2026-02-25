import { User } from '../types';

// Dữ liệu mẫu theo yêu cầu
const MOCK_USERS = [
    {
        id: 'user_gv_1',
        username: 'admin', // Login bằng username hoặc email
        email: 'admin@gmail.com',
        password: 'admin',
        name: 'Lê Văn Đông',
        role: 'teacher',
        school: 'THPT Chuyên Lê Thánh Tông',
        createdAt: new Date().toISOString()
    },
    {
        id: 'user_hs_1',
        username: 'hs1',
        email: 'hs1@gmail.com',
        password: 'hs1',
        name: 'Nguyễn Văn A',
        role: 'student',
        className: '12A1',
        school: 'THPT Chuyên Lê Thánh Tông',
        createdAt: new Date().toISOString()
    },
    {
        id: 'user_hs_2',
        username: 'hs2',
        email: 'hs2@gmail.com',
        password: 'hs2',
        name: 'Trần Thị B',
        role: 'student',
        className: '12A2',
        school: 'THPT Chuyên Lê Thánh Tông',
        createdAt: new Date().toISOString()
    }
];

// Giả lập lưu token vào localStorage
const TOKEN_KEY = 'quiz_master_auth_token';
const USER_KEY = 'quiz_master_user_info';

export const authService = {
    login: async (identifier: string, password: string, role: 'teacher' | 'student'): Promise<User | null> => {
        // Giả lập độ trễ mạng
        await new Promise(resolve => setTimeout(resolve, 500));

        const user = MOCK_USERS.find(u => 
            (u.email === identifier || u.username === identifier) && 
            u.password === password &&
            u.role === role
        );

        if (user) {
            // Loại bỏ password trước khi trả về (Mocking backend response)
            const { password, ...userInfo } = user;
            
            // Lưu session
            localStorage.setItem(TOKEN_KEY, 'mock_jwt_token_' + Date.now());
            localStorage.setItem(USER_KEY, JSON.stringify(userInfo));
            
            return userInfo as User;
        }

        throw new Error("Tên đăng nhập hoặc mật khẩu không đúng!");
    },

    logout: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        window.location.reload(); // Reload để reset state app
    },

    getCurrentUser: (): User | null => {
        const userStr = localStorage.getItem(USER_KEY);
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch {
            return null;
        }
    },

    isAuthenticated: (): boolean => {
        return !!localStorage.getItem(TOKEN_KEY);
    }
};