import { useState, useEffect } from 'react';
import Modal from './components/Modal';
import SignatureEditor from './components/SignatureEditor';
import { Feature } from './types';

const features: Feature[] = [
    { api: "arrange-pages", needs: "text", textLabel: "Urutan Baru (cth: 3,1,2)", icon: "🗂️", title: "Atur PDF", description: "Urutkan, putar, dan hapus" },
    { api: "merge", needs: "multiple-files", icon: "✨", title: "Gabungkan PDF", description: "Satukan beberapa PDF" },
    { api: "split", needs: "text", textLabel: "Rentang Halaman (cth: 1, 3-5)", icon: "✂️", title: "Pisahkan PDF", description: "Ekstrak halaman dari PDF" },
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

function App() {
    const [modalOpen, setModalOpen] = useState(false);
    const [currentFeature, setCurrentFeature] = useState<Feature | null>(null);

    // State for Signature Editor
    const [isEditingSignature, setIsEditingSignature] = useState(false);
    const [signaturePdfFile, setSignaturePdfFile] = useState<File | null>(null);
    const [signatureImageFile, setSignatureImageFile] = useState<File | null>(null);

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
        closeModal(); // Close the feature selection modal
    };

    const closeSignatureEditor = () => {
        setIsEditingSignature(false);
        setSignaturePdfFile(null);
        setSignatureImageFile(null);
    };

    const handleSaveAndProcessSignature = async (pdfFile: File, signatureFile: File, x: number, y: number, pageNumber: number, width: number) => {
        const formData = new FormData();
        formData.append('file', pdfFile, pdfFile.name);
        formData.append('signature_image', signatureFile, signatureFile.name);
        formData.append('x_pos', Math.round(x).toString());
        formData.append('y_pos', Math.round(y).toString());
        formData.append('page_number', pageNumber.toString());
        formData.append('width', Math.round(width).toString());

        try {
            const response = await fetch('https://63b9ae67068f.ngrok-free.app/add-signature', {
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
            a.download = `signed_${pdfFile.name}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error("Failed to process signature:", error);
            alert(`Gagal memproses tanda tangan: ${error instanceof Error ? error.message : "Unknown error"}`);
        } finally {
            closeSignatureEditor();
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
                    {features.map(feature => (
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
            </div>

            {modalOpen && currentFeature && !isEditingSignature && (
                <Modal 
                    feature={currentFeature} 
                    onClose={closeModal} 
                    onOpenSignatureEditor={openSignatureEditor}
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
        </div>
    );
}

export default App;