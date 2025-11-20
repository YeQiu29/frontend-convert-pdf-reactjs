import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ReactSortable } from "react-sortablejs";

// Setup PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface ArrangeEditorProps {
    pdfFile: File;
    onCancel: () => void;
    onSave: (payload: { newPageOrder: number[], rotations: Record<number, number> }) => void;
}

interface PageItem {
    id: number;
    pageNumber: number;
}

const ArrangeEditor: React.FC<ArrangeEditorProps> = ({ pdfFile, onCancel, onSave }) => {
    const [pdfUrl, setPdfUrl] = useState<string>('');
    const [numPages, setNumPages] = useState<number>(0);
    const [pages, setPages] = useState<PageItem[]>([]);
    const [rotations, setRotations] = useState<Record<number, number>>({});
    const [pageDimensions, setPageDimensions] = useState<{ width: number, height: number }>({ width: 150, height: 212 });

    useEffect(() => {
        const url = URL.createObjectURL(pdfFile);
        setPdfUrl(url);

        return () => URL.revokeObjectURL(url);
    }, [pdfFile]);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        const initialPages = Array.from(new Array(numPages), (el, index) => ({
            id: index + 1,
            pageNumber: index + 1,
        }));
        setPages(initialPages);
        // Initialize rotations
        const initialRotations: Record<number, number> = {};
        for (let i = 1; i <= numPages; i++) {
            initialRotations[i] = 0;
        }
        setRotations(initialRotations);
    };

    const handleRotate = (pageNumber: number) => {
        setRotations(prev => ({
            ...prev,
            [pageNumber]: (prev[pageNumber] + 90) % 360
        }));
    };
    
    const handleSave = () => {
        const newPageOrder = pages.map(p => p.pageNumber);
        onSave({ newPageOrder, rotations });
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-6xl h-[95vh] rounded-lg shadow-2xl p-6 flex flex-col">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Atur Ulang Halaman PDF</h2>
                <p className="text-gray-600 mb-6">Klik dan seret halaman untuk mengubah urutannya. Klik tombol "Putar" pada halaman untuk merotasikannya.</p>

                <div className="flex-1 overflow-auto bg-gray-100 border-2 border-dashed rounded-lg p-6">
                    {pdfUrl && (
                        <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess} className="w-full">
                            <ReactSortable 
                                list={pages} 
                                setList={setPages}
                                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
                            >
                                {pages.map((page) => (
                                    <div key={page.id} className="relative bg-white p-2 rounded-lg shadow-md border border-gray-200 transition-transform transform hover:scale-105 cursor-grab">
                                        <div className="flex justify-center items-center" style={{ width: pageDimensions.width, height: pageDimensions.height }}>
                                            <Page
                                                pageNumber={page.pageNumber}
                                                width={pageDimensions.width}
                                                renderAnnotationLayer={false}
                                                renderTextLayer={false}
                                                className="shadow-sm"
                                                rotate={rotations[page.pageNumber] || 0}
                                            />
                                        </div>
                                        <div className="absolute top-2 right-2">
                                            <button 
                                                onClick={() => handleRotate(page.pageNumber)}
                                                className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                                                title="Putar 90 derajat"
                                            >
                                                ↻
                                            </button>
                                        </div>
                                        <div className="absolute bottom-2 left-2 bg-gray-800 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                            {page.pageNumber}
                                        </div>
                                         <div className="absolute bottom-2 right-2 bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                            {pages.findIndex(p => p.id === page.id) + 1}
                                        </div>
                                    </div>
                                ))}
                            </ReactSortable>
                        </Document>
                    )}
                </div>

                <div className="flex justify-end items-center mt-6 pt-4 border-t">
                    <button onClick={onCancel} className="px-6 py-2 bg-gray-300 text-slate-800 rounded-md hover:bg-gray-400 transition-colors mr-3">
                        Batal
                    </button>
                    <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors shadow-md">
                        Simpan Perubahan
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ArrangeEditor;
