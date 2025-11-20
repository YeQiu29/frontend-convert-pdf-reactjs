import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// Setup PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface SplitEditorProps {
    pdfFile: File;
    onCancel: () => void;
    onSplit: (selectedPages: number[]) => void;
}

const SplitEditor: React.FC<SplitEditorProps> = ({ pdfFile, onCancel, onSplit }) => {
    const [pdfUrl, setPdfUrl] = useState<string>('');
    const [numPages, setNumPages] = useState<number>(0);
    const [selectedPages, setSelectedPages] = useState<number[]>([]);
    const [pageDimensions, setPageDimensions] = useState<{ width: number, height: number }>({ width: 150, height: 212 });

    useEffect(() => {
        const url = URL.createObjectURL(pdfFile);
        setPdfUrl(url);

        return () => URL.revokeObjectURL(url);
    }, [pdfFile]);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    };

    const togglePageSelection = (pageNumber: number) => {
        setSelectedPages(prevSelected => {
            if (prevSelected.includes(pageNumber)) {
                return prevSelected.filter(p => p !== pageNumber);
            } else {
                return [...prevSelected, pageNumber].sort((a, b) => a - b);
            }
        });
    };

    const handleSplit = () => {
        if (selectedPages.length === 0) {
            alert('Pilih setidaknya satu halaman untuk dipisahkan.');
            return;
        }
        onSplit(selectedPages);
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-6xl h-[95vh] rounded-lg shadow-2xl p-6 flex flex-col">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Pilih Halaman untuk Dipisahkan</h2>
                <p className="text-gray-600 mb-6">Klik pada halaman untuk memilih atau membatalkan pilihan. Halaman yang dipilih akan diekstrak menjadi file PDF baru.</p>

                <div className="flex-1 overflow-auto bg-gray-100 border-2 border-dashed rounded-lg p-6">
                    {pdfUrl && (
                        <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess} className="w-full">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                {Array.from(new Array(numPages), (el, index) => (
                                    <div 
                                        key={`page_${index + 1}`}
                                        onClick={() => togglePageSelection(index + 1)}
                                        className={`relative bg-white p-2 rounded-lg shadow-md border-2 transition-all cursor-pointer ${selectedPages.includes(index + 1) ? 'border-blue-500 scale-105' : 'border-gray-200'}`}
                                    >
                                        <div className="flex justify-center items-center" style={{ width: pageDimensions.width, height: pageDimensions.height }}>
                                            <Page
                                                pageNumber={index + 1}
                                                width={pageDimensions.width}
                                                renderAnnotationLayer={false}
                                                renderTextLayer={false}
                                                className="shadow-sm"
                                            />
                                        </div>
                                        <div className="absolute top-2 left-2 bg-gray-800 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                            {index + 1}
                                        </div>
                                        {selectedPages.includes(index + 1) && (
                                            <div className="absolute inset-0 bg-blue-500 bg-opacity-40 flex items-center justify-center rounded-lg">
                                                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Document>
                    )}
                </div>
                
                <div className="mt-4 text-center text-gray-700">
                    <p><span className="font-bold">{selectedPages.length}</span> halaman dipilih.</p>
                </div>

                <div className="flex justify-end items-center mt-6 pt-4 border-t">
                    <button onClick={onCancel} className="px-6 py-2 bg-gray-300 text-slate-800 rounded-md hover:bg-gray-400 transition-colors mr-3">
                        Batal
                    </button>
                    <button onClick={handleSplit} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors shadow-md">
                        Pisahkan PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SplitEditor;
