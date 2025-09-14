
import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext.tsx';
import { DREPeriodData, DRECategory, DREItem } from '../types.ts';
import Button from '../components/ui/Button.tsx';
import Select from '../components/ui/Select.tsx';
import Modal from '../components/Modal.tsx';
import Input from '../components/ui/Input.tsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const formatCurrency = (value: number) => `R$ ${value.toFixed(2)}`;

const DRE: React.FC = () => {
  const { dreData, getDreData, updateDreData, sales, finishedProducts, dreItems, updateDreItems } = useData();
  
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [periodData, setPeriodData] = useState<DREPeriodData>({});
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  
  const selectedPeriod = useMemo(() => `${year}-${String(month).padStart(2, '0')}`, [year, month]);
  const productMap = useMemo(() => new Map(finishedProducts.map(p => [p.id, p])), [finishedProducts]);

  const autoCalculatedRevenue = useMemo(() => {
    const revenues: { [itemId: string]: number } = {};
    const salesInPeriod = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate.getFullYear() === year && saleDate.getMonth() + 1 === month;
    });

    salesInPeriod.forEach(sale => {
      const product = productMap.get(sale.finishedProductId);
      const category = product?.category || 'Outro';
      let itemId = 'outrasVendas';
      if (category === 'Café/Bebida') itemId = 'vendaCafes';
      else if (category === 'Alimento') itemId = 'vendaAlimentos';
      
      revenues[itemId] = (revenues[itemId] || 0) + sale.totalRevenue;
    });
    return revenues;
  }, [sales, productMap, year, month]);

  useEffect(() => {
    const loadPeriodData = async () => {
        const savedDreData = await getDreData(selectedPeriod);
        const savedData = savedDreData ? savedDreData.data : {};
        const newPeriodData: DREPeriodData = {};

        dreItems.forEach(item => {
            let value = savedData[item.id] || 0;
            if (item.id in autoCalculatedRevenue) {
                value = autoCalculatedRevenue[item.id];
            }
            newPeriodData[item.id] = value;
        });
        setPeriodData(newPeriodData);
    };

    loadPeriodData();
  }, [selectedPeriod, dreData, dreItems, autoCalculatedRevenue, getDreData]);

  const handleInputChange = (itemId: string, value: string) => {
    setPeriodData(prev => ({ ...prev, [itemId]: parseFloat(value) || 0 }));
  };

  const handleSave = async () => {
    try {
      await updateDreData({ period: selectedPeriod, data: periodData });
      alert(`Dados de ${selectedPeriod} salvos com sucesso!`);
    } catch (error) {
        console.error(error);
        alert('Falha ao salvar os dados do DRE.');
    }
  };

  const dreStructure = useMemo(() => {
    const structure: { [key in DRECategory]?: DREItem[] } = {};
    for (const category in DRECategory) {
      const categoryValue = DRECategory[category as keyof typeof DRECategory];
      structure[categoryValue] = dreItems.filter(item => item.category === categoryValue);
    }
    return structure;
  }, [dreItems]);

  const calculations = useMemo(() => {
    const getCategoryTotal = (category: DRECategory) => 
      (dreStructure[category] || []).reduce((sum, item) => sum + (periodData[item.id] || 0), 0);
    
    const receitaBruta = getCategoryTotal(DRECategory.REVENUE);
    const deducoes = getCategoryTotal(DRECategory.DEDUCTION);
    const cpv = getCategoryTotal(DRECategory.COST);
    const despesasOperacionais = getCategoryTotal(DRECategory.EXPENSE);
    
    const receitaLiquida = receitaBruta - deducoes;
    const lucroBruto = receitaLiquida - cpv;
    const resultadoOperacional = lucroBruto - despesasOperacionais;

    return { receitaBruta, deducoes, receitaLiquida, cpv, lucroBruto, despesasOperacionais, resultadoOperacional };
  }, [periodData, dreStructure]);

  const getExportData = () => {
    const data: { label: string, value: number, type: 'item' | 'subtotal' | 'final' }[] = [];
    const pushCategory = (title: string, category: DRECategory, prefix: string, total: number) => {
      data.push({ label: `${prefix} ${title}`, value: total, type: 'subtotal' });
      (dreStructure[category] || []).forEach(item => {
        data.push({ label: `   ${item.name}`, value: periodData[item.id] || 0, type: 'item' });
      });
    };

    pushCategory('1. Receita Operacional Bruta', DRECategory.REVENUE, '(+)', calculations.receitaBruta);
    pushCategory('2. Deduções da Receita Bruta', DRECategory.DEDUCTION, '(-)', calculations.deducoes);
    data.push({ label: '(=) 3. Receita Operacional Líquida', value: calculations.receitaLiquida, type: 'subtotal' });
    pushCategory('4. Custos dos Produtos Vendidos (CPV)', DRECategory.COST, '(-)', calculations.cpv);
    data.push({ label: '(=) 5. Lucro Bruto', value: calculations.lucroBruto, type: 'subtotal' });
    pushCategory('6. Despesas Operacionais', DRECategory.EXPENSE, '(-)', calculations.despesasOperacionais);
    data.push({ label: '(=) 7. Resultado Operacional (Lucro/Prejuízo)', value: calculations.resultadoOperacional, type: 'final' });
    
    return data;
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const exportData = getExportData();
    const monthName = new Date(year, month - 1).toLocaleString('pt-BR', { month: 'long' });
    doc.text(`DRE - ${monthName} de ${year}`, 14, 16);
    const tableBody = exportData.map(item => [item.label, formatCurrency(item.value)]);
    (doc as any).autoTable({
        startY: 22, head: [['Descrição', 'Valor']], body: tableBody, theme: 'grid',
        headStyles: { fillColor: '#5E3A2E' }, // Espresso
        didDrawCell: (data: any) => {
            if (exportData[data.row.index]) {
                const item = exportData[data.row.index];
                if (item.type === 'subtotal' || item.type === 'final') doc.setFont(doc.getFont().fontName, 'bold');
                if (item.type === 'subtotal') doc.setFillColor('#E9DFD3'); // Lino
                if (item.type === 'final') {
                    doc.setFillColor(item.value >= 0 ? '#6A6C4F' : '#991B1B'); // Oliva or Red
                    doc.setTextColor('#FAF3E3'); // Crema
                }
            }
        },
    });
    doc.save(`DRE_${selectedPeriod}.pdf`);
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(getExportData().map(d => ({ Descrição: d.label, Valor: d.value })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DRE');
    worksheet['!cols'] = [{ wch: 50 }, { wch: 20 }];
    XLSX.writeFile(workbook, `DRE_${selectedPeriod}.xlsx`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-espresso">Demonstração de Resultado (DRE)</h1>

      <div className="bg-lino p-4 rounded-xl shadow-lg flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
            <h2 className="text-xl font-bold">Período:</h2>
            <div className="flex gap-4">
              <Select label="Mês" value={month} onChange={e => setMonth(parseInt(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}</option>)}
              </Select>
              <Select label="Ano" value={year} onChange={e => setYear(parseInt(e.target.value))}>
                {Array.from({ length: 10 }, (_, i) => <option key={currentYear - 5 + i} value={currentYear - 5 + i}>{currentYear - 5 + i}</option>)}
              </Select>
            </div>
        </div>
        <Button onClick={() => setIsCustomizeModalOpen(true)} variant="secondary">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Customizar DRE
        </Button>
      </div>
      
      <div className="bg-crema p-4 sm:p-6 rounded-xl shadow-lg space-y-2">
        <DRECategorySection title="(+) 1. Receita Operacional Bruta" items={dreStructure[DRECategory.REVENUE]} periodData={periodData} onInputChange={handleInputChange} autoCalculatedRevenue={autoCalculatedRevenue} subtotal={calculations.receitaBruta} />
        <DRECategorySection title="(-) 2. Deduções da Receita Bruta" items={dreStructure[DRECategory.DEDUCTION]} periodData={periodData} onInputChange={handleInputChange} subtotal={calculations.deducoes} />
        <DREField label="(=) 3. Receita Operacional Líquida" value={calculations.receitaLiquida} isSubtotal />
        <DRECategorySection title="(-) 4. Custos dos Produtos Vendidos (CPV)" items={dreStructure[DRECategory.COST]} periodData={periodData} onInputChange={handleInputChange} subtotal={calculations.cpv} />
        <DREField label="(=) 5. Lucro Bruto" value={calculations.lucroBruto} isSubtotal />
        <DRECategorySection title="(-) 6. Despesas Operacionais" items={dreStructure[DRECategory.EXPENSE]} periodData={periodData} onInputChange={handleInputChange} subtotal={calculations.despesasOperacionais} />
        <DREField label="(=) 7. Resultado Operacional (Lucro/Prejuízo)" value={calculations.resultadoOperacional} isFinal />
        <div className="pt-4 flex flex-wrap justify-end gap-2">
            <Button onClick={handleExportPDF} variant="secondary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Exportar PDF
            </Button>
            <Button onClick={handleExportExcel} variant="secondary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Exportar Excel
            </Button>
            <Button onClick={handleSave}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
              Salvar DRE
            </Button>
        </div>
      </div>
      <CustomizeDREModal isOpen={isCustomizeModalOpen} onClose={() => setIsCustomizeModalOpen(false)} />
    </div>
  );
};

// Sub-components
const DREField: React.FC<{ label: string; value: number; isInput?: boolean; itemId?: string; isSubtotal?: boolean; isFinal?: boolean; readOnly?: boolean; onInputChange?: (itemId: string, value: string) => void; }> = ({ label, value, isInput, itemId, isSubtotal, isFinal, readOnly, onInputChange }) => (
  <div className={`flex justify-between items-center py-2 px-3 rounded-md ${isInput ? 'ml-4' : ''} ${isSubtotal ? 'bg-lino mt-2' : ''} ${isFinal ? 'bg-oliva text-crema mt-4' : ''}`}>
    <span className={`font-medium ${isSubtotal || isFinal ? 'font-bold' : ''}`}>{label}</span>
    {isInput && itemId && onInputChange ? (
      <input type="number" value={value} onChange={e => onInputChange(itemId, e.target.value)} readOnly={readOnly} className={`w-32 text-right border-b border-lino focus:outline-none focus:border-oliva text-espresso ${readOnly ? 'bg-lino cursor-default' : 'bg-crema'}`} />
    ) : (
      <span className={`font-semibold font-mono ${isFinal ? (value >= 0 ? 'text-green-300' : 'text-red-300') : ''}`}>{formatCurrency(value)}</span>
    )}
  </div>
);

const DRECategorySection: React.FC<{ title: string; items?: DREItem[]; periodData: DREPeriodData; onInputChange: (itemId: string, value: string) => void; subtotal: number; autoCalculatedRevenue?: { [key:string]: number } }> = ({ title, items = [], periodData, onInputChange, subtotal, autoCalculatedRevenue }) => (
  <>
    <DREField label={title} value={subtotal} isSubtotal />
    {items.map(item => (
      <DREField key={item.id} label={item.name} value={periodData[item.id] || 0} isInput itemId={item.id} onInputChange={onInputChange} readOnly={autoCalculatedRevenue && item.id in autoCalculatedRevenue} />
    ))}
  </>
);

const CustomizeDREModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { dreItems, updateDreItems } = useData();
  const [localItems, setLocalItems] = useState<DREItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      setLocalItems(JSON.parse(JSON.stringify(dreItems)));
    }
  }, [isOpen, dreItems]);

  const handleAddItem = (category: DRECategory) => {
    const newItemName = prompt(`Nome do novo item para "${category}":`);
    if (newItemName) {
      const newItem: DREItem = {
        id: crypto.randomUUID(),
        name: newItemName,
        category,
        isDefault: false,
      };
      setLocalItems(prev => [...prev, newItem]);
    }
  };

  const handleRenameItem = (itemToRename: DREItem) => {
    const newName = prompt(`Novo nome para "${itemToRename.name}":`, itemToRename.name);
    if (newName && newName !== itemToRename.name) {
      setLocalItems(prev => prev.map(item => item.id === itemToRename.id ? { ...item, name: newName } : item));
    }
  };

  const handleDeleteItem = (itemToDelete: DREItem) => {
    if (window.confirm(`Tem certeza que deseja excluir "${itemToDelete.name}"?`)) {
      setLocalItems(prev => prev.filter(item => item.id !== itemToDelete.id));
    }
  };

  const handleSave = async () => {
    try {
      await updateDreItems(localItems);
      onClose();
    } catch (error) {
        console.error(error);
        alert('Falha ao salvar a customização do DRE.');
    }
  };

  const groupedItems = useMemo(() => {
      const groups: Record<string, DREItem[]> = {};
      localItems.forEach(item => {
          if (!groups[item.category]) groups[item.category] = [];
          groups[item.category].push(item);
      });
      return groups;
  }, [localItems]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Customizar Estrutura do DRE">
      <div className="space-y-6">
        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold text-espresso">{category}</h3>
              <Button variant="secondary" className="!p-1.5" onClick={() => handleAddItem(category as DRECategory)} aria-label={`Adicionar item em ${category}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              </Button>
            </div>
            <ul className="space-y-2">
              {items.map(item => (
                <li key={item.id} className="flex justify-between items-center p-2 bg-lino rounded-md">
                  <span className="text-oliva">{item.name}</span>
                  {!item.isDefault && (
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" className="!p-1.5" onClick={() => handleRenameItem(item)} aria-label={`Renomear ${item.name}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                      </Button>
                      <Button variant="danger" className="!p-1.5" onClick={() => handleDeleteItem(item)} aria-label={`Excluir ${item.name}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            Salvar Customização
          </Button>
        </div>
      </div>
    </Modal>
  );
};


export default DRE;
