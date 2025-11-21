import { useState } from 'react';
import Modal from './components/Modal';
import SignatureEditor from './components/SignatureEditor';
import ArrangeEditor from './components/ArrangeEditor';
import SplitEditor from './components/SplitEditor';
import ScanEditor from './components/ScanEditor'; // Import ScanEditor
import { Feature } from './types';

const features: Feature[] = [
    { api: "arrange-pages", needs: "file-only", icon: "🗂️", title: "Atur PDF", description: "Urutkan dan putar halaman PDF" },
    { api: "merge", needs: "multiple-files", icon: "✨", title: "Gabungkan PDF", description: "Satukan beberapa PDF" },
    { api: "split", needs: "file-only", icon: "✂️", title: "Pisahkan PDF", description: "Ekstrak halaman dari PDF" },
    { api: "scan", needs: "image-multi-upload", icon: "📷", title: "Scan Dokumen", description: "Scan gambar ke PDF dengan efek" },
    { api: "to-word", needs: "file-only", icon: "📄", title: "PDF ke Word", description: "Konversi PDF ke dokumen Word" },
    { api: "to-powerpoint", needs: "file-only", icon: "🖥️", title: "PDF ke PPT", description: "Konversi PDF ke presentasi" },
    { api: "to-excel", needs: "excel-flavor", icon: "📊", title: "PDF ke Excel", description: "Konversi PDF ke spreadsheet" },
    { api: "to-images", needs: "file-only", icon: "🖼️", title: "PDF ke Gambar", description: "Ubah PDF menjadi gambar" },
    { api: "watermark", needs: "text", textLabel: "Teks Watermark", icon: "💧", title: "Watermark PDF", description: "Tambahkan tanda air ke PDF" },
    { api: "lock", needs: "password", icon: "🔒", title: "Kunci PDF", description: "Tambahkan sandi ke PDF" },
    { api: "unlock", needs: "password", icon: "🔓", title: "Hilangkan Sandi", description: "Hapus sandi dari PDF" },
    { api: "add-signature", needs: "signature", icon: "✍️", title: "Tanda Tangan", description: "Tanda tangani tangan ke PDF" },
    { api: "delete-pages", needs: "text", textLabel: "Halaman Hapus (cth: 2-5)", icon: "🗑️", title: "Hapus Halaman", description: "Hapus halaman tertentu" },
];

const API_BASE_URL = 'https://63b9ae67068f.ngrok-free.app';

function App() {
    const [modalOpen, setModalOpen] = useState(false);
    const [currentFeature, setCurrentFeature] = useState<Feature | null>(null);

    // State for Signature Editor
    const [isEditingSignature, setIsEditingSignature] = useState(false);
    const [signaturePdfFile, setSignaturePdfFile] = useState<File | null>(null);
    const [signatureImageFile, setSignatureImageFile] = useState<File | null>(null);

    // State for Arrange Editor
    const [isArranging, setIsArranging] = useState(false);
    const [arrangePdfFile, setArrangePdfFile] = useState<File | null>(null);

    // State for Split Editor
    const [isSplitting, setIsSplitting] = useState(false);
    const [splitPdfFile, setSplitPdfFile] = useState<File | null>(null);

    // State for Scan Editor
    const [isScanning, setIsScanning] = useState(false);
    const [scanImages, setScanImages] = useState<File[]>([]);

    const openModal = (feature: Feature) => {
        setCurrentFeature(feature);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setCurrentFeature(null);
    };

    // Functions for Signature Editor workflow
    const openSignatureEditor = (pdfFile: File, imageFile: File) => {
        setSignaturePdfFile(pdfFile);
        setSignatureImageFile(imageFile);
        setIsEditingSignature(true);
        closeModal();
    };

    const closeSignatureEditor = () => {
        setIsEditingSignature(false);
        setSignaturePdfFile(null);
        setSignatureImageFile(null);
    };

    // Functions for Arrange Editor workflow
    const openArrangeEditor = (pdfFile: File) => {
        setArrangePdfFile(pdfFile);
        setIsArranging(true);
        closeModal();
    };

    const closeArrangeEditor = () => {
        setIsArranging(false);
        setArrangePdfFile(null);
    };

    // Functions for Split Editor workflow
    const openSplitEditor = (pdfFile: File) => {
        setSplitPdfFile(pdfFile);
        setIsSplitting(true);
        closeModal();
    };

    const closeSplitEditor = () => {
        setIsSplitting(false);
        setSplitPdfFile(null);
    };

    // Functions for Scan Editor workflow
    const openScanEditor = (images: File[]) => {
        setScanImages(images);
        setIsScanning(true);
        closeModal();
    };

    const closeScanEditor = () => {
        setIsScanning(false);
        setScanImages([]);
    };

    const handleSaveAndProcessSignature = async (pdfFile: File, signatureFile: File, x: number, y: number, pageNumber: number, width: number) => {
        // ... (existing signature handling logic)
    };

    const handleSaveArrange = async (payload: { newPageOrder: number[], rotations: Record<number, number> }) => {
        if (!arrangePdfFile) {
            alert("File PDF tidak ditemukan.");
            return;
        }

        const { newPageOrder, rotations } = payload;
        const formData = new FormData();
        formData.append('file', arrangePdfFile);
        formData.append('new_order', newPageOrder.join(','));
        formData.append('rotations', JSON.stringify(rotations));

        try {
            const response = await fetch(`${API_BASE_URL}/arrange-pages`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `arranged_${arrangePdfFile.name}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error("Failed to arrange PDF:", error);
            alert(`Gagal mengatur PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
        } finally {
            closeArrangeEditor();
        }
    };

    const handleSplitPdf = async (selectedPages: number[]) => {
        // ... (existing split handling logic)
    };

    const handleScanImages = async (payload: { files: File[], effect: string, outputFormat: string, order: string[] }) => {
        const { files, effect, outputFormat } = payload;
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        formData.append('effect', effect);
        formData.append('output_format', outputFormat);

        try {
            const response = await fetch(`${API_BASE_URL}/scan`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = outputFormat === 'pdf' ? 'scanned.pdf' : 'scanned.zip';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error("Failed to scan images:", error);
            alert(`Gagal memindai gambar: ${error instanceof Error ? error.message : "Unknown error"}`);
        } finally {
            closeScanEditor();
        }
    };

    return (
        <div className="bg-slate-100 min-h-screen flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-5xl p-6 sm:p-8 rounded-xl shadow-lg">
                <header className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-blue-600">YeQiuPDF</h1>
                    <span className="text-sm text-gray-500 hidden sm:block">Alat PDF All-in-One</span>
                    <button className="text-2xl">🌙</button>
                </header>

                <h2 className="text-lg font-semibold text-gray-700 mb-6">Pilih fitur:</h2>

                <div className="grid grid-cols-4 gap-4">
                    {features.slice(0, 12).map(feature => (
                        <div 
                            key={feature.api}
                            className="flex flex-col items-center justify-center p-4 sm:p-6 border rounded-lg text-center hover:shadow-lg hover:border-blue-500 transition cursor-pointer bg-slate-50"
                            onClick={() => openModal(feature)}
                        >
                            <span className="text-4xl mb-3">{feature.icon}</span>
                            <span className="font-semibold">{feature.title}</span>
                            <span className="text-sm text-gray-500">{feature.description}</span>
                        </div>
                    ))}
                </div>
                <div className="flex justify-center mt-4">
                    {features.slice(12).map(feature => (
                        <div 
                            key={feature.api}
                            className="w-1/4 flex flex-col items-center justify-center p-4 sm:p-6 border rounded-lg text-center hover:shadow-lg hover:border-blue-500 transition cursor-pointer bg-slate-50"
                            onClick={() => openModal(feature)}
                        >
                            <span className="text-4xl mb-3">{feature.icon}</span>
                            <span className="font-semibold">{feature.title}</span>
                            <span className="text-sm text-gray-500">{feature.description}</span>
                        </div>
                    ))}
                </div>
            </div>

            {modalOpen && currentFeature && (
                <Modal 
                    feature={currentFeature} 
                    onClose={closeModal} 
                    onOpenSignatureEditor={openSignatureEditor}
                    onOpenArrangeEditor={openArrangeEditor}
                    onOpenSplitEditor={openSplitEditor}
                    onOpenScanEditor={openScanEditor}
                />
            )}

            {isEditingSignature && signaturePdfFile && signatureImageFile && (
                <SignatureEditor
                    pdfFile={signaturePdfFile}
                    signatureFile={signatureImageFile}
                    onCancel={closeSignatureEditor}
                    onSaveAndProcess={handleSaveAndProcessSignature}
                />
            )}

            {isArranging && arrangePdfFile && (
                <ArrangeEditor
                    pdfFile={arrangePdfFile}
                    onCancel={closeArrangeEditor}
                    onSave={handleSaveArrange}
                />
            )}

            {isSplitting && splitPdfFile && (
                <SplitEditor
                    pdfFile={splitPdfFile}
                    onCancel={closeSplitEditor}
                    onSplit={handleSplitPdf}
                />
            )}

            {isScanning && scanImages.length > 0 && (
                <ScanEditor
                    images={scanImages}
                    onCancel={closeScanEditor}
                    onScan={handleScanImages}
                />
            )}
        </div>
    );
}

export default App;