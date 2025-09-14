
export type Id = string;

export interface RawMaterial {
  id: Id;
  name: string;
  stock: number;
  unit: string; // e.g., 'g', 'kg', 'ml', 'l', 'un'
  costPerUnit: number;
  imageIds?: string[];
}

export interface RecipeItem {
  rawMaterialId: Id;
  quantity: number;
}

export enum ProductType {
  PRODUCED = 'Produzido',
  RESOLD = 'Revenda',
}

export type ProductCategory = 'Café/Bebida' | 'Alimento' | 'Outro';

export interface FinishedProduct {
  id: Id;
  name:string;
  type: ProductType;
  stock: number;
  salePrice: number;
  recipe?: RecipeItem[]; // Only for PRODUCED type
  resaleCost?: number; // Only for RESOLD type
  category?: ProductCategory;
  imageIds?: string[];
  // New SKU fields
  sku?: string;
  skuProductTypeId?: Id;
  skuOriginId?: Id;
  weight?: number;
  weightUnit?: 'g' | 'kg';
  grind?: 'Grãos' | 'Moído' | 'N/A';
}

export enum CostType {
  SALES_CHANNEL = 'Canal de Venda',
  PAYMENT_METHOD = 'Meio de Pagamento',
  TAX = 'Imposto',
  OTHER = 'Outros Custos',
}

export interface Cost {
  id: Id;
  type: CostType;
  name: string;
  value: number; // Percentage (e.g., 5 for 5%) or fixed value
  isPercentage: boolean;
}

export interface Sale {
  id: Id;
  finishedProductId: Id;
  quantity: number;
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  appliedCosts: { name: string, value: number }[];
  date: string;
}

// -- New DRE Types for Customization --
export enum DRECategory {
  REVENUE = 'Receita Operacional Bruta',
  DEDUCTION = 'Deduções da Receita Bruta',
  COST = 'Custos dos Produtos Vendidos (CPV)',
  EXPENSE = 'Despesas Operacionais',
}

export interface DREItem {
  id: Id;
  name: string;
  category: DRECategory;
  isDefault: boolean; // Default items cannot be deleted/renamed
}

export interface DREPeriodData {
  [itemId: string]: number; // e.g. { "vendaCafes": 1500.50 }
}

export interface DREData {
  period: string; // The key, e.g., "2024-08"
  data: DREPeriodData;
}


// -- New SKU Types --
export interface SKUSegmentOption {
  id: Id;
  code: string;
  name: string;
}

export interface SKUConfig {
  id: 'singleton'; // Use a fixed ID for the single config object
  productTypes: SKUSegmentOption[];
  origins: SKUSegmentOption[];
}

export type ActivePage = 'dashboard' | 'products' | 'production' | 'sales' | 'costs' | 'dre' | 'sku' | 'settings';

// Type for images stored in DB
export interface StoredImage {
    id: string;
    blob: Blob;
}