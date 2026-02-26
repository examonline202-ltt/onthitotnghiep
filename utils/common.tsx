
import React from 'react';
import { Question, StudentResult, ExamConfig, Student } from '../types';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';

// --- CSS Animations cho UI Động ---
const EXTRA_STYLES = `
  @keyframes timer-bounce {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); color: #ef4444; border-color: #fca5a5; }
  }
  .timer-urgent {
    animation: timer-bounce 0.6s infinite ease-in-out;
  }
  
  /* Đảm bảo Code Block trông chuyên nghiệp */
  .code-ide-container {
    background: #1e1e1e !important;
    border-radius: 12px;
    margin: 1.5rem 0;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    overflow: hidden;
    border: 1px solid #333;
    width: 100%;
    max-width: 100%;
  }

  /* Style cho Inline Code (Cặp nháy đơn) */
  .inline-code {
    background-color: #f1f5f9;
    color: #e11d48;
    padding: 0.1em 0.4em;
    border-radius: 6px;
    font-family: 'Fira Code', 'Consolas', monospace;
    font-size: 0.9em;
    border: 1px solid #e2e8f0;
    font-weight: 600;
  }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = EXTRA_STYLES;
  document.head.appendChild(styleSheet);
}

export const LATEX_MATH_CONFIG = {
  "name": "plain_text_generator",
  "version": "2.0",
  "description": "Sinh nội dung văn bản thuần, không dùng LaTeX hay Table phức tạp.",
  "output_rules": {
    "format": "plain_text_markdown",
    "math_syntax": "standard_text (e.g., x = 5)",
    "tables": "forbidden (use lists instead)"
  }
};

// Robust Library Loading
export const loadExternalLibs = async () => {
  // Pre-configure MathJax
  if (!(window as any).MathJax) {
    (window as any).MathJax = {
      tex: {
        inlineMath: [['\\(', '\\)'], ['$', '$']],
        displayMath: [['\\[', '\\]'], ['$$', '$$']]
      },
      startup: { typeset: false }
    };
  }

  const libs = [
    { global: 'mammoth', src: 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js' },
    { global: 'XLSX', src: 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js' },
    { global: 'MathJax', src: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js' },
    { global: 'docx', src: 'https://cdn.jsdelivr.net/npm/docx@7.1.0/build/index.js' } // Revert to 7.1.0 for stability
  ];

  const loadOne = (lib: {global: string, src: string}) => new Promise((resolve) => {
      // If global exists, resolve immediately
      if ((window as any)[lib.global]) return resolve(true);
      
      // Check if script tag is already in DOM
      const existing = document.querySelector(`script[src="${lib.src}"]`);
      if (existing) {
          // Poll until global variable is available
          let checks = 0;
          const timer = setInterval(() => {
              if ((window as any)[lib.global]) { clearInterval(timer); resolve(true); }
              else if (checks++ > 100) { clearInterval(timer); resolve(false); } // ~10s timeout
          }, 100);
          return;
      }

      const script = document.createElement('script');
      script.src = lib.src;
      script.crossOrigin = "anonymous";
      script.onload = () => resolve(true);
      script.onerror = () => {
          console.warn(`Failed to load script: ${lib.src}`);
          resolve(false);
      };
      document.head.appendChild(script);
  });

  await Promise.all(libs.map(loadOne));
  
  // Verify critical libs
  return !!((window as any).docx && (window as any).XLSX);
};

const CodeBlock: React.FC<{ code: string, language: string }> = ({ code, language }) => {
  const codeRef = React.useRef<HTMLElement>(null);
  
  const langMap: Record<string, string> = {
    'python': 'python',
    'py': 'python',
    'sql': 'sql',
    'cpp': 'cpp',
    'c++': 'cpp',
    'c': 'c',
    'h': 'c',
    'css': 'css',
    'html': 'markup',
    'xml': 'markup',
    'javascript': 'javascript',
    'js': 'javascript',
    'ts': 'javascript'
  };

  const displayLang = langMap[language.toLowerCase()] || 'python';

  React.useEffect(() => {
    if ((window as any).Prism && codeRef.current) {
      try {
        (window as any).Prism.highlightElement(codeRef.current);
      } catch (e) {
        console.error("Prism highlight error:", e);
      }
    }
  }, [code, displayLang]);

  return (
    <div className="code-ide-container animate-fade-in my-2">
      <div className="flex items-center justify-between border-b border-[#333] bg-[#252526]">
        <div className="ide-dots">
          <div className="ide-dot dot-red"></div>
          <div className="ide-dot dot-yellow"></div>
          <div className="ide-dot dot-green"></div>
        </div>
        <div className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest opacity-80">
          {language.toUpperCase() || 'CODE'}
        </div>
      </div>
      
      <div className="p-4 overflow-x-auto bg-[#1e1e1e]">
        <pre className={`language-${displayLang} !m-0 !p-0`}>
          <code ref={codeRef} className={`language-${displayLang}`}>
            {code.replace(/^\n+|\n+$/g, '')}
          </code>
        </pre>
      </div>
    </div>
  );
};

export const MathRenderer: React.FC<{ text: string, allowMarkdown?: boolean }> = React.memo(({ text, allowMarkdown = false }) => {
  const containerRef = React.useRef<HTMLSpanElement>(null);
  
  React.useEffect(() => {
    if (typeof text !== 'string') return;
    if ((window as any).MathJax?.typesetPromise && containerRef.current) {
        (window as any).MathJax.typesetPromise([containerRef.current]).catch(() => {});
    }
  }, [text]);

  if (typeof text !== 'string') return null;
  if (!allowMarkdown) return <span ref={containerRef}>{text}</span>;

  return (
     <span ref={containerRef} className="block w-full markdown-body">
        <Markdown 
            remarkPlugins={[remarkGfm, remarkBreaks]}
            rehypePlugins={[rehypeRaw]}
            components={{
                h1: ({node, ...props}) => <h1 className="text-lg font-black text-indigo-900 mt-4 mb-2" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-base font-bold text-indigo-800 mt-3 mb-1" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-sm font-bold text-indigo-700 mt-2 mb-1" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc ml-6 mb-2 text-slate-700" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal ml-6 mb-2 text-slate-700" {...props} />,
                li: ({node, ...props}) => <li className="mb-1" {...props} />,
                table: ({node, ...props}) => <div className="overflow-x-auto my-4"><table className="w-full border-collapse border-2 border-slate-300" {...props} /></div>,
                th: ({node, ...props}) => <th className="border-2 border-slate-300 bg-slate-100 px-4 py-2 text-left font-bold text-slate-800" {...props} />,
                td: ({node, ...props}) => <td className="border-2 border-slate-300 px-4 py-2 text-slate-700" {...props} />,
                p: ({node, ...props}) => <p className="min-h-[1.5em] mb-2" {...props} />,
                code(props) {
                    const {children, className, node, ...rest} = props
                    const match = /language-(\w+)/.exec(className || '')
                    return match ? (
                        <CodeBlock code={String(children).replace(/\n$/, '')} language={match[1]} />
                    ) : (
                        <code {...rest} className="inline-code">
                            {children}
                        </code>
                    )
                }
            }}
        >
            {text}
        </Markdown>
     </span>
  );
});

export const SmartTextRenderer = ({ text }: { text: string }) => {
    if (typeof text !== 'string') return null;
    return <div className="space-y-1.5 text-gray-700 w-full"><MathRenderer text={text} allowMarkdown={true} /></div>;
};

export const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).then(() => alert("Đã sao chép!")).catch(() => {
    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    alert("Đã sao chép!");
  });
};

export function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

export const exportResultsToExcel = async (results: StudentResult[], title: string) => {
  if (!(window as any).XLSX) await loadExternalLibs();
  
  const XLSX = (window as any).XLSX;
  if (!XLSX) return alert("Thư viện Excel chưa sẵn sàng. Vui lòng kiểm tra kết nối mạng.");
  
  const data = results.map((res, idx) => ({
    "STT": idx + 1,
    "Họ và Tên": res.name,
    "Lớp": res.className,
    "Điểm": res.score,
    "Đúng": res.counts?.correct || 0,
    "Sai": res.counts?.wrong || 0,
    "Thời gian": res.timeSpent || 0,
    "Vi phạm": res.violations || 0
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Ket_Qua");
  XLSX.writeFile(wb, `Ket_Qua_${title.replace(/\s+/g, '_')}.xlsx`);
};

export const exportStudentsToExcel = async (students: Student[]) => {
  if (!(window as any).XLSX) await loadExternalLibs();
  
  const XLSX = (window as any).XLSX;
  if (!XLSX) return alert("Thư viện Excel chưa sẵn sàng. Vui lòng kiểm tra kết nối mạng.");
  
  const data = students.map((s, idx) => ({
    "STT": idx + 1,
    "Họ và Tên": s.name,
    "Lớp": s.className,
    "Email/Tài khoản": s.email || '',
    "Trạng thái": s.isApproved ? "Đã duyệt" : "Chờ duyệt"
  }));
  
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Danh_Sach_Hoc_Sinh");
  XLSX.writeFile(wb, `Danh_Sach_Hoc_Sinh_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`);
};

export const exportExamToDocx = async (exam: ExamConfig) => {
    try {
        if (!(window as any).docx) await loadExternalLibs();
        
        const docx = (window as any).docx;
        if (!docx) return alert("Thư viện Word chưa sẵn sàng. Vui lòng kiểm tra kết nối mạng hoặc thử lại.");
        
        const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun } = docx;

        // Helper: Convert Base64 to Uint8Array for Images
        const base64ToBuffer = (base64: string) => {
            if (!base64) return null;
            try {
                // 1. Loại bỏ khoảng trắng và ký tự xuống dòng
                let cleanBase64 = base64.replace(/\s/g, '');
                
                // 2. Tách lấy phần sau dấu phẩy nếu có data URI
                const commaIndex = cleanBase64.indexOf(',');
                if (commaIndex !== -1) {
                    cleanBase64 = cleanBase64.substring(commaIndex + 1);
                }
                
                // Decode Base64
                const binaryString = window.atob(cleanBase64);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                return bytes;
            } catch (e) {
                console.error("Lỗi chuyển đổi ảnh:", e);
                return null;
            }
        };

        // Helper: Create Paragraphs from Text (Handles Markdown Code Blocks & Images)
        const createRichTextParagraphs = (rawText: string, imageBase64?: string, prefix: string = '', indentLeft: number = 0) => {
            const paragraphs = [];
            const parts = rawText.split(/```/); // Tách code blocks

            parts.forEach((part, index) => {
                const isCodeBlock = index % 2 === 1;

                if (isCodeBlock) {
                    // Xử lý Code Block
                    let lines = part.split('\n');
                    
                    let lang = '';
                    if (lines.length > 0) {
                        const firstLineTrimmed = lines[0].trim();
                        if (/^[a-zA-Z0-9+#]+$/.test(firstLineTrimmed)) {
                            lang = firstLineTrimmed;
                            lines.shift(); 
                        } else if (firstLineTrimmed === '') {
                            lines.shift();
                        }
                    }
                    
                    if (lines.length > 0 && lines[lines.length-1].trim() === '') {
                        lines.pop();
                    }

                    // Header code block
                    paragraphs.push(new Paragraph({
                        children: [
                            new TextRun({
                                text: "```" + lang,
                                font: "Courier New",
                                size: 22,
                                color: "000000"
                            })
                        ],
                        indent: { left: indentLeft + 720 },
                        spacing: { after: 0, line: 240 } 
                    }));

                    // Content code block
                    lines.forEach(line => {
                        paragraphs.push(new Paragraph({
                            children: [
                                new TextRun({
                                    text: line, 
                                    font: "Courier New",
                                    size: 22,
                                    color: "000000"
                                })
                            ],
                            indent: { left: indentLeft + 720 },
                            spacing: { after: 0, line: 240 }
                        }));
                    });

                    // Footer code block
                    paragraphs.push(new Paragraph({
                        children: [
                            new TextRun({
                                text: "```",
                                font: "Courier New",
                                size: 22,
                                color: "000000"
                            })
                        ],
                        indent: { left: indentLeft + 720 },
                        spacing: { after: 100, line: 240 }
                    }));

                } else {
                    // Regular Text
                    if (!part && index !== 0) return; 

                    const textContent = part;
                    const runs = [];
                    
                    if (index === 0 && prefix) {
                        runs.push(new TextRun({ text: prefix, bold: true }));
                    }
                    
                    const lines = textContent.split('\n');
                    lines.forEach((line, lineIdx) => {
                        if (lineIdx > 0) runs.push(new TextRun({ break: 1 }));
                        runs.push(new TextRun({ text: line }));
                    });

                    if (runs.length > 0) {
                        paragraphs.push(new Paragraph({
                            children: runs,
                            indent: { left: indentLeft },
                            spacing: { after: 100 }
                        }));
                    }
                }
            });

            // Xử lý chèn ảnh
            if (imageBase64) {
                const imgBuffer = base64ToBuffer(imageBase64);
                if (imgBuffer) {
                    try {
                        paragraphs.push(new Paragraph({
                            children: [
                                new ImageRun({
                                    data: imgBuffer,
                                    transformation: { width: 300, height: 200 }, // Kích thước cố định an toàn
                                })
                            ],
                            indent: { left: indentLeft + 360 } // Thụt vào một chút so với text
                        }));
                    } catch (imgError) {
                        console.error("Lỗi tạo ImageRun:", imgError);
                        paragraphs.push(new Paragraph({
                            children: [new TextRun({ text: "[Lỗi hiển thị ảnh]", color: "FF0000", italics: true })],
                            indent: { left: indentLeft }
                        }));
                    }
                }
            }

            return paragraphs;
        };

        const sections = [
            "PHẦN I. TRẮC NGHIỆM KHÁCH QUAN",
            "PHẦN II. CÂU HỎI ĐÚNG - SAI",
            "PHẦN III. TRẢ LỜI NGẮN",
            "KHÁC"
        ];

        const docChildren = [];

        // Header Exam
        docChildren.push(
            new Paragraph({
                text: exam.title.toUpperCase(),
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
                spacing: { after: 300 }
            })
        );
        
        // Info Line
        docChildren.push(
            new Paragraph({
                text: `Mã đề: ${exam.code} | Thời gian: ${exam.duration} phút`,
                alignment: AlignmentType.CENTER,
                spacing: { after: 300 }
            })
        );

        let globalIndex = 1;

        sections.forEach(secTitle => {
            const questions = exam.questions.filter(q => (q.section || "KHÁC") === secTitle);
            if (questions.length === 0) return;

            // Section Header
            docChildren.push(
                new Paragraph({
                    text: secTitle,
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 400, after: 200 }
                })
            );

            questions.forEach((q) => {
                // 1. Render Câu hỏi
                const qParagraphs = createRichTextParagraphs(q.question, q.image, `Câu ${globalIndex}. `, 0);
                if (qParagraphs) docChildren.push(...qParagraphs);
                
                globalIndex++;

                // 2. Render Đáp án
                if (q.type === 'choice' && q.options) {
                    q.options.forEach((opt, i) => {
                        const label = String.fromCharCode(65 + i); 
                        const isCorrect = q.answer === opt;
                        const optImage = q.optionImages?.[i];
                        
                        const optPrefix = `${isCorrect ? '*' : ''}${label}. `;
                        
                        const optParagraphs = createRichTextParagraphs(opt, optImage, optPrefix, 720);
                        if (optParagraphs) docChildren.push(...optParagraphs);
                    });
                } else if (q.type === 'group' && q.subQuestions) {
                    q.subQuestions.forEach((sub, i) => {
                        const label = String.fromCharCode(97 + i); 
                        const isCorrect = sub.correctAnswer === true;
                        
                        const subPrefix = `${isCorrect ? '*' : ''}${label}) `;
                        const subParagraphs = createRichTextParagraphs(sub.content, undefined, subPrefix, 720);
                        
                        if (subParagraphs) docChildren.push(...subParagraphs);
                    });
                } else if (q.type === 'text') {
                     docChildren.push(
                        new Paragraph({
                            children: [
                                new TextRun({ text: "Đáp án: ", bold: true, italics: true }),
                                new TextRun(q.answer || "")
                            ],
                            indent: { left: 720 }
                        })
                    );
                }
                
                // Spacer
                docChildren.push(new Paragraph({ text: "" }));
            });
        });

        const doc = new Document({
            sections: [{
                properties: {},
                children: docChildren,
            }],
        });

        Packer.toBlob(doc).then((blob: Blob) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${exam.title.replace(/\s+/g, '_')}_CodeSupported.docx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }).catch(err => {
            console.error("Packer error:", err);
            alert("Lỗi khi tạo file Word: " + err.message);
        });
    } catch (e: any) {
        console.error("Export error:", e);
        alert("Có lỗi xảy ra khi xuất file Word: " + e.message);
    }
};

export const parseWordSmart = (content: string): Question[] => {
  if (typeof content !== 'string') return [];
  // Mammoth extracts paragraphs with \n\n, which causes double spacing in code blocks.
  // We replace \n\n with \n to fix this, while preserving intentional multiple empty lines.
  const normalizedContent = content.replace(/\n\n/g, '\n');
  const lines = normalizedContent.split('\n');
  const newQuestions: Question[] = [];
  
  let currentSection = "PHẦN I. TRẮC NGHIỆM KHÁCH QUAN";
  let currentType: 'choice' | 'group' | 'text' = 'choice';
  let currentQ: Partial<Question> | null = null;
  
  let parserState: 'question' | 'option' | 'subQ' = 'question';
  
  const sectionRegex = /^PHẦN\s+(I|II|III|IV|V|A|B|C|D)[\.:]?\s*(.*)/i;
  const qStartRegex = /^(Câu|Question)\s*\d+[:.]/i;
  const optRegex = /^(\*)?([A-D])\.(.*)/;
  const subQRegex = /^(\*)?\s*([a-d])[\.\)]\s*(.*)/i;
  const trueRegex = /[\(\[]?\s*(Đúng|True|Đ)\s*[\)\]]?$/i;
  const falseRegex = /[\(\[]?\s*(Sai|False|S)\s*[\)\]]?$/i;

  const ensureGroupStructure = (q: Partial<Question>) => {
      if (q.type === 'group') {
          q.subQuestions = q.subQuestions || [];
          const needed = 4 - q.subQuestions.length;
          for (let k = 0; k < needed; k++) {
              q.subQuestions.push({
                  id: Date.now() + Math.random().toString() + k,
                  content: "",
                  correctAnswer: false
              });
          }
          if (q.subQuestions.length > 4) q.subQuestions = q.subQuestions.slice(0, 4);
      }
      return q as Question;
  };

  let inCodeBlock = false;

  lines.forEach(line => {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
    }

    if (!trimmed && !inCodeBlock) return;

    const secMatch = trimmed.match(sectionRegex);
    if (secMatch && !inCodeBlock) {
        currentSection = trimmed.toUpperCase(); 
        const titleContent = secMatch[2].toUpperCase();
        
        if (titleContent.includes("ĐÚNG") && titleContent.includes("SAI")) {
            currentType = 'group';
        } else if (titleContent.includes("TRẢ LỜI NGẮN") || titleContent.includes("TỰ LUẬN")) {
            currentType = 'text';
        } else {
            currentType = 'choice';
        }
        return; 
    }

    if (qStartRegex.test(trimmed) && !inCodeBlock) {
       if (currentQ) {
           newQuestions.push(ensureGroupStructure(currentQ));
       }
       
       // Remove the "Câu X:" part from the original line, preserving trailing spaces
       const questionText = trimmed.replace(qStartRegex, "").trim();
       
       currentQ = { 
           id: Date.now() + Math.random(), 
           question: questionText, 
           section: currentSection,
           type: currentType, 
           options: [], 
           subQuestions: [],
           answer: '', 
           mixQuestion: true, 
           mixOptions: true 
       };
       parserState = 'question';
    } 
    else if (currentQ) {
       if (inCodeBlock) {
           if (parserState === 'option' && currentQ.type === 'choice' && currentQ.options && currentQ.options.length > 0) {
               currentQ.options[currentQ.options.length - 1] += "\n" + line;
           } else if (parserState === 'subQ' && currentQ.type === 'group' && currentQ.subQuestions && currentQ.subQuestions.length > 0) {
               currentQ.subQuestions[currentQ.subQuestions.length - 1].content += "\n" + line;
           } else {
               currentQ.question += "\n" + line;
           }
           return;
       }

       if (currentQ.type === 'choice') {
           const match = trimmed.match(optRegex);
           if (match) {
               const text = match[3].trim();
               currentQ.options?.push(text);
               if (match[1]) currentQ.answer = text; 
               parserState = 'option';
           } else {
               if (parserState === 'option' && currentQ.options && currentQ.options.length > 0) {
                   currentQ.options[currentQ.options.length - 1] += "\n" + line;
               } else {
                   currentQ.question += "\n" + line;
               }
           }
       } else if (currentQ.type === 'group') {
           const match = trimmed.match(subQRegex);
           if (match) {
               const hasAsterisk = !!match[1];
               let text = match[3].trim();
               let isCorrect = hasAsterisk; 

               if (trueRegex.test(text)) {
                   text = text.replace(trueRegex, "").trim(); 
                   isCorrect = true;
               } else if (falseRegex.test(text)) {
                   text = text.replace(falseRegex, "").trim();
                   if (!hasAsterisk) isCorrect = false;
               }

               currentQ.subQuestions?.push({
                   id: Date.now() + Math.random().toString(),
                   content: text,
                   correctAnswer: isCorrect
               });
               parserState = 'subQ';
           } else {
               if (parserState === 'subQ' && currentQ.subQuestions && currentQ.subQuestions.length > 0) {
                   currentQ.subQuestions[currentQ.subQuestions.length - 1].content += "\n" + line;
               } else {
                   currentQ.question += "\n" + line;
               }
           }
       } else if (currentQ.type === 'text') {
           if (trimmed.match(/^(Đáp án|Answer|ĐS|Kết quả)[:\.]/i)) {
               const parts = trimmed.split(/[:\.]/);
               if (parts.length > 1) {
                   currentQ.answer = parts.slice(1).join(":").trim();
               }
           } else {
               currentQ.question += "\n" + line;
           }
       }
    }
  });

  if (currentQ) newQuestions.push(ensureGroupStructure(currentQ));
  return newQuestions;
};

export const generateSecurityCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const parseStudentImport = (text: string) => {
  return text.split('\n').filter(l => l.trim()).map(line => {
    const parts = line.split(/[\t,]/).map(p => p.trim());
    return parts.length >= 2 ? { id: Math.random().toString(36).substr(2,9), name: parts[0], className: parts[1], email: parts[2] || '' } : null;
  }).filter(Boolean);
};