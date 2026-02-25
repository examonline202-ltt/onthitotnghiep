# Hướng dẫn Phân quyền & Xác thực

Dự án đã được cập nhật thêm module Mock Authentication để giả lập hành vi Backend (NodeJS/MongoDB).

## 1. Cơ chế hoạt động
- **Mock Service (`services/mockAuth.ts`)**: Quản lý đăng nhập, lưu trữ token giả vào `localStorage`.
- **Role**: Hệ thống hỗ trợ 2 vai trò: `teacher` (Giáo viên/Admin) và `student` (Học sinh).
- **Dashboard Locking**: Khi chưa đăng nhập (Guest), người dùng xem được Dashboard Overview nhưng không thể thao tác các chức năng quản lý.

## 2. Tài khoản Demo
Dữ liệu mẫu được hardcode trong `services/mockAuth.ts`:

### Giáo viên (Admin)
- **Email/Username**: `admin@gmail.com` hoặc `admin`
- **Password**: `admin`
- **Quyền hạn**: Truy cập toàn bộ chức năng (Quản lý đề, học sinh, điểm số...).

### Học sinh 1
- **Email/Username**: `hs1@gmail.com` hoặc `hs1`
- **Password**: `hs1`
- **Quyền hạn**: Chỉ hiển thị màn hình nhập mã bảo mật để vào thi.

### Học sinh 2
- **Email/Username**: `hs2@gmail.com` hoặc `hs2`
- **Password**: `hs2`

## 3. Quy trình Backend (NodeJS + MongoDB)
Để chuyển đổi sang Backend thật, bạn cần thực hiện:

1.  **API Endpoints**:
    -   `POST /api/auth/login`: Trả về JWT Token + User Info.
    -   `GET /api/auth/me`: Validate Token và trả về User Info.
2.  **Frontend Integration**:
    -   Thay thế `services/mockAuth.ts` bằng các gọi `fetch` hoặc `axios` tới API thực.
    -   Lưu JWT vào `localStorage` hoặc `cookie`.

## 4. Cấu trúc DB (MongoDB Schema gợi ý)

```javascript
// User Schema
const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Should be hashed (bcrypt)
  name: String,
  email: String,
  role: { type: String, enum: ['teacher', 'student'], default: 'student' },
  className: String, // Only for student
  school: String
});

// Subject Schema
const SubjectSchema = new Schema({
  name: String,
  description: String
});
```
