import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from "react-pdf";

// Setup PDF worker for Vite
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;


interface SignatureEditorProps {
    pdfFile: File;
    signatureFile: File;
    onCancel: () => void;
    onSaveAndProcess: (pdfFile: File, signatureFile: File, x: number, y: number, pageNumber: number, width: number) => void;
}

const SignatureEditor: React.FC<SignatureEditorProps> = ({ pdfFile, signatureFile, onCancel, onSaveAndProcess }) => {
    const [pdfUrl, setPdfUrl] = useState<string>("");
    const [signatureUrl, setSignatureUrl] = useState<string>("");
    const [numPages, setNumPages] = useState<number>(1);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [pageScale, setPageScale] = useState<number>(1);

    const [pageSize, setPageSize] = useState<{ width: number; height: number } | null>(null);

    const [pos, setPos] = useState({ x: 20, y: 20 });
    const [sigSize, setSigSize] = useState({ width: 160, height: 110 }); // Default size
    const [sigAspectRatio, setSigAspectRatio] = useState(110 / 160);
    const [interaction, setInteraction] = useState<'drag' | 'resize' | null>(null);
    const interactionRef = useRef({ startX: 0, startY: 0, startW: 0, startH: 0, offsetX: 0, offsetY: 0 });

    const pdfContainerRef = useRef<HTMLDivElement>(null);
    const signatureContainerRef = useRef<HTMLDivElement>(null);

    // Create object URLs and get signature aspect ratio
    useEffect(() => {
        const pUrl = URL.createObjectURL(pdfFile);
        const sUrl = URL.createObjectURL(signatureFile);
        setPdfUrl(pUrl);
        setSignatureUrl(sUrl);

        // Get aspect ratio from the image file
        const img = new Image();
        img.onload = () => {
            const aspectRatio = img.height / img.width;
            setSigAspectRatio(aspectRatio);
            setSigSize(prev => ({ ...prev, height: prev.width * aspectRatio }));
        };
        img.src = sUrl;

        return () => {
            URL.revokeObjectURL(pUrl);
            URL.revokeObjectURL(sUrl);
        };
    }, [pdfFile, signatureFile]);

    const onDocLoad = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    };

    const onPageLoad = (page: any) => {
        if (pageSize || !pdfContainerRef.current) return;
        const containerWidth = pdfContainerRef.current.clientWidth;
        const scale = containerWidth / page.width;
        setPageScale(scale);
        setPageSize({ width: page.width * scale, height: page.height * scale });
    };

    // --- [MODIFIED] Combined handler for drag and resize ---
    const handleMouseDown = (e: React.MouseEvent, type: 'drag' | 'resize') => {
        e.preventDefault();
        e.stopPropagation();

        setInteraction(type);
        interactionRef.current.startX = e.clientX;
        interactionRef.current.startY = e.clientY;

        if (type === 'drag' && signatureContainerRef.current) {
            const rect = signatureContainerRef.current.getBoundingClientRect();
            interactionRef.current.offsetX = e.clientX - rect.left;
            interactionRef.current.offsetY = e.clientY - rect.top;
        } else {
            interactionRef.current.startW = sigSize.width;
            interactionRef.current.startH = sigSize.height;
        }
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!interaction || !pdfContainerRef.current || !pageSize) return;

        const containerRect = pdfContainerRef.current.getBoundingClientRect();

        if (interaction === 'drag') {
            let newX = e.clientX - containerRect.left - interactionRef.current.offsetX;
            let newY = e.clientY - containerRect.top - interactionRef.current.offsetY;

            newX = Math.max(0, Math.min(newX, pageSize.width - sigSize.width));
            newY = Math.max(0, Math.min(newY, pageSize.height - sigSize.height));
            setPos({ x: newX, y: newY });

        } else if (interaction === 'resize') {
            const dx = e.clientX - interactionRef.current.startX;
            let newWidth = interactionRef.current.startW + dx;
            
            // Clamp resize
            newWidth = Math.max(50, Math.min(newWidth, pageSize.width - pos.x));
            const newHeight = newWidth * sigAspectRatio;

            if (pos.y + newHeight > pageSize.height) {
                return;
            }

            setSigSize({ width: newWidth, height: newHeight });
        }
    }, [interaction, pageSize, sigSize.width, sigSize.height, pos.x, pos.y, sigAspectRatio]);

    const handleMouseUp = useCallback(() => {
        setInteraction(null);
    }, []);

    useEffect(() => {
        if (interaction) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        } else {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        }
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [interaction, handleMouseMove, handleMouseUp]);

    // --- [MODIFIED] Save function to include width ---
    const savePosition = () => {
        if (!pageSize || !signatureContainerRef.current) return alert("PDF belum siap!");

        const originalW = pageSize.width / pageScale;
        const originalH = pageSize.height / pageScale;

        const x = (pos.x / pageSize.width) * originalW;
        const y = originalH - ((pos.y + sigSize.height) / pageSize.height) * originalH;
        const widthInPoints = (sigSize.width / pageSize.width) * originalW;

        onSaveAndProcess(pdfFile, signatureFile, x, y, pageNumber, widthInPoints);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <style>{`
                .resize-handle {
                    position: absolute;
                    width: 12px;
                    height: 12px;
                    background: #007bff;
                    border: 2px solid white;
                    border-radius: 50%;
                    bottom: -6px;
                    right: -6px;
                    cursor: se-resize;
                }
                .signature-container {
                    position: absolute;
                    cursor: grab;
                    border: 1px dashed transparent;
                }
                .signature-container:hover {
                    border-color: #007bff;
                }
            `}</style>
            <div className="bg-white w-full max-w-4xl rounded-lg shadow-lg p-5 flex flex-col h-[90vh]">
                <h2 className="text-xl font-bold mb-3">Sesuaikan Posisi & Ukuran Tanda Tangan</h2>

                <div ref={pdfContainerRef} className="flex-1 overflow-auto bg-gray-100 border rounded relative p-2">
                    {pdfUrl && (
                        <Document file={pdfUrl} onLoadSuccess={onDocLoad}>
                            <div style={{ position: "relative", margin: 'auto' }}>
                                <Page
                                    pageNumber={pageNumber}
                                    scale={pageScale}
                                    onLoadSuccess={onPageLoad}
                                    renderAnnotationLayer={false}
                                    renderTextLayer={false}
                                />
                                {pageSize && signatureUrl && (
                                    <div
                                        ref={signatureContainerRef}
                                        className="signature-container"
                                        style={{
                                            left: pos.x,
                                            top: pos.y,
                                            width: sigSize.width,
                                            height: sigSize.height,
                                            cursor: interaction === 'drag' ? 'grabbing' : 'grab',
                                        }}
                                        onMouseDown={(e) => handleMouseDown(e, 'drag')}
                                    >
                                        <img
                                            src={signatureUrl}
                                            style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
                                            draggable={false}
                                            alt="signature"
                                        />
                                        <div
                                            className="resize-handle"
                                            onMouseDown={(e) => handleMouseDown(e, 'resize')}
                                        />
                                    </div>
                                )}
                            </div>
                        </Document>
                    )}
                </div>

                <div className="flex justify-between items-center mt-4">
                    <div>
                        <button disabled={pageNumber <= 1} onClick={() => setPageNumber(p => p - 1)} className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-400">&lt;</button>
                        <span className="mx-2">Halaman {pageNumber} / {numPages}</span>
                        <button disabled={pageNumber >= numPages} onClick={() => setPageNumber(p => p + 1)} className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-400">&gt;</button>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={onCancel} className="px-5 py-2 bg-gray-300 text-slate-800 rounded hover:bg-gray-400">Batal</button>
                        <button onClick={savePosition} className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Simpan & Proses</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignatureEditor;