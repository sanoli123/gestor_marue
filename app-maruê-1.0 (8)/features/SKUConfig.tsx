
import React, { useState } from 'react';
import { useData } from '../context/DataContext.tsx';
import { SKUSegmentOption, SKUConfig } from '../types.ts';
import Button from '../components/ui/Button.tsx';
import Modal from '../components/Modal.tsx';
import Input from '../components/ui/Input.tsx';

interface SegmentManagerProps {
    title: string;
    segmentKey: 'productTypes' | 'origins';
}

const SegmentManager: React.FC<SegmentManagerProps> = ({ title, segmentKey }) => {
    const { skuConfig, updateSkuConfig } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<Partial<SKUSegmentOption> | null>(null);

    const segmentData = skuConfig ? skuConfig[segmentKey] : [];

    const openModal = (item: Partial<SKUSegmentOption> | null = null) => {
        setCurrentItem(item || {});
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setCurrentItem(null);
        setIsModalOpen(false);
    };

    const handleSave = async () => {
        if (!skuConfig || !currentItem?.name || !currentItem?.code) {
            alert('Nome e Código são obrigatórios.');
            return;
        }

        const updatedSegment = currentItem.id
            ? segmentData.map(item => item.id === currentItem.id ? currentItem as SKUSegmentOption : item)
            : [...segmentData, { ...currentItem, id: crypto.randomUUID() } as SKUSegmentOption];

        try {
            await updateSkuConfig({ ...skuConfig, [segmentKey]: updatedSegment });
            closeModal();
        } catch (error) {
            console.error(error);
            alert('Falha ao salvar a configuração de SKU.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!skuConfig) return;
        if (window.confirm('Tem certeza que deseja excluir este item? Isso pode afetar a geração de futuros SKUs.')) {
            const updatedSegment = segmentData.filter(item => item.id !== id);
            try {
                await updateSkuConfig({ ...skuConfig, [segmentKey]: updatedSegment });
            } catch (error) {
                console.error(error);
                alert('Falha ao excluir o item de SKU.');
            }
        }
    };

    if (!skuConfig) {
        return <p>Carregando configuração de SKU...</p>;
    }

    return (
        <div className="bg-lino p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-espresso">{title}</h2>
                <Button onClick={() => openModal()}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    Adicionar
                </Button>
            </div>
            <div className="bg-crema shadow-md rounded-lg overflow-x-auto">
                <table className="w-full text-sm text-left text-oliva">
                    <thead className="text-xs text-espresso uppercase bg-lino">
                        <tr>
                            <th className="px-6 py-3">Código</th>
                            <th className="px-6 py-3">Nome</th>
                            <th className="px-6 py-3">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {segmentData.map(item => (
                            <tr key={item.id} className="bg-crema border-b border-lino hover:bg-lino">
                                <td className="px-6 py-4 font-mono">{item.code}</td>
                                <td className="px-6 py-4 font-medium text-espresso">{item.name}</td>
                                <td className="px-6 py-4 flex items-center space-x-2">
                                    <Button variant="secondary" onClick={() => openModal(item)} className="!p-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                                    </Button>
                                    <Button variant="danger" onClick={() => handleDelete(item.id)} className="!p-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Modal isOpen={isModalOpen} onClose={closeModal} title={`${currentItem?.id ? 'Editar' : 'Adicionar'} Item`}>
                <div className="space-y-4">
                    <Input
                        label="Nome"
                        value={currentItem?.name || ''}
                        onChange={e => setCurrentItem(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <Input
                        label="Código (ex: CESP, PP)"
                        value={currentItem?.code || ''}
                        onChange={e => setCurrentItem(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                        maxLength={4}
                    />
                    <Button onClick={handleSave}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        Salvar
                    </Button>
                </div>
            </Modal>
        </div>
    );
};


const SKUConfigPage: React.FC = () => {
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-espresso">Configuração de SKU</h1>
            <p className="text-oliva mt-1">Gerencie os códigos usados para gerar os SKUs dos seus produtos automaticamente.</p>
            
            <SegmentManager title="Tipos de Produto" segmentKey="productTypes" />
            <SegmentManager title="Origens do Produto" segmentKey="origins" />

        </div>
    );
};

export default SKUConfigPage;
