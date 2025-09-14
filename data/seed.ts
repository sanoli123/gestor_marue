
import { RawMaterial, FinishedProduct, Cost, ProductType, CostType, DREItem, DRECategory, SKUConfig } from '../types.ts';

// --- IDs for Raw Materials to be referenced in recipes ---
const rm_cafe_cru_id = 'd919b4f7-1e51-4e8c-9c76-3a7a9747375a';
const rm_embalagem_especial_id = 'a8f5c3a2-6b9e-4e1d-8a5e-2c9e4b6d0e1c';
const rm_embalagem_envio_id = 'b3c8a9f4-1d5e-4b9a-8f0c-7e2a9d4b1a0e';
const rm_etiqueta_id = 'c1e7d6b9-8e2a-4f5c-9d4a-1b8e6d0a4c7f';
const rm_embalagem_presente_id = 'f5a2b8e3-4d7c-4a9f-8e1d-6b3a9c7d2e0b';

/**
 * Initial data for Raw Materials.
 * Stock values are set to simulate an initial inventory.
 */
export const initialRawMaterials: RawMaterial[] = [
    {
        id: rm_cafe_cru_id,
        name: 'Saca de Café Cru (60kg)',
        stock: 60000, // 60kg converted to grams
        unit: 'g',
        costPerUnit: 3500 / 60000, // Price per gram (R$ 3500 / 60000g)
        imageIds: [],
    },
    {
        id: rm_embalagem_especial_id,
        name: 'Embalagem Café Especial',
        stock: 500,
        unit: 'un',
        costPerUnit: 1.20,
        imageIds: [],
    },
    {
        id: rm_embalagem_envio_id,
        name: 'Embalagem de Envio',
        stock: 300,
        unit: 'un',
        costPerUnit: 1.00,
        imageIds: [],
    },
    {
        id: rm_etiqueta_id,
        name: 'Etiqueta Destinatário',
        stock: 1000,
        unit: 'un',
        costPerUnit: 0.05,
        imageIds: [],
    },
    {
        id: rm_embalagem_presente_id,
        name: 'Embalagem Presente',
        stock: 150,
        unit: 'un',
        costPerUnit: 0.90,
        imageIds: [],
    },
];


// -- New SKU Config Seed --
export const initialSKUConfig: SKUConfig = {
  id: 'singleton',
  productTypes: [
    { id: 'sku_pt_1', code: 'CESP', name: 'Café Especial' },
    { id: 'sku_pt_2', code: 'CGOU', name: 'Café Gourmet' },
    { id: 'sku_pt_3', code: 'CAPS', name: 'Cápsulas de Café' },
    { id: 'sku_pt_4', code: 'ACSS', name: 'Acessórios' },
  ],
  origins: [
    { id: 'sku_o_1', code: 'PP', name: 'Produção Própria' },
    { id: 'sku_o_2', code: 'MT', name: 'Marca de Terceiros' },
  ],
};

/**
 * Initial data for Finished Products, including recipes that use the raw materials defined above.
 */
export const initialFinishedProducts: FinishedProduct[] = [
    {
        id: 'fp-1',
        name: 'Café Especial Torrado 250g',
        type: ProductType.PRODUCED,
        stock: 10,
        salePrice: 45.00,
        category: 'Café/Bebida',
        recipe: [
            { rawMaterialId: rm_cafe_cru_id, quantity: 300 }, // Assumes ~17% weight loss during roasting to get 250g final product
            { rawMaterialId: rm_embalagem_especial_id, quantity: 1 },
        ],
        sku: 'CESP-PP-250G-GR-001',
        skuProductTypeId: 'sku_pt_1',
        skuOriginId: 'sku_o_1',
        weight: 250,
        weightUnit: 'g',
        grind: 'Grãos',
        imageIds: [],
    },
    {
        id: 'fp-2',
        name: 'Kit Presente Café',
        type: ProductType.PRODUCED,
        stock: 5,
        salePrice: 55.00,
        category: 'Café/Bebida',
        recipe: [
             { rawMaterialId: rm_cafe_cru_id, quantity: 300 },
             { rawMaterialId: rm_embalagem_especial_id, quantity: 1 },
             { rawMaterialId: rm_embalagem_presente_id, quantity: 1 },
        ],
        sku: 'CESP-PP-250G-GR-002',
        skuProductTypeId: 'sku_pt_1',
        skuOriginId: 'sku_o_1',
        weight: 250,
        weightUnit: 'g',
        grind: 'Grãos',
        imageIds: [],
    },
];

/**
 * Initial data for various operational Costs.
 */
export const initialCosts: Omit<Cost, 'id'>[] = [
    // Sales Channels
    { name: 'Amazon', type: CostType.SALES_CHANNEL, value: 15, isPercentage: true },
    { name: 'Mercado Livre', type: CostType.SALES_CHANNEL, value: 16, isPercentage: true },
    { name: 'Whatsapp', type: CostType.SALES_CHANNEL, value: 1, isPercentage: true },
    { name: 'Site Próprio', type: CostType.SALES_CHANNEL, value: 10, isPercentage: true },

    // Payment Methods
    { name: 'Cartão de Crédito', type: CostType.PAYMENT_METHOD, value: 3, isPercentage: true },
    { name: 'Pix (Fixo)', type: CostType.PAYMENT_METHOD, value: 1.00, isPercentage: false },
    { name: 'Pix (%)', type: CostType.PAYMENT_METHOD, value: 1, isPercentage: true },
    { name: 'Boleto', type: CostType.PAYMENT_METHOD, value: 0.9, isPercentage: true },

    // Other Costs (Shipping/Fretes)
    { name: 'Sedex', type: CostType.OTHER, value: 22.00, isPercentage: false },
    { name: 'Transportadora ABC', type: CostType.OTHER, value: 12.00, isPercentage: false },
    { name: 'Motoboy', type: CostType.OTHER, value: 18.00, isPercentage: false },
];

/**
 * Defines the initial structure of the DRE report.
 * `isDefault: true` items cannot be removed by the user.
 */
export const initialDREItems: DREItem[] = [
    // REVENUE
    { id: 'vendaCafes', name: 'Venda de Cafés e Bebidas', category: DRECategory.REVENUE, isDefault: true },
    { id: 'vendaAlimentos', name: 'Venda de Alimentos', category: DRECategory.REVENUE, isDefault: true },
    { id: 'outrasVendas', name: 'Outras Vendas', category: DRECategory.REVENUE, isDefault: true },
    // DEDUCTION
    { id: 'impostoSimples', name: 'Imposto (Simples Nacional - DAS)', category: DRECategory.DEDUCTION, isDefault: true },
    { id: 'devolucoesDescontos', name: 'Devoluções ou Descontos', category: DRECategory.DEDUCTION, isDefault: true },
    // COST
    { id: 'custoMateriaPrima', name: 'Custo da Matéria-Prima', category: DRECategory.COST, isDefault: true },
    { id: 'custoEmbalagens', name: 'Custo de Embalagens', category: DRECategory.COST, isDefault: true },
    // EXPENSE
    { id: 'despesasPessoal', name: 'Despesas com Pessoal', category: DRECategory.EXPENSE, isDefault: true },
    { id: 'despesasAdministrativas', name: 'Despesas Administrativas', category: DRECategory.EXPENSE, isDefault: true },
    { id: 'despesasVendas', name: 'Despesas com Vendas', category: DRECategory.EXPENSE, isDefault: true },
];
