

import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext.tsx';
import Button from '../components/ui/Button.tsx';
import Modal from '../components/Modal.tsx';
import Select from '../components/ui/Select.tsx';
import Input from '../components/ui/Input.tsx';
import { Id, Cost, CostType } from '../types.ts';
import * as XLSX from 'xlsx';

const Sales: React.FC = () => {
    const { sales, finishedProducts, costs, registerSale, getProductCost } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [selectedProductId, setSelectedProductId] = useState<Id | ''>('');
    const [quantity, setQuantity] = useState(1);
    const [appliedCostIds, setAppliedCostIds] = useState<Id[]>([]);
    const [isRegistering, setIsRegistering] = useState(false);

    const productMap = useMemo(() => new Map(finishedProducts.map(p => [p.id, p])), [finishedProducts]);

    const openModal = () => {
        setSelectedProductId('');
        setQuantity(1);
        setAppliedCostIds([]);
        setIsModalOpen(true);
    };

    const handleCostToggle = (costId: Id) => {
        setAppliedCostIds(prev => 
            prev.includes(costId) ? prev.filter(id => id !== costId) : [...prev, costId]
        );
    };

    const handleRegisterSale = async () => {
        if (!selectedProductId || quantity <= 0) {
            alert('Por favor, selecione um produto e uma quantidade válida.');
            return;
        }
        setIsRegistering(true);
        try {
            await registerSale(selectedProductId, quantity, appliedCostIds);
            alert('Venda registrada com sucesso!');
            setIsModalOpen(false);
        } catch (error) {
            console.error(error);
            alert(`Falha ao registrar a venda: ${(error as Error).message}`);
        } finally {
            setIsRegistering(false);
        }
    };

    const saleSummary = useMemo(() => {
        const product = productMap.get(selectedProductId);
        if (!product) return { revenue: 0, variableCosts: 0, productionCost: 0, profit: 0 };
        
        const revenue = product.salePrice * quantity;
        const productionCost = getProductCost(product) * quantity;
        
        let variableCosts = 0;
        appliedCostIds.forEach(costId => {
            const cost = costs.find(c => c.id === costId);
            if (cost) {
                variableCosts += cost.isPercentage ? (revenue * cost.value) / 100 : cost.value;
            }
        });
        
        const profit = revenue - productionCost - variableCosts;
        return { revenue, variableCosts, productionCost, profit };
    }, [selectedProductId, quantity, appliedCostIds, costs, productMap, getProductCost]);


    const costGroups = useMemo(() => {
      const groups: Record<CostType, Cost[]> = {
        [CostType.SALES_CHANNEL]: [],
        [CostType.PAYMENT_METHOD]: [],
        [CostType.TAX]: [],
        [CostType.OTHER]: [],
      };
      costs.forEach(cost => {
        if (groups[cost.type]) {
          groups[cost.type].push(cost);
        }
      });
      return groups;
    }, [costs]);

    const handleExportExcel = () => {
        if (sales.length === 0) {
            alert("Nenhuma venda para exportar.");
            return;
        }

        const dataToExport = sales.map(sale => {
            const product = productMap.get(sale.finishedProductId);
            const appliedCostsString = sale.appliedCosts
                .map(cost => `${cost.name}: R$ ${cost.value.toFixed(2)}`)
                .join('; ');

            return {
                'Data': new Date(sale.date).toLocaleString(),
                'Produto': product ? product.name : 'Produto Excluído',
                'Quantidade': sale.quantity,
                'Receita Total (R$)': sale.totalRevenue,
                'Custo Total (R$)': sale.totalCost,
                'Lucro Líquido (R$)': sale.netProfit,
                'Custos Aplicados': appliedCostsString,
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Vendas');

        worksheet['!cols'] = [
            { wch: 20 }, { wch: 30 }, { wch: 12 }, { wch: 20 },
            { wch: 20 }, { wch: 20 }, { wch: 50 },
        ];

        XLSX.writeFile(workbook, 'Historico_de_Vendas.xlsx');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-espresso">Histórico de Vendas</h1>
                <div className="flex gap-2">
                    <Button onClick={handleExportExcel} variant="secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Exportar Planilha
                    </Button>
                    <Button onClick={openModal}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        Registrar Venda
                    </Button>
                </div>
            </div>

            <div className="bg-crema shadow-md rounded-lg overflow-x-auto">
                <table className="w-full text-sm text-left text-oliva">
                    <thead className="text-xs text-espresso uppercase bg-lino">
                        <tr>
                            <th className="px-6 py-3">Data</th>
                            <th className="px-6 py-3">Produto</th>
                            <th className="px-6 py-3">Qtd.</th>
                            <th className="px-6 py-3">Receita</th>
                            <th className="px-6 py-3">Custo Total</th>
                            <th className="px-6 py-3">Lucro Líquido</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sales.map(sale => (
                            <tr key={sale.id} className="bg-crema border-b border-lino hover:bg-lino">
                                <td className="px-6 py-4">{new Date(sale.date).toLocaleString()}</td>
                                <td className="px-6 py-4 font-medium text-espresso">{productMap.get(sale.finishedProductId)?.name || 'Produto Excluído'}</td>
                                <td className="px-6 py-4">{sale.quantity}</td>
                                <td className="px-6 py-4 text-green-600">R$ {sale.totalRevenue.toFixed(2)}</td>
                                <td className="px-6 py-4 text-red-600">R$ {sale.totalCost.toFixed(2)}</td>
                                <td className="px-6 py-4 font-bold text-oliva">R$ {sale.netProfit.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registrar Nova Venda">
                <div className="space-y-4">
                    <Select label="Produto Vendido" value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)}>
                        <option value="">Selecione um produto</option>
                        {finishedProducts.filter(p => p.stock > 0).map(p => (
                            <option key={p.id} value={p.id}>{p.name} (Estoque: {p.stock})</option>
                        ))}
                    </Select>
                    <Input label="Quantidade" type="number" min="1" max={productMap.get(selectedProductId)?.stock || 1} value={quantity} onChange={e => setQuantity(parseInt(e.target.value, 10) || 1)} />

                    <div className="space-y-4">
                      {(Object.entries(costGroups) as [string, Cost[]][]).map(([type, costsOfType]) => costsOfType.length > 0 && (
                        <div key={type}>
                          <h3 className="text-lg font-semibold text-espresso">{type}</h3>
                          <div className="flex flex-wrap gap-2 mt-2">
                              {costsOfType.map(cost => (
                                  <button
                                      key={cost.id}
                                      onClick={() => handleCostToggle(cost.id)}
                                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${appliedCostIds.includes(cost.id) ? 'bg-oliva text-crema' : 'bg-lino text-espresso'}`}
                                  >
                                      {cost.name} ({cost.isPercentage ? `${cost.value}%` : `R$ ${cost.value.toFixed(2)}`})
                                  </button>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 p-4 rounded-lg bg-lino text-espresso space-y-2">
                        <h4 className="font-bold text-lg">Resumo Financeiro</h4>
                        <div className="flex justify-between"><p>Receita:</p> <p className="font-mono text-green-500">+ R$ {saleSummary.revenue.toFixed(2)}</p></div>
                        <div className="flex justify-between"><p>Custo de Produção:</p> <p className="font-mono text-red-500">- R$ {saleSummary.productionCost.toFixed(2)}</p></div>
                        <div className="flex justify-between"><p>Custos Variáveis:</p> <p className="font-mono text-red-500">- R$ {saleSummary.variableCosts.toFixed(2)}</p></div>
                        <hr className="border-crema"/>
                        <div className="flex justify-between font-bold text-xl"><p>Lucro Líquido:</p> <p className="font-mono text-oliva">R$ {saleSummary.profit.toFixed(2)}</p></div>
                    </div>

                    <Button onClick={handleRegisterSale} className="w-full" disabled={isRegistering}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        {isRegistering ? 'Registrando...' : 'Confirmar Venda'}
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default Sales;