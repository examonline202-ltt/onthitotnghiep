
import { supabase } from './supabase';
import { ExamConfig, Question, StudentResult, Student } from '../types';

// Dấu phân cách đặc biệt để đóng gói dữ liệu ảnh vào trường văn bản
const IMG_PACK_PREFIX = '|||QUIZ_IMG_V1|||';

const packImg = (text: string, img?: string | null): string => {
    if (!img) return text || '';
    return `${IMG_PACK_PREFIX}${img}${IMG_PACK_PREFIX}${text || ''}`;
};

const unpackImg = (raw: string): { text: string; image: string | null } => {
    if (!raw || typeof raw !== 'string' || !raw.includes(IMG_PACK_PREFIX)) {
        return { text: raw || '', image: null };
    }
    const parts = raw.split(IMG_PACK_PREFIX);
    return { 
        image: parts[1] || null, 
        text: parts[2] || '' 
    };
};

const safeParseJson = (data: any) => {
    if (!data) return {};
    if (typeof data === 'object') return data;
    try {
        return JSON.parse(data);
    } catch (e) {
        console.error("Lỗi parse JSON answers:", e);
        return {};
    }
};

export const dataService = {
    // --- SETTINGS ---
    async getSettings(): Promise<Record<string, any>> {
        try {
            const { data, error } = await supabase.from('settings').select('*');
            if (error) throw error;
            return (data || []).reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
        } catch (err) {
            console.warn("Không thể tải settings từ DB, sử dụng mặc định:", err);
            return {};
        }
    },

    async saveSetting(key: string, value: any): Promise<void> {
        const { error } = await supabase.from('settings').upsert({ key, value });
        if (error) {
            console.error("Lỗi lưu setting:", error);
            throw error;
        }
    },

    // --- EXAMS & QUESTIONS ---
    async getExams(): Promise<ExamConfig[]> {
        const { data: exams, error } = await supabase
            .from('exams')
            .select(`
                id, code, title, created_at, duration, security_code, 
                class_name, max_attempts, max_violations, allow_hints, 
                allow_review, grading_config,
                questions (
                    id, type, section, question_text, options, answer, sub_questions, order_index
                ),
                results (*)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Supabase fetch exams error:", error);
            throw new Error(error.message);
        }
        
        return (exams || []).map(e => ({
            id: String(e.id),
            code: e.code,
            title: e.title,
            createdAt: new Date(e.created_at).toLocaleString('vi-VN'),
            duration: e.duration,
            securityCode: e.security_code || '',
            className: e.class_name,
            maxAttempts: e.max_attempts,
            maxViolations: e.max_violations,
            allowHints: e.allow_hints,
            allowReview: e.allow_review,
            gradingConfig: e.grading_config,
            questions: (e.questions || []).map((q: any) => {
                const qUnpacked = unpackImg(q.question_text);
                const optionsWithImages = (q.options || []).map((opt: string) => unpackImg(opt));
                
                return {
                    id: q.id,
                    type: q.type,
                    section: q.section,
                    question: qUnpacked.text,
                    image: qUnpacked.image, 
                    options: optionsWithImages.map((o: any) => o.text),
                    optionImages: optionsWithImages.map((o: any) => o.image), 
                    answer: q.answer,
                    subQuestions: q.sub_questions 
                };
            }).sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)),
            results: (e.results || []).map((r: any) => ({
                id: String(r.id),
                name: r.student_name || 'N/A',
                className: r.class_name || 'N/A',
                email: r.email,
                score: Number(r.score || 0),
                total: Number(r.total_points || 0),
                timeSpent: Number(r.time_spent || 0),
                violations: Number(r.violations || 0),
                counts: r.counts || { correct: 0, wrong: 0, empty: 0 },
                answers: safeParseJson(r.answers),
                date: new Date(r.created_at).toLocaleString('vi-VN')
            }))
        }));
    },

    async getResultsByExamId(examId: string): Promise<StudentResult[]> {
        if (!examId || examId === 'undefined' || examId === 'null') return [];
        
        const cleanId = examId.trim();

        const { data, error } = await supabase
            .from('results')
            .select('*')
            .eq('exam_id', cleanId)
            .order('score', { ascending: false });

        if (error) {
            console.error("Lỗi truy vấn bảng results:", error);
            return [];
        }
        
        return (data || []).map((r: any) => ({
            id: String(r.id),
            name: r.student_name || 'N/A',
            className: r.class_name || 'N/A',
            email: r.email,
            score: Number(r.score || 0),
            total: Number(r.total_points || 0),
            timeSpent: Number(r.time_spent || 0),
            violations: Number(r.violations || 0),
            counts: r.counts || { correct: 0, wrong: 0, empty: 0 },
            answers: safeParseJson(r.answers),
            date: new Date(r.created_at).toLocaleString('vi-VN')
        }));
    },

    async saveExam(exam: Partial<ExamConfig>, questions: Question[]): Promise<string> {
        const isUpdate = !!exam.id && (
            exam.id.includes('-') || 
            (exam.id.length < 12 && /^\d+$/.test(exam.id)) ||
            exam.id.length > 20
        );
        
        const examPayload = {
            title: exam.title,
            code: exam.code,
            security_code: exam.securityCode || '', 
            class_name: exam.className,
            duration: exam.duration,
            max_attempts: exam.maxAttempts || 0,
            max_violations: exam.maxViolations || 1,
            allow_hints: exam.allowHints || false,
            allow_review: exam.allowReview !== undefined ? exam.allowReview : true,
            grading_config: exam.gradingConfig,
        };

        let examId = exam.id;

        if (isUpdate) {
            const { error: examError } = await supabase.from('exams').update(examPayload).eq('id', exam.id);
            if (examError) throw new Error("Lỗi cập nhật đề thi: " + examError.message);
        } else {
            const { id, ...payloadWithoutId } = examPayload as any;
            const { data, error: examError } = await supabase.from('exams').insert([payloadWithoutId]).select().single();
            if (examError) throw new Error("Lỗi tạo đề thi mới: " + examError.message);
            examId = data.id;
        }

        if (examId && questions && questions.length > 0) {
            await supabase.from('questions').delete().eq('exam_id', examId);
            const questionsPayload = questions.map((q, idx) => ({
                exam_id: examId,
                type: q.type,
                section: q.section || '',
                question_text: packImg(q.question, q.image),
                options: (q.options || []).map((opt, i) => packImg(opt, q.optionImages?.[i])),
                answer: q.answer || '',
                // Fix property name: Use q.subQuestions instead of q.sub_questions as defined in the Question type.
                sub_questions: q.subQuestions || [],
                order_index: idx
            }));

            const { error: qError } = await supabase.from('questions').insert(questionsPayload);
            if (qError) {
                throw new Error("Lỗi lưu danh sách câu hỏi: " + (qError.message || "Lỗi không xác định"));
            }
        }
        return String(examId);
    },

    async deleteExam(id: string) {
        const { error } = await supabase.from('exams').delete().eq('id', id);
        if (error) throw new Error(error.message);
    },

    async resetExamResults(examId: string) {
        const { error } = await supabase.from('results').delete().eq('exam_id', examId);
        if (error) throw new Error("Lỗi khi reset bảng điểm: " + error.message);
    },

    async getStudents(): Promise<Student[]> {
        try {
            const [stRes, profRes] = await Promise.all([
                supabase.from('students').select('*'),
                supabase.from('profiles').select('*').eq('role', 'student')
            ]);
            const rawList: Student[] = [];
            if (stRes.data) stRes.data.forEach(s => rawList.push({ id: String(s.id), name: s.name, className: s.class_name, email: s.email?.toLowerCase().trim() || null, isApproved: s.is_approved ?? false }));
            if (profRes.data) profRes.data.forEach(p => rawList.push({ id: String(p.id), name: p.full_name || 'Người dùng mới', className: p.class_name || 'Chưa xếp lớp', email: p.email?.toLowerCase().trim() || null, isApproved: p.is_approved ?? false }));
            
            const emailMap = new Map<string, Student>();
            const nameMap = new Map<string, Student>();
            
            rawList.forEach(s => {
                if (s.email) { 
                    const existing = emailMap.get(s.email); 
                    if (!existing || s.id.length > existing.id.length) emailMap.set(s.email, { ...(existing || {}), ...s }); 
                } else { 
                    nameMap.set(s.name.toLowerCase().trim(), s); 
                }
            });
            const finalResults = Array.from(emailMap.values());
            nameMap.forEach((s, name) => { if (!finalResults.find(f => f.name.toLowerCase().trim() === name)) finalResults.push(s); });
            return finalResults.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        } catch (err) { console.error("Lỗi getStudents:", err); return []; }
    },

    async saveStudent(student: Student) {
        const email = student.email?.trim().toLowerCase() || null;
        const payload = { name: student.name, class_name: student.className, email: email, is_approved: student.isApproved ?? false };
        if (email && student.id.length < 20) {
            const { data: profile } = await supabase.from('profiles').select('id').eq('full_name', student.name).maybeSingle();
            if (profile) student.id = profile.id;
        }
        if (email) {
            const { data: existing } = await supabase.from('students').select('id').eq('email', email).maybeSingle();
            if (existing) await supabase.from('students').update(payload).eq('id', existing.id);
            else await supabase.from('students').insert([{ ...payload, id: student.id }]);
        } else {
             await supabase.from('students').update(payload).eq('id', student.id);
        }
        if (student.id.length > 20) {
            await supabase.from('profiles').update({ full_name: payload.name, class_name: payload.class_name, is_approved: payload.is_approved }).eq('id', student.id);
        }
    },

    async updateStudentStatus(email: string, id: string, isApproved: boolean) {
        const cleanEmail = email?.toLowerCase().trim();
        const updateData = { is_approved: isApproved };
        const tasks = [];
        if (cleanEmail) tasks.push(supabase.from('students').update(updateData).eq('email', cleanEmail));
        else tasks.push(supabase.from('students').update(updateData).eq('id', id));
        if (id && id.length > 20) tasks.push(supabase.from('profiles').update(updateData).eq('id', id));
        if (tasks.length === 0) return;
        const results = await Promise.all(tasks);
        for (const res of results) if (res.error) throw new Error(`Lỗi đồng bộ trạng thái: ${res.error.message}`);
    },

    async deleteStudent(id: string, email?: string) {
        const cleanEmail = email?.toLowerCase().trim();
        const tasks = [];
        if (cleanEmail) tasks.push(supabase.from('students').delete().eq('email', cleanEmail));
        if (id) {
            tasks.push(supabase.from('students').delete().eq('id', id));
            if (id.length > 20) tasks.push(supabase.from('profiles').delete().eq('id', id));
        }
        await Promise.all(tasks);
    },

    // --- RESULTS ---
    async submitResult(result: StudentResult, examId: string) {
        if (!examId) throw new Error("Mã đề thi không hợp lệ.");
        
        const isNumericId = /^\d+$/.test(examId);
        const finalExamId = isNumericId ? parseInt(examId) : examId;
        
        const cleanAnswers = JSON.parse(JSON.stringify(result.answers || {}));
        const cleanCounts = JSON.parse(JSON.stringify(result.counts || { correct: 0, wrong: 0, empty: 0 }));

        // Tạo payload, đảm bảo email không bao giờ là null/undefined để tránh lỗi schema cache nếu cột là NOT NULL
        const payload: any = {
            exam_id: finalExamId,
            student_name: result.name || 'Ẩn danh',
            class_name: result.className || 'Tự do',
            score: Number(result.score || 0),
            total_points: Number(result.total || 0),
            time_spent: Number(result.timeSpent || 0),
            violations: Number(result.violations || 0),
            counts: cleanCounts,
            answers: cleanAnswers,
            email: result.email || `guest_${Date.now()}@edu.vn`
        };

        console.log("Dữ liệu nộp bài:", payload);

        const { data, error } = await supabase
            .from('results')
            .insert([payload])
            .select();

        if (error) {
            console.error("CHI TIẾT LỖI SUPABASE:", error);
            
            // Xử lý thông báo lỗi người dùng thân thiện dựa trên mã lỗi
            if (error.code === 'PGRST204') {
                throw new Error("Lỗi cơ sở dữ liệu: Cột 'email' không tồn tại. Vui lòng chạy lệnh SQL bổ sung trong SQL Editor.");
            }
            if (error.code === '42501') {
                throw new Error("Lỗi quyền (RLS): Bạn chưa cho phép quyền INSERT cho bảng 'results'.");
            }
            
            throw new Error(`Ghi điểm thất bại (${error.code}): ${error.message}`);
        }
        
        return data;
    }
};
