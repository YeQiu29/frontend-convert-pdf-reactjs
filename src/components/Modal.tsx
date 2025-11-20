import React, { useState } from 'react';
import { Feature } from '../types';

type ModalProps = {
    feature: Feature;
    onClose: () => void;
    onOpenSignatureEditor?: (pdfFile: File, imageFile: File) => void;
};

const API_BASE_URL = "https://63b9ae67068f.ngrok-free.app";

const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
};

const Modal: React.FC<ModalProps> = ({ feature, onClose, onOpenSignatureEditor }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);

        if (feature.api === 'add-signature' && onOpenSignatureEditor) {
            const pdfFile = formData.get('file') as File;
            const signatureImageFile = formData.get('signature_image') as File;

            if (!pdfFile || pdfFile.size === 0) {
                setError('Harap unggah file PDF utama.');
                setIsLoading(false);
                return;
            }
            if (!signatureImageFile || signatureImageFile.size === 0) {
                setError('Harap unggah file gambar tanda tangan.');
                setIsLoading(false);
                return;
            }

            onOpenSignatureEditor(pdfFile, signatureImageFile);
            return;
        }

        const url = `${API_BASE_URL}/${feature.api}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: `HTTP error! Status: ${response.status}` }));
                throw new Error(errorData.detail || 'Terjadi error yang tidak diketahui.');
            }

            const disposition = response.headers.get('content-disposition');
            let filename = `${feature.api}_result.file`;
            
            if (disposition?.includes('attachment')) {
                const filenameMatch = /filename[^;=]*=((['"]).*?\2|[^;]*)/.exec(disposition);
                if (filenameMatch?.[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '');
                }
            }

            const blob = await response.blob();
            downloadFile(blob, filename);
            onClose();

        } catch (err: any) {
            console.error('API Error:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const needs = feature.needs;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold">{feature.title}</h3>
                    <button onClick={onClose} className="text-3xl text-gray-400 hover:text-gray-700">&times;</button>
                </div>

                <div className="border-t pt-4">
                    <form id="feature-form" onSubmit={handleSubmit} encType="multipart/form-data">
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {needs === 'multiple-files' ? 'Pilih File PDF' : 'File PDF Utama'}
                            </label>
                            <input 
                                type="file" 
                                name={needs === 'multiple-files' ? 'files' : 'file'}
                                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                required 
                                multiple={needs === 'multiple-files'}
                                accept="application/pdf"
                            />
                        </div>

                        {needs === 'password' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input type="password" name="password" className="w-full border rounded px-3 py-2" required />
                            </div>
                        )}

                        {needs === 'text' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">{feature.textLabel}</label>
                                <input 
                                    type="text" 
                                    name={feature.api === 'split' || feature.api === 'delete-pages' ? 'page_range' : (feature.api === 'arrange-pages' ? 'new_order' : 'text')}
                                    className="w-full border rounded px-3 py-2" 
                                    required 
                                />
                            </div>
                        )}

                        {needs === 'signature' && (
                            <div className="mb-4 space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">File Tanda Tangan (.png, .jpg)</label>
                                    <input type="file" name="signature_image" className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" required accept="image/png, image/jpeg"/>
                                </div>
                            </div>
                        )}

                        {needs === 'excel-flavor' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Metode Ekstraksi</label>
                                <select name="flavor" className="w-full border rounded px-3 py-2">
                                    <option value="lattice">Lattice (Tabel dengan garis)</option>
                                    <option value="stream">Stream (Tabel tanpa garis)</option>
                                </select>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                                <strong className="font-bold">Error!</strong>
                                <span className="block sm:inline"> {error}</span>
                            </div>
                        )}

                        <div className="mt-6 text-right">
                            <button type="submit" disabled={isLoading} className="bg-blue-600 text-white font-bold py-2 px-6 rounded hover:bg-blue-700 disabled:bg-blue-300">
                                {isLoading ? 'Memproses...' : (feature.api === 'add-signature' ? 'Lanjutkan ke Editor' : 'Proses')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Modal;