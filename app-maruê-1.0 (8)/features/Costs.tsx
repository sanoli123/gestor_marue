

import React, { useState } from 'react';
import { useData } from '../context/DataContext.tsx';
import { Cost, CostType } from '../types.ts';
import Button from '../components/ui/Button.tsx';
import Modal from '../components/Modal.tsx';
import Input from '../components/ui/Input.tsx';
import Select from '../components/ui/Select.tsx';

interface CostListProps {
    costType: CostType;
}

const CostList: React.FC<CostListProps> = ({ costType }) => {
    const { costs, addCost, updateCost, deleteCost } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCost, setCurrentCost] = useState<Partial<Cost> | null>(null);

    const filteredCosts = costs.filter(c => c.type === costType);

    const openModal = (cost: Partial<Cost> | null = null) => {
        setCurrentCost(cost || { type: costType, isPercentage: true });
        setIsModalOpen(true);
    };
    const closeModal = () => setIsModalOpen(false);

    const handleSave = async () => {
        if (!currentCost || !currentCost.name || currentCost.value === undefined) {
            return alert('Nome e valor são obrigatórios.');
        }

        try {
            if (currentCost.id) {
                await updateCost(currentCost as Cost);
            } else {
                await addCost(currentCost as Omit<Cost, 'id'>);
            }
            closeModal();
        } catch (error) {
            console.error(error);
            alert('Falha ao salvar o custo.');
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este custo?')) {
            try {
                await deleteCost(id);
            } catch (error) {
                console.error(error);
                alert('Falha ao excluir o custo.');
            }
        }
    };

    return (
        <div>
            <div className="flex justify-end items-center mb-4">
                <Button onClick={() => openModal(null)}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  Adicionar
                </Button>
            </div>
            <div className="bg-crema shadow-md rounded-lg overflow-x-auto">
                <table className="w-full text-sm text-left text-oliva">
                    <thead className="text-xs text-espresso uppercase bg-lino">
                        <tr>
                            <th className="px-6 py-3">Nome</th>
                            <th className="px-6 py-3">Valor</th>
                            <th className="px-6 py-3">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCosts.map(cost => (
                            <tr key={cost.id} className="bg-crema border-b border-lino hover:bg-lino">
                                <td className="px-6 py-4 font-medium text-espresso">{cost.name}</td>
                                <td className="px-6 py-4">{cost.isPercentage ? `${cost.value}%` : `R$ ${cost.value.toFixed(2)}`}</td>
                                <td className="px-6 py-4 space-x-2">
                                    <Button variant="secondary" onClick={() => openModal(cost)} className="!p-2" aria-label={`Editar ${cost.name}`}>
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                                    </Button>
                                    <Button variant="danger" onClick={() => handleDelete(cost.id)} className="!p-2" aria-label={`Excluir ${cost.name}`}>
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Modal isOpen={isModalOpen} onClose={closeModal} title={`Gerenciar ${costType}`}>
                <div className="space-y-4">
                    <Input label="Nome" value={currentCost?.name || ''} onChange={e => setCurrentCost({ ...currentCost, name: e.target.value })} />
                    <Input label="Valor" type="number" value={currentCost?.value || ''} onChange={e => setCurrentCost({ ...currentCost, value: parseFloat(e.target.value) || 0 })} />
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="isPercentage"
                            checked={currentCost?.isPercentage || false}
                            onChange={e => setCurrentCost({ ...currentCost, isPercentage: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300 text-oliva focus:ring-oliva"
                        />
                        <label htmlFor="isPercentage" className="ml-2 block text-sm text-espresso">
                            É uma porcentagem?
                        </label>
                    </div>
                    <Button onClick={handleSave}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      Salvar
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

const Costs: React.FC = () => {
    const costTypes: { label: string; type: CostType }[] = [
        { label: 'Canais de Venda', type: CostType.SALES_CHANNEL },
        { label: 'Meios de Pagamento', type: CostType.PAYMENT_METHOD },
        { label: 'Impostos', type: CostType.TAX },
        { label: 'Outros Custos', type: CostType.OTHER },
    ];
    const [activeTab, setActiveTab] = useState<CostType>(CostType.SALES_CHANNEL);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-espresso">Custos Operacionais</h1>
            <div className="border-b border-lino">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {costTypes.map(item => (
                        <button
                            key={item.type}
                            onClick={() => setActiveTab(item.type)}
                            className={`${activeTab === item.type ? 'border-oliva text-oliva' : 'border-transparent text-oliva hover:text-espresso hover:border-lino'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>
            </div>
            
            <CostList costType={activeTab} />
        </div>
    );
};

export default Costs;
