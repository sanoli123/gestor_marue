
import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext.tsx';
import Button from '../components/ui/Button.tsx';
import Modal from '../components/Modal.tsx';
import Input from '../components/ui/Input.tsx';
import Select from '../components/ui/Select.tsx';
import { RawMaterial, FinishedProduct, ProductType, RecipeItem, ProductCategory } from '../types.ts';
import PersistentImage from '../components/PersistentImage.tsx';

const MAX_IMAGES = 10;

const RawMaterialsTab = () => {
  const { rawMaterials, addRawMaterial, updateRawMaterial, deleteRawMaterial, uploadImage } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState<Partial<RawMaterial> | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImageIds, setExistingImageIds] = useState<string[]>([]);

  const openModal = (material: Partial<RawMaterial> | null = null) => {
    setCurrentMaterial(material || {});
    setExistingImageIds(material?.imageIds || []);
    setImageFiles([]);
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);

  const handleSave = async () => {
    if (!currentMaterial || !currentMaterial.name) return alert('Nome é obrigatório');
    try {
      let finalImageIds = [...existingImageIds];
      if (imageFiles.length > 0) {
        const uploadPromises = imageFiles.map(file => uploadImage(file));
        const newIds = await Promise.all(uploadPromises);
        finalImageIds.push(...newIds);
      }
      const materialData = { ...currentMaterial, imageIds: finalImageIds };

      if (materialData.id) {
        await updateRawMaterial(materialData as RawMaterial);
      } else {
        await addRawMaterial(materialData as Omit<RawMaterial, 'id'>);
      }
      closeModal();
    } catch (error) {
      console.error(error);
      alert('Falha ao salvar matéria-prima.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir?')) {
      try {
        await deleteRawMaterial(id);
      } catch (error) {
        console.error(error);
        alert('Falha ao excluir matéria-prima.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const totalImages = existingImageIds.length + imageFiles.length + files.length;
      if (totalImages > MAX_IMAGES) {
        alert(`Você pode enviar no máximo ${MAX_IMAGES} imagens.`);
        return;
      }
      setImageFiles(prev => [...prev, ...files]);
    }
  };

  return (
    <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Matéria-Prima</h2>
            <Button onClick={() => openModal(null)}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Adicionar
            </Button>
        </div>
        <div className="bg-crema shadow-md rounded-lg overflow-x-auto">
            <table className="w-full text-sm text-left text-oliva">
                <thead className="text-xs text-espresso uppercase bg-lino">
                    <tr>
                        <th className="px-6 py-3">Imagem</th>
                        <th className="px-6 py-3">Nome</th>
                        <th className="px-6 py-3">Estoque</th>
                        <th className="px-6 py-3">Unidade</th>
                        <th className="px-6 py-3">Custo/Unidade</th>
                        <th className="px-6 py-3">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {rawMaterials.map(rm => (
                        <tr key={rm.id} className="bg-crema border-b border-lino hover:bg-lino">
                            <td className="px-6 py-2">
                               {rm.imageIds && rm.imageIds[0] ? (
                                    <PersistentImage imageId={rm.imageIds[0]} alt={rm.name} className="h-12 w-12 object-cover rounded-md" />
                                ) : (
                                    <div className="h-12 w-12 bg-lino rounded-md flex items-center justify-center text-oliva text-xs">Sem Img</div>
                                )}
                            </td>
                            <td className="px-6 py-4 font-medium text-espresso">{rm.name}</td>
                            <td className="px-6 py-4">{rm.stock}</td>
                            <td className="px-6 py-4">{rm.unit}</td>
                            <td className="px-6 py-4">R$ {rm.costPerUnit.toFixed(2)}</td>
                            <td className="px-6 py-4 flex items-center space-x-2">
                                <Button variant="secondary" onClick={() => openModal(rm)} className="!p-2" aria-label={`Editar ${rm.name}`}>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                                </Button>
                                <Button variant="danger" onClick={() => handleDelete(rm.id)} className="!p-2" aria-label={`Excluir ${rm.name}`}>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <Modal isOpen={isModalOpen} onClose={closeModal} title={currentMaterial?.id ? 'Editar Matéria-Prima' : 'Adicionar Matéria-Prima'}>
            <div className="space-y-4">
                <Input label="Nome" value={currentMaterial?.name || ''} onChange={e => setCurrentMaterial({...currentMaterial, name: e.target.value})} />
                <Input label="Estoque" type="number" value={currentMaterial?.stock || ''} onChange={e => setCurrentMaterial({...currentMaterial, stock: parseFloat(e.target.value) || 0})} />
                <Input label="Unidade (g, kg, un)" value={currentMaterial?.unit || ''} onChange={e => setCurrentMaterial({...currentMaterial, unit: e.target.value})} />
                <Input label="Custo por Unidade" type="number" value={currentMaterial?.costPerUnit || ''} onChange={e => setCurrentMaterial({...currentMaterial, costPerUnit: parseFloat(e.target.value) || 0})} />
                
                 <div>
                    <label className="block text-sm font-medium text-oliva mb-1">Imagens (Máx. {MAX_IMAGES})</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 border border-lino p-2 rounded-md">
                        {existingImageIds.map((id, index) => (
                            <div key={id} className="relative group">
                                <PersistentImage imageId={id} alt={`Imagem ${index + 1}`} className="h-24 w-24 object-cover rounded-md" />
                                <button onClick={() => setExistingImageIds(prev => prev.filter((imgId) => imgId !== id))} className="absolute top-0 right-0 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity" aria-label={`Remover Imagem ${index + 1}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        ))}
                        {imageFiles.map((file, index) => (
                             <div key={index} className="relative group">
                                <img src={URL.createObjectURL(file)} alt={`Nova Imagem ${index + 1}`} className="h-24 w-24 object-cover rounded-md" />
                                <button onClick={() => setImageFiles(prev => prev.filter((_, i) => i !== index))} className="absolute top-0 right-0 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity" aria-label={`Remover Nova Imagem ${index + 1}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        ))}
                        {(existingImageIds.length + imageFiles.length) < MAX_IMAGES && (
                            <label className="h-24 w-24 flex items-center justify-center border-2 border-dashed border-lino rounded-md cursor-pointer hover:bg-lino">
                                <div className="text-center text-oliva">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    <span className="text-xs">Adicionar</span>
                                </div>
                                <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                            </label>
                        )}
                    </div>
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

const FinishedProductsTab = () => {
  const { finishedProducts, rawMaterials, getProductCost, addProduct, updateProduct, deleteProduct, skuConfig, generateSKU, uploadImage } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<FinishedProduct> | null>(null);
  const [skuPreview, setSkuPreview] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImageIds, setExistingImageIds] = useState<string[]>([]);

  const openModal = (product: Partial<FinishedProduct> | null = null) => {
    const initialProduct = product || {
        type: ProductType.PRODUCED,
        recipe: [],
        category: 'Outro',
        grind: 'N/A',
        weightUnit: 'g'
    };
    setCurrentProduct(initialProduct);
    setExistingImageIds(product?.imageIds || []);
    setImageFiles([]);
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    if (currentProduct && skuConfig) {
        // Always generate a live preview based on the current form data
        const preview = generateSKU(currentProduct, true);
        const originalProduct = currentProduct.id ? finishedProducts.find(p => p.id === currentProduct.id) : null;
        
        // If it's an existing product and the core SKU attributes haven't changed, show the original SKU.
        // Otherwise, show the new preview.
        if (originalProduct && originalProduct.sku?.startsWith(preview.substring(0, preview.lastIndexOf('-') + 1))) {
            setSkuPreview(originalProduct.sku);
        } else {
            setSkuPreview(preview);
        }
    } else {
        setSkuPreview('');
    }
  }, [currentProduct, generateSKU, finishedProducts, skuConfig]);

  const handleSave = async () => {
    if (!currentProduct || !currentProduct.name || !currentProduct.type || currentProduct.stock === undefined || currentProduct.salePrice === undefined) {
      return alert('Nome, Tipo, Estoque e Preço de Venda são obrigatórios');
    }

    try {
      let finalImageIds = [...existingImageIds];
      if (imageFiles.length > 0) {
        const uploadPromises = imageFiles.map(file => uploadImage(file));
        const newIds = await Promise.all(uploadPromises);
        finalImageIds.push(...newIds);
      }
      
      let productData = { ...currentProduct, imageIds: finalImageIds };

      if (productData.id) {
        // --- Logic for UPDATE: Check if SKU needs regeneration ---
        const originalProduct = finishedProducts.find(p => p.id === productData.id);
        const originalPrefix = originalProduct?.sku?.substring(0, originalProduct.sku.lastIndexOf('-') + 1);
        
        const newSkuPreview = generateSKU(productData, true);
        const newPrefix = newSkuPreview.substring(0, newSkuPreview.lastIndexOf('-') + 1);
        
        // If the core attributes have changed, generate a completely new and unique SKU
        if (originalPrefix !== newPrefix) {
          const newSku = generateSKU(productData, false);
          productData.sku = newSku;
          alert(`As características do produto mudaram. Um novo SKU foi gerado: ${newSku}`);
        }
        // --- End of regeneration logic ---
        
        await updateProduct(productData as FinishedProduct);
      } else {
        await addProduct(productData as Omit<FinishedProduct, 'id' | 'sku'>);
      }
      closeModal();
    } catch (error) {
      console.error(error);
      alert('Falha ao salvar o produto.');
    }
  };
  
  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir?')) {
      try {
        await deleteProduct(id);
      } catch (error) {
        console.error(error);
        alert('Falha ao excluir o produto.');
      }
    }
  }

  const handleRecipeChange = (index: number, field: keyof RecipeItem, value: string) => {
    if(!currentProduct || !currentProduct.recipe) return;
    const newRecipe = [...currentProduct.recipe];
    (newRecipe[index] as any)[field] = field === 'quantity' ? parseFloat(value) : value;
    setCurrentProduct({...currentProduct, recipe: newRecipe});
  }

  const addRecipeItem = () => {
    if(!currentProduct) return;
    const newRecipe = [...(currentProduct.recipe || []), {rawMaterialId: '', quantity: 0}];
    setCurrentProduct({...currentProduct, recipe: newRecipe});
  }

  const removeRecipeItem = (index: number) => {
    if(!currentProduct || !currentProduct.recipe) return;
    const newRecipe = currentProduct.recipe.filter((_, i) => i !== index);
    setCurrentProduct({...currentProduct, recipe: newRecipe});
  }

   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const totalImages = existingImageIds.length + imageFiles.length + files.length;
      if (totalImages > MAX_IMAGES) {
        alert(`Você pode enviar no máximo ${MAX_IMAGES} imagens.`);
        return;
      }
      setImageFiles(prev => [...prev, ...files]);
    }
  };

  const baseCost = currentProduct ? getProductCost(currentProduct) : 0;
  
  return (
    <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Produtos Finais</h2>
            <Button onClick={() => openModal(null)}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Adicionar
            </Button>
        </div>
        <div className="bg-crema shadow-md rounded-lg overflow-x-auto">
            <table className="w-full text-sm text-left text-oliva">
                <thead className="text-xs text-espresso uppercase bg-lino">
                    <tr>
                        <th className="px-6 py-3">Imagem</th>
                        <th className="px-6 py-3">SKU</th>
                        <th className="px-6 py-3">Nome</th>
                        <th className="px-6 py-3">Estoque</th>
                        <th className="px-6 py-3">Custo Final</th>
                        <th className="px-6 py-3">Preço Venda</th>
                        <th className="px-6 py-3">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {finishedProducts.map(fp => (
                        <tr key={fp.id} className="bg-crema border-b border-lino hover:bg-lino">
                            <td className="px-6 py-2">
                              {fp.imageIds && fp.imageIds[0] ? (
                                  <PersistentImage imageId={fp.imageIds[0]} alt={fp.name} className="h-12 w-12 object-cover rounded-md" />
                              ) : (
                                  <div className="h-12 w-12 bg-lino rounded-md flex items-center justify-center text-oliva text-xs">Sem Img</div>
                              )}
                            </td>
                            <td className="px-6 py-4 font-mono text-xs">{fp.sku || 'N/A'}</td>
                            <td className="px-6 py-4 font-medium text-espresso">{fp.name}</td>
                            <td className="px-6 py-4">{fp.stock}</td>
                            <td className="px-6 py-4">R$ {getProductCost(fp).toFixed(2)}</td>
                            <td className="px-6 py-4">R$ {fp.salePrice?.toFixed(2) || '0.00'}</td>
                            <td className="px-6 py-4 flex items-center space-x-2">
                                <Button variant="secondary" onClick={() => openModal(fp)} className="!p-2" aria-label={`Editar ${fp.name}`}>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                                </Button>
                                <Button variant="danger" onClick={() => handleDelete(fp.id)} className="!p-2" aria-label={`Excluir ${fp.name}`}>
                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        <Modal isOpen={isModalOpen} onClose={closeModal} title={currentProduct?.id ? 'Editar Produto Final' : 'Adicionar Produto Final'}>
            <div className="space-y-4">
                <Input label="Nome do Produto" value={currentProduct?.name || ''} onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})} />
                
                <div>
                    <label className="block text-sm font-medium text-oliva mb-1">Imagens (Máx. {MAX_IMAGES})</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 border border-lino p-2 rounded-md">
                        {existingImageIds.map((id, index) => (
                            <div key={id} className="relative group">
                                <PersistentImage imageId={id} alt={`Imagem ${index + 1}`} className="h-24 w-24 object-cover rounded-md" />
                                <button onClick={() => setExistingImageIds(prev => prev.filter(imgId => imgId !== id))} className="absolute top-0 right-0 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity" aria-label={`Remover Imagem ${index + 1}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        ))}
                        {imageFiles.map((file, index) => (
                             <div key={index} className="relative group">
                                <img src={URL.createObjectURL(file)} alt={`Nova Imagem ${index + 1}`} className="h-24 w-24 object-cover rounded-md" />
                                <button onClick={() => setImageFiles(prev => prev.filter((_, i) => i !== index))} className="absolute top-0 right-0 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity" aria-label={`Remover Nova Imagem ${index + 1}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        ))}
                        {(existingImageIds.length + imageFiles.length) < MAX_IMAGES && (
                            <label className="h-24 w-24 flex items-center justify-center border-2 border-dashed border-lino rounded-md cursor-pointer hover:bg-lino">
                                <div className="text-center text-oliva">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    <span className="text-xs">Adicionar</span>
                                </div>
                                <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                            </label>
                        )}
                    </div>
                </div>

                <Input label="Estoque Inicial" type="number" value={currentProduct?.stock || ''} onChange={e => setCurrentProduct({...currentProduct, stock: parseFloat(e.target.value) || 0})} />
                <Select label="Tipo de Produto (Contábil)" value={currentProduct?.type || ''} onChange={e => setCurrentProduct({...currentProduct, type: e.target.value as ProductType})}>
                    <option value={ProductType.PRODUCED}>Produzido</option>
                    <option value={ProductType.RESOLD}>Revenda</option>
                </Select>
                <Select label="Categoria (para DRE)" value={currentProduct?.category || 'Outro'} onChange={e => setCurrentProduct({...currentProduct, category: e.target.value as ProductCategory})}>
                    <option value="Café/Bebida">Café/Bebida</option>
                    <option value="Alimento">Alimento</option>
                    <option value="Outro">Outro</option>
                </Select>
                
                <div className="p-4 rounded-lg bg-lino/50 border border-lino mt-4">
                    <h3 className="text-lg font-semibold mb-3 text-espresso">Gerador de SKU</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Select label="Tipo de Produto (SKU)" value={currentProduct?.skuProductTypeId || ''} onChange={e => setCurrentProduct({...currentProduct, skuProductTypeId: e.target.value})}>
                          <option value="">Selecione...</option>
                          {skuConfig?.productTypes.map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
                      </Select>
                      <Select label="Origem (SKU)" value={currentProduct?.skuOriginId || ''} onChange={e => setCurrentProduct({...currentProduct, skuOriginId: e.target.value})}>
                          <option value="">Selecione...</option>
                          {skuConfig?.origins.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                      </Select>
                      <div className="flex gap-2">
                        <Input label="Peso" type="number" value={currentProduct?.weight || ''} onChange={e => setCurrentProduct({...currentProduct, weight: parseFloat(e.target.value) || 0})} className="flex-grow"/>
                        <Select label="Un." value={currentProduct?.weightUnit || 'g'} onChange={e => setCurrentProduct({...currentProduct, weightUnit: e.target.value as 'g' | 'kg'})} className="w-20">
                           <option value="g">g</option>
                           <option value="kg">kg</option>
                        </Select>
                      </div>
                      <Select label="Moagem" value={currentProduct?.grind || 'N/A'} onChange={e => setCurrentProduct({...currentProduct, grind: e.target.value as 'Grãos' | 'Moído' | 'N/A'})}>
                        <option value="N/A">N/A</option>
                        <option value="Grãos">Grãos</option>
                        <option value="Moído">Moído</option>
                      </Select>
                    </div>
                    <Input label="SKU Preview" value={skuPreview} readOnly className="mt-4 bg-lino !cursor-default font-mono"/>
                </div>

                {currentProduct?.type === ProductType.RESOLD && (
                  <Input label="Custo de Revenda" type="number" value={currentProduct?.resaleCost || ''} onChange={e => setCurrentProduct({...currentProduct, resaleCost: parseFloat(e.target.value) || 0})} />
                )}

                {currentProduct?.type === ProductType.PRODUCED && (
                  <div>
                    <h3 className="text-lg font-semibold mt-4 mb-2 text-espresso">Receita</h3>
                    {currentProduct.recipe?.map((item, index) => (
                      <div key={index} className="flex items-end gap-2 mb-2">
                        <Select label="" value={item.rawMaterialId} onChange={e => handleRecipeChange(index, 'rawMaterialId', e.target.value)} className="flex-grow">
                            <option value="">Selecione a matéria-prima</option>
                            {rawMaterials.map(rm => <option key={rm.id} value={rm.id}>{rm.name}</option>)}
                        </Select>
                        <Input label="" type="number" value={item.quantity} onChange={e => handleRecipeChange(index, 'quantity', e.target.value)} className="w-24" />
                        <Button variant="danger" onClick={() => removeRecipeItem(index)} className="!p-2" aria-label="Remover ingrediente">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </Button>
                      </div>
                    ))}
                    <Button variant="secondary" onClick={addRecipeItem}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                      Adicionar Ingrediente
                    </Button>
                  </div>
                )}
                
                <div className="mt-6 p-4 rounded-lg bg-lino">
                    <h4 className="font-bold text-espresso">Calculadora de Preço de Venda</h4>
                    <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                        <p><span className="font-semibold">Custo Base:</span> R$ {baseCost.toFixed(2)}</p>
                        <Input label="Preço de Venda" type="number" value={currentProduct?.salePrice || ''} onChange={e => setCurrentProduct({...currentProduct, salePrice: parseFloat(e.target.value) || 0})} />
                        <p><span className="font-semibold">Margem:</span> {currentProduct?.salePrice && baseCost ? (((currentProduct.salePrice - baseCost) / currentProduct.salePrice) * 100).toFixed(2) : 0}%</p>
                        <p><span className="font-semibold">Markup:</span> {currentProduct?.salePrice && baseCost && baseCost > 0 ? (((currentProduct.salePrice - baseCost) / baseCost) * 100).toFixed(2) : 0}%</p>
                    </div>
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


const Products: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'finished' | 'raw'>('finished');

    return (
        <div className="space-y-6">
             <h1 className="text-3xl font-bold text-espresso">Gerenciar Produtos</h1>
            <div className="border-b border-lino">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('finished')}
                        className={`${activeTab === 'finished' ? 'border-oliva text-oliva' : 'border-transparent text-oliva hover:text-espresso hover:border-lino'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                    >
                        Produtos Finais
                    </button>
                    <button
                        onClick={() => setActiveTab('raw')}
                        className={`${activeTab === 'raw' ? 'border-oliva text-oliva' : 'border-transparent text-oliva hover:text-espresso hover:border-lino'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                    >
                        Matéria-Prima
                    </button>
                </nav>
            </div>
            {activeTab === 'finished' ? <FinishedProductsTab /> : <RawMaterialsTab />}
        </div>
    );
};

export default Products;
