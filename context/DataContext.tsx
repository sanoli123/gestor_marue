import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import {
  RawMaterial,
  FinishedProduct,
  Sale,
  Cost,
  RecipeItem,
  Id,
  DREData,
  DREItem,
  SKUConfig,
  ProductType,
} from '../types.ts';
import * as api from '../utils/db.ts';

interface DataContextType {
  rawMaterials: RawMaterial[];
  finishedProducts: FinishedProduct[];
  sales: Sale[];
  costs: Cost[];
  dreItems: DREItem[];
  dreData: DREData[];
  skuConfig: SKUConfig | null;
  isLoading: boolean;
  error: Error | null;

  addRawMaterial: (material: Omit<RawMaterial, 'id'>) => Promise<void>;
  updateRawMaterial: (material: RawMaterial) => Promise<void>;
  deleteRawMaterial: (id: Id) => Promise<void>;

  addProduct: (product: Omit<FinishedProduct, 'id' | 'sku'>) => Promise<void>;
  updateProduct: (product: FinishedProduct) => Promise<void>;
  deleteProduct: (id: Id) => Promise<void>;

  addCost: (cost: Omit<Cost, 'id'>) => Promise<void>;
  updateCost: (cost: Cost) => Promise<void>;
  deleteCost: (id: Id) => Promise<void>;

  updateDreItems: (items: DREItem[]) => Promise<void>;
  getDreData: (period: string) => Promise<DREData | undefined>;
  updateDreData: (dreData: DREData) => Promise<void>;
  updateSkuConfig: (config: SKUConfig) => Promise<void>;

  getProductCost: (product: Partial<FinishedProduct>) => number;
  executeProduction: (productId: Id, quantity: number, recipe: RecipeItem[]) => Promise<void>;
  registerSale: (productId: Id, quantity: number, appliedCostIds: Id[]) => Promise<void>;
  generateSKU: (productData: Partial<FinishedProduct>, isPreview?: boolean) => string;
  uploadImage: (file: File) => Promise<string>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

/* ==================== Normalizadores ==================== */

function ensureArray<T>(value: any): T[] {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  // alguns endpoints podem devolver um objeto único
  return [value];
}

function toNumber(v: any): number {
  if (v == null || v === '') return 0;
  // troca vírgula por ponto e remove milhar
  const s = String(v).replace(/\./g, '').replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function normImageIds(v: any): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (v == null || v === '' || (typeof v === 'object' && Object.keys(v).length === 0)) return [];
  if (typeof v === 'string') {
    // pode vir "id1,id2"
    return v.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

function normRecipe(v: any): RecipeItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .map(item => ({
      rawMaterialId: String((item as any).rawMaterialId ?? (item as any).raw_material_id ?? ''),
      quantity: toNumber((item as any).quantity),
    }))
    .filter(it => it.rawMaterialId);
}

function normalizeFinishedProduct(p: any): FinishedProduct {
  // Campos possíveis vindos do backend:
  // id, sku, name, unit, cost, price, stock, image_id, image_ids, imageIds, description,
  // created_at/createdAt, updated_at/updatedAt, type (PRODUCED/RESOLD), resaleCost, recipe
  const typeRaw = (p?.type ?? '').toString().toUpperCase();
  const type: ProductType =
    typeRaw === 'RESOLD' || typeRaw === 'REVENDIDO' ? ProductType.RESOLD : ProductType.PRODUCED;

  return {
    id: String(p?.id ?? crypto.randomUUID()),
    sku: p?.sku ?? undefined,
    name: p?.name ?? '',
    stock: toNumber(p?.stock),
    // salePrice pode vir como 'price'
    salePrice: toNumber(p?.salePrice ?? p?.price),
    type,
    // se for RESOLD, usar resaleCost; se for PRODUCED, o custo é calculado pela recipe (no front)
    resaleCost: type === ProductType.RESOLD ? toNumber(p?.resaleCost ?? p?.cost) : undefined,
    recipe: normRecipe(p?.recipe),
    imageIds: normImageIds(p?.imageIds ?? p?.image_ids ?? p?.image_id),
    // campos opcionais usados pelo gerador de SKU / UI
    weight: toNumber(p?.weight),
    weightUnit: p?.weightUnit ?? (p?.weight_unit ?? 'g'),
    grind: p?.grind ?? 'N/A',
    category: p?.category ?? 'Outro',
  };
}

function normalizeRawMaterial(rm: any): RawMaterial {
  return {
    id: String(rm?.id ?? crypto.randomUUID()),
    name: rm?.name ?? '',
    stock: toNumber(rm?.stock),
    unit: rm?.unit ?? (rm?.unity ?? ''),
    costPerUnit: toNumber(rm?.costPerUnit ?? rm?.cost ?? rm?.price),
    imageIds: normImageIds(rm?.imageIds ?? rm?.image_ids ?? rm?.image_id),
  };
}

function normalizeCost(c: any): Cost {
  return {
    id: String(c?.id ?? crypto.randomUUID()),
    name: c?.name ?? '',
    value: toNumber(c?.value ?? c?.amount),
    isPercentage: Boolean(c?.isPercentage ?? c?.is_percentage ?? false),
  };
}

/* ========================================================= */

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [finishedProducts, setFinishedProducts] = useState<FinishedProduct[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [costs, setCosts] = useState<Cost[]>([]);
  const [dreItems, setDreItems] = useState<DREItem[]>([]);
  const [dreData, setDreData] = useState<DREData[]>([]);
  const [skuConfig, setSkuConfig] = useState<SKUConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [rmsRaw, fpsRaw, sls, cstsRaw, dItems, dData, skc] = await Promise.all([
          api.getAll<any>('raw-materials').catch(() => []),
          api.getAll<any>('finished-products').catch(() => []),
          api.getAll<Sale>('sales').catch(() => []),
          api.getAll<any>('costs').catch(() => []),
          api.getAll<DREItem>('dre-items').catch(() => []),
          api.getAll<DREData>('dre-data').catch(() => []),
          api.getById<SKUConfig>('sku-config', 'singleton').catch(() => null),
        ]);

        const rms = ensureArray<any>(rmsRaw).map(normalizeRawMaterial);
        const fps = ensureArray<any>(fpsRaw).map(normalizeFinishedProduct);
        const csts = ensureArray<any>(cstsRaw).map(normalizeCost);

        setRawMaterials(rms);
        setFinishedProducts(fps);
        setSales(ensureArray<Sale>(sls).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setCosts(csts);
        setDreItems(ensureArray<DREItem>(dItems));
        setDreData(ensureArray<DREData>(dData));
        setSkuConfig(skc || null);
      } catch (e) {
        setError(e as Error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const rawMaterialMap = useMemo(() => new Map(rawMaterials.map(rm => [rm.id, rm])), [rawMaterials]);

  const getProductCost = (product: Partial<FinishedProduct>): number => {
    if (product.type === ProductType.RESOLD) return product.resaleCost ?? 0;

    if (product.type === ProductType.PRODUCED) {
      const recipeArray: RecipeItem[] = Array.isArray(product.recipe) ? product.recipe : [];
      if (recipeArray.length === 0) return 0;

      return recipeArray.reduce((total, item) => {
        const material = rawMaterialMap.get(item.rawMaterialId);
        const unitCost = material?.costPerUnit ?? 0;
        const qty = Number.isFinite(item.quantity) ? item.quantity : 0;
        return total + unitCost * qty;
      }, 0);
    }
    return 0;
  };

  const generateSKU = (productData: Partial<FinishedProduct>, isPreview: boolean = false): string => {
    if (!skuConfig) return 'CONFIG_SKU_ERROR';
    const { skuProductTypeId, skuOriginId, weight, weightUnit, grind } = productData;

    const productTypes = Array.isArray(skuConfig.productTypes) ? skuConfig.productTypes : [];
    const origins = Array.isArray(skuConfig.origins) ? skuConfig.origins : [];

    const productTypeCode = productTypes.find(pt => pt.id === skuProductTypeId)?.code || '????';
    const originCode = origins.find(o => o.id === skuOriginId)?.code || '??';

    const characteristics: string[] = [];
    if (weight && weightUnit) characteristics.push(`${weight}${String(weightUnit).toUpperCase()}`);
    if (grind && grind !== 'N/A') characteristics.push(grind === 'Grãos' ? 'GR' : 'MO');

    const prefix = `${productTypeCode}-${originCode}${characteristics.length > 0 ? '-' : ''}${characteristics.join('-')}-`;
    if (isPreview) return `${prefix}###`;

    const existingSkus = finishedProducts.filter(p => p.sku && p.sku.startsWith(prefix));
    const nextSequential =
      existingSkus.length > 0
        ? Math.max(...existingSkus.map(p => parseInt(p.sku!.split('-').pop()!, 10) || 0)) + 1
        : 1;

    return `${prefix}${String(nextSequential).padStart(3, '0')}`;
  };

  // --- MUTATION FUNCTIONS ---
  const addRawMaterial = async (material: Omit<RawMaterial, 'id'>) => {
    const newMaterial = await api.add<RawMaterial>('raw-materials', material);
    setRawMaterials(prev => [...prev, newMaterial]);
  };
  const updateRawMaterial = async (material: RawMaterial) => {
    const updated = await api.update<RawMaterial>('raw-materials', material);
    setRawMaterials(prev => prev.map(rm => (rm.id === updated.id ? updated : rm)));
  };
  const deleteRawMaterial = async (id: Id) => {
    await api.remove('raw-materials', id);
    setRawMaterials(prev => prev.filter(rm => rm.id !== id));
  };

  const addProduct = async (productData: Omit<FinishedProduct, 'id' | 'sku'>) => {
    const sku = generateSKU(productData);
    const newProduct = await api.add<FinishedProduct>('finished-products', { ...productData, sku });
    setFinishedProducts(prev => [...prev, newProduct]);
  };
  const updateProduct = async (product: FinishedProduct) => {
    const updated = await api.update<FinishedProduct>('finished-products', product);
    setFinishedProducts(prev => prev.map(p => (p.id === updated.id ? updated : p)));
  };
  const deleteProduct = async (id: Id) => {
    await api.remove('finished-products', id);
    setFinishedProducts(prev => prev.filter(p => p.id !== id));
  };

  const addCost = async (cost: Omit<Cost, 'id'>) => {
    const newCost = await api.add<Cost>('costs', cost);
    setCosts(prev => [...prev, newCost]);
  };
  const updateCost = async (cost: Cost) => {
    const updated = await api.update<Cost>('costs', cost);
    setCosts(prev => prev.map(c => (c.id === updated.id ? updated : c)));
  };
  const deleteCost = async (id: Id) => {
    await api.remove('costs', id);
    setCosts(prev => prev.filter(c => c.id !== id));
  };

  const updateDreItems = async (items: DREItem[]) => {
    await api.updateAll('dre-items', items);
    setDreItems(items);
  };

  const getDreData = async (period: string) => api.getById<DREData>('dre-data', period);

  const updateDreData = async (dataToUpdate: DREData) => {
    const responseData = await api.update('dre-data', { ...dataToUpdate, id: dataToUpdate.period });
    const { id, ...updatedData } = responseData as any;

    setDreData(prev => {
      const existing = prev.find(d => d.period === dataToUpdate.period);
      if (existing) {
        return prev.map(d => (d.period === dataToUpdate.period ? (updatedData as DREData) : d));
      }
      return [...prev, updatedData as DREData];
    });
  };

  const updateSkuConfig = async (config: SKUConfig) => {
    const updated = await api.update<SKUConfig>('sku-config', config);
    setSkuConfig(updated);
  };

  const uploadImage = async (file: File): Promise<string> => {
    const response = await api.uploadImage(file);
    return response.id;
  };

  const registerSale = async (productId: Id, quantity: number, appliedCostIds: Id[]) => {
    const product = finishedProducts.find(p => p.id === productId);
    if (!product || product.stock < quantity) throw new Error('Estoque insuficiente.');

    const baseUnitCost = getProductCost(product);
    const totalRevenue = product.salePrice * quantity;
    let totalVariableCosts = 0;
    const appliedCostsDetails: { name: string; value: number }[] = [];
    appliedCostIds.forEach(costId => {
      const cost = costs.find(c => c.id === costId);
      if (cost) {
        const costValue = cost.isPercentage ? (totalRevenue * cost.value) / 100 : cost.value;
        totalVariableCosts += costValue;
        appliedCostsDetails.push({ name: cost.name, value: costValue });
      }
    });
    const totalCost = baseUnitCost * quantity + totalVariableCosts;
    const netProfit = totalRevenue - totalCost;

    const newSaleData: Omit<Sale, 'id'> = {
      finishedProductId: productId,
      quantity,
      totalRevenue,
      totalCost,
      netProfit,
      appliedCosts: appliedCostsDetails,
      date: new Date().toISOString(),
    };
    const newSale = await api.add<Sale>('sales', newSaleData);
    setSales(prev => [newSale, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

    const updatedProduct = { ...product, stock: product.stock - quantity };
    await updateProduct(updatedProduct);
  };

  const executeProduction = async (productId: Id, quantity: number, recipe: RecipeItem[]) => {
    const recipeArray: RecipeItem[] = Array.isArray(recipe) ? recipe : [];
    for (const item of recipeArray) {
      const material = rawMaterialMap.get(item.rawMaterialId);
      if (!material || material.stock < item.quantity * quantity) {
        throw new Error(`Estoque de ${material?.name || 'insumo'} insuficiente.`);
      }
    }

    const materialUpdates = recipeArray.map(item => {
      const material = rawMaterialMap.get(item.rawMaterialId)!;
      return updateRawMaterial({ ...material, stock: material.stock - item.quantity * quantity });
    });
    await Promise.all(materialUpdates);

    const product = finishedProducts.find(fp => fp.id === productId)!;
    await updateProduct({ ...product, stock: product.stock + quantity });
  };

  const value = {
    rawMaterials,
    finishedProducts,
    sales,
    costs,
    dreItems,
    dreData,
    skuConfig,
    isLoading,
    error,
    addRawMaterial,
    updateRawMaterial,
    deleteRawMaterial,
    addProduct,
    updateProduct,
    deleteProduct,
    addCost,
    updateCost,
    deleteCost,
    updateDreItems,
    getDreData,
    updateDreData,
    updateSkuConfig,
    getProductCost,
    executeProduction,
    registerSale,
    generateSKU,
    uploadImage,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
