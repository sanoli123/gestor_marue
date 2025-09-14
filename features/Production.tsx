

import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext.tsx';
import { Id, ProductType, RecipeItem } from '../types.ts';
import Select from '../components/ui/Select.tsx';
import Input from '../components/ui/Input.tsx';
import Button from '../components/ui/Button.tsx';

const Production: React.FC = () => {
  const { finishedProducts, rawMaterials, executeProduction } = useData();
  const [selectedProductId, setSelectedProductId] = useState<Id | ''>('');
  const [productionQuantity, setProductionQuantity] = useState(1);
  const [editableRecipe, setEditableRecipe] = useState<RecipeItem[]>([]);
  const [isProducing, setIsProducing] = useState(false);

  const producibleProducts = useMemo(() => 
    finishedProducts.filter(p => p.type === ProductType.PRODUCED),
    [finishedProducts]
  );
  
  const rawMaterialMap = useMemo(() => new Map(rawMaterials.map(rm => [rm.id, rm])), [rawMaterials]);

  const handleProductChange = (productId: Id) => {
    setSelectedProductId(productId);
    const product = producibleProducts.find(p => p.id === productId);
    // Deep copy to prevent modifying the original recipe
    setEditableRecipe(product?.recipe ? JSON.parse(JSON.stringify(product.recipe)) : []);
  };

  const handleRecipeItemChange = (index: number, field: keyof RecipeItem, value: string) => {
    const newRecipe = [...editableRecipe];
    const newValue = field === 'quantity' ? parseFloat(value) || 0 : value;
    (newRecipe[index] as any)[field] = newValue;
    setEditableRecipe(newRecipe);
  };
  
  const handleAddItem = () => {
    setEditableRecipe(prev => [...prev, { rawMaterialId: '', quantity: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setEditableRecipe(prev => prev.filter((_, i) => i !== index));
  };


  const stockCheck = useMemo(() => {
    return editableRecipe.map(item => {
        const material = rawMaterialMap.get(item.rawMaterialId);
        const required = item.quantity * productionQuantity;
        const available = material?.stock ?? 0;
        return {
            ...item,
            materialName: material?.name ?? 'Selecione...',
            required,
            available,
            hasStock: available >= required,
        };
    });
  }, [editableRecipe, productionQuantity, rawMaterialMap]);
  
  const canProduce = stockCheck.length > 0 && stockCheck.every(item => item.hasStock && item.rawMaterialId) && productionQuantity > 0;

  const handleProduce = async () => {
    if(!canProduce || !selectedProductId) return;
    setIsProducing(true);
    try {
      await executeProduction(selectedProductId, productionQuantity, editableRecipe);
      alert('Produção executada com sucesso!');
      setProductionQuantity(1);
      setSelectedProductId('');
      setEditableRecipe([]);
    } catch (error) {
      console.error(error);
      alert(`Falha ao executar a produção: ${(error as Error).message}`);
    } finally {
      setIsProducing(false);
    }
  }

  const selectedProduct = producibleProducts.find(p => p.id === selectedProductId);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-espresso">Registrar Produção</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-lino p-6 rounded-xl shadow-lg space-y-4 self-start">
            <h2 className="text-xl font-bold">1. Selecionar Produto e Quantidade</h2>
            <Select
                label="Produto a ser produzido"
                value={selectedProductId}
                onChange={(e) => handleProductChange(e.target.value)}
            >
                <option value="">Selecione um produto</option>
                {producibleProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                ))}
            </Select>
            <Input
                label="Quantidade a produzir"
                type="number"
                value={productionQuantity}
                onChange={(e) => setProductionQuantity(Math.max(1, parseInt(e.target.value, 10)) || 1)}
                min="1"
            />
        </div>

        {selectedProduct && (
          <div className="bg-lino p-6 rounded-xl shadow-lg space-y-4">
            <h2 className="text-xl font-bold">2. Receita e Estoque</h2>
            <p className="text-sm text-oliva">Ajuste os insumos para esta produção específica.</p>
            <div className="space-y-3">
              {stockCheck.map((item, index) => (
                <div key={index} className="p-3 bg-crema rounded-md border border-lino/50">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:gap-2">
                       <Select 
                          label="" 
                          value={item.rawMaterialId} 
                          onChange={e => handleRecipeItemChange(index, 'rawMaterialId', e.target.value)}
                          className="flex-grow mb-2 sm:mb-0"
                        >
                          <option value="">Selecione o insumo</option>
                          {rawMaterials.map(rm => <option key={rm.id} value={rm.id}>{rm.name}</option>)}
                        </Select>
                        <div className="flex items-end gap-2">
                           <Input label="" type="number" value={item.quantity} onChange={e => handleRecipeItemChange(index, 'quantity', e.target.value)} className="w-24" />
                           <span className="pb-2 w-12 text-sm text-oliva">{rawMaterialMap.get(item.rawMaterialId)?.unit || 'un'}</span>
                           <Button variant="danger" onClick={() => handleRemoveItem(index)} className="!p-2" aria-label="Remover insumo">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                           </Button>
                        </div>
                    </div>
                    {item.rawMaterialId && (
                      <div className="flex justify-between items-center text-sm mt-2 pt-2 border-t border-lino">
                          <span className="text-oliva">Necessário: {item.required.toFixed(2)}</span>
                          <span className={`font-bold ${item.hasStock ? 'text-green-500' : 'text-red-500'}`}>
                              Disponível: {item.available.toFixed(2)}
                          </span>
                      </div>
                    )}
                </div>
              ))}
            </div>
            <Button variant="secondary" onClick={handleAddItem} className="mt-4 w-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Adicionar Insumo
            </Button>
            <Button onClick={handleProduce} disabled={!canProduce || isProducing} className="w-full mt-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {isProducing ? 'Produzindo...' : 'Executar Produção'}
            </Button>
            {!canProduce && productionQuantity > 0 && <p className="text-center text-red-500 text-sm mt-2">Verifique o estoque ou se todos os insumos foram selecionados.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default Production;