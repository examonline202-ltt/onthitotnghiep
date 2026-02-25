
import { GoogleGenAI } from "@google/genai";
import { LATEX_MATH_CONFIG } from "../utils/common";

const MIN_INTERVAL = 1500; 
let lastCalled = 0;

export const callGeminiAPI = async (prompt: string): Promise<string> => {
  // Client-side throttling tối thiểu
  const now = Date.now();
  if (now - lastCalled < MIN_INTERVAL) {
    const wait = MIN_INTERVAL - (now - lastCalled);
    await new Promise(r => setTimeout(r, wait));
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const systemInstructionText = `
    Bạn là một trợ lý giáo dục chuyên nghiệp. Hãy giải thích ngắn gọn, súc tích, đi thẳng vào vấn đề.
    
    QUY TẮC ĐỊNH DẠNG TUYỆT ĐỐI (QUAN TRỌNG):
    1. KHÔNG ĐƯỢC sử dụng công thức LaTeX (không dùng \\( ... \\) hay \\[ ... \\]). Hãy viết công thức toán học dưới dạng văn bản thông thường (ví dụ: thay vì \\( n < 9 \\) hãy viết "n < 9", thay vì \\( S = 0 \\) hãy viết "S = 0").
    2. KHÔNG ĐƯỢC vẽ bảng bằng Markdown (dạng | cột | cột |). Hãy trình bày dữ liệu dưới dạng danh sách gạch đầu dòng hoặc đoạn văn.
    3. Chỉ sử dụng Markdown cơ bản: In đậm (**...**), In nghiêng (*...*), Code Block (cho mã nguồn) và Tiêu đề (###).
    
    Mục tiêu: Đảm bảo nội dung hiển thị tốt trên mọi trình duyệt mà không cần plugin render Toán học.
  `.trim();

  // Chiến lược retry thông minh (Backoff + Jitter) cho 50 users
  const maxRetries = 3;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      lastCalled = Date.now();
      // Use systemInstruction in the config object as per SDK guidelines.
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Người dùng yêu cầu: ${prompt}`,
        config: {
          systemInstruction: systemInstructionText,
        },
      });
      return response.text || "AI không trả về nội dung.";
    } catch (error: any) {
      if (i === maxRetries) return "AI hiện đang quá tải do nhiều người cùng truy cập. Vui lòng thử lại sau 5 giây.";
      
      // Đợi (2^i * 1000ms) + ngẫu nhiên jitter để tránh cộng hưởng yêu cầu
      const waitTime = Math.pow(2, i) * 1000 + Math.random() * 1000;
      await new Promise(r => setTimeout(r, waitTime));
    }
  }
  return "Không thể kết nối với AI.";
};

export const getAIHint = callGeminiAPI;
