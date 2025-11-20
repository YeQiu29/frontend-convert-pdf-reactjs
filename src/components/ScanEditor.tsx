import React, { useState, useEffect, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem'; // We'll create this component

// Setup PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

type Effect = 'original' | 'scan' | 'magic_color';
type OutputFormat = 'pdf' | 'jpg';

interface ScanEditorProps {
    images: File[];
    onCancel: () => void;
    onScan: (payload: {
        files: File[];
        effect: Effect;
        outputFormat: OutputFormat;
        order: string[];
    }) => void;
}

const ScanEditor: React.FC<ScanEditorProps> = ({ images, onCancel, onScan }) => {
    const [imageItems, setImageItems] = useState<{ id: string; file: File; url: string }[]>([]);
    const [activeEffect, setActiveEffect] = useState<Effect>('scan');
    const [outputFormat, setOutputFormat] = useState<OutputFormat>('pdf');

    useEffect(() => {
        const items = images.map(file => ({
            id: file.name + '-' + Math.random(),
            file,
            url: URL.createObjectURL(file),
        }));
        setImageItems(items);

        return () => {
            items.forEach(item => URL.revokeObjectURL(item.url));
        };
    }, [images]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function handleDragEnd(event: any) {
        const { active, over } = event;
        if (active.id !== over.id) {
            setImageItems((items) => {
                const oldIndex = items.findIndex(item => item.id === active.id);
                const newIndex = items.findIndex(item => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    }
    
    const handleScan = () => {
        onScan({
            files: imageItems.map(item => item.file),
            effect: activeEffect,
            outputFormat,
            order: imageItems.map(item => item.id), // Pass the order
        });
    };

    const effectPreviews = useMemo(() => {
        return imageItems.map(item => {
            // In a real scenario, you might generate a small preview on the client
            // For now, we'll just apply a CSS filter to simulate the effect
            let filter = '';
            if (activeEffect === 'scan') filter = 'grayscale(100%) contrast(1.5)';
            if (activeEffect === 'magic_color') filter = 'contrast(1.4) saturate(1.2)';
            return { ...item, filter };
        });
    }, [imageItems, activeEffect]);


    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-7xl h-[95vh] rounded-lg shadow-2xl p-6 flex flex-col">
                <h2 className="text-2xl font-bold mb-2 text-gray-800">Scan Dokumen</h2>
                <p className="text-gray-600 mb-4">Atur urutan gambar, pilih efek, dan format output.</p>

                {/* Toolbar */}
                <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded-lg border">
                    <div>
                        <span className="font-semibold mr-3">Efek:</span>
                        {(['original', 'scan', 'magic_color'] as Effect[]).map(eff => (
                            <button
                                key={eff}
                                onClick={() => setActiveEffect(eff)}
                                className={`px-4 py-2 rounded-md mr-2 text-sm font-medium transition ${activeEffect === eff ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-700 hover:bg-gray-200'}`}
                            >
                                {eff.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </button>
                        ))}
                    </div>
                    <div>
                        <span className="font-semibold mr-3">Format Output:</span>
                         <button
                            onClick={() => setOutputFormat('pdf')}
                            className={`px-4 py-2 rounded-l-md text-sm font-medium transition ${outputFormat === 'pdf' ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-700 hover:bg-gray-200'}`}
                        >
                            PDF
                        </button>
                         <button
                            onClick={() => setOutputFormat('jpg')}
                            className={`px-4 py-2 rounded-r-md text-sm font-medium transition ${outputFormat === 'jpg' ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-700 hover:bg-gray-200'}`}
                        >
                            JPG (ZIP)
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-gray-100 border-2 border-dashed rounded-lg p-6">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={imageItems.map(i => i.id)} strategy={rectSortingStrategy}>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                {effectPreviews.map(item => (
                                    <SortableItem key={item.id} id={item.id}>
                                        <div className="relative bg-white p-1 rounded-lg shadow-md border border-gray-200 h-48 flex items-center justify-center overflow-hidden">
                                            <img src={item.url} alt={item.file.name} className="max-h-full max-w-full" style={{ filter: item.filter }} />
                                        </div>
                                    </SortableItem>
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>

                <div className="flex justify-end items-center mt-6 pt-4 border-t">
                    <button onClick={onCancel} className="px-6 py-2 bg-gray-300 text-slate-800 rounded-md hover:bg-gray-400 transition-colors mr-3">
                        Batal
                    </button>
                    <button onClick={handleScan} className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors shadow-lg text-lg">
                        Proses & Download
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScanEditor;
