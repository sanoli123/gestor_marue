import React, { useMemo } from 'react';
import { useData } from '../context/DataContext.tsx';
import StatCard from '../components/StatCard.tsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DREPeriodData, ProductCategory, DRECategory } from '../types.ts';

const Dashboard: React.FC = () => {
    const { rawMaterials, finishedProducts, sales, getProductCost, dreData, dreItems } = useData();

    const stats = useMemo(() => {
        const totalStockValue = rawMaterials.reduce((sum, rm) => sum + rm.stock * rm.costPerUnit, 0) +
            finishedProducts.reduce((sum, fp) => sum + fp.stock * getProductCost(fp), 0);
        
        const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalRevenue, 0);
        const totalProfit = sales.reduce((sum, sale) => sum + sale.netProfit, 0);
        const productsForSale = finishedProducts.filter(fp => fp.stock > 0).length;

        return {
            totalStockValue,
            totalRevenue,
            totalProfit,
            productsForSale
        };
    }, [rawMaterials, finishedProducts, sales, getProductCost]);

    const chartData = useMemo(() => {
        return finishedProducts.map(fp => ({
            name: fp.name,
            Estoque: fp.stock,
        })).sort((a,b) => b.Estoque - a.Estoque);
    }, [finishedProducts]);
    
    const formatCurrency = (value: number) => `R$ ${value.toFixed(2)}`;

    const dreSummary = useMemo(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const periodKey = `${year}-${String(month).padStart(2, '0')}`;
        
        const currentMonthData: DREPeriodData = dreData[periodKey] || {};

        const getCategoryTotal = (category: DRECategory) => {
            return dreItems
                .filter(item => item.category === category)
                .reduce((sum, item) => sum + (currentMonthData[item.id] || 0), 0);
        };

        const receitaBruta = getCategoryTotal(DRECategory.REVENUE);
        const deducoes = getCategoryTotal(DRECategory.DEDUCTION);
        const cpv = getCategoryTotal(DRECategory.COST);
        const despesasOperacionais = getCategoryTotal(DRECategory.EXPENSE);

        const receitaLiquida = receitaBruta - deducoes;
        const lucroBruto = receitaLiquida - cpv;
        const resultadoOperacional = lucroBruto - despesasOperacionais;

        return { receitaLiquida, lucroBruto, resultadoOperacional };
    }, [dreData, dreItems]);


    const categoryMargins = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const salesThisMonth = sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
        });

        const productMap = new Map(finishedProducts.map(p => [p.id, p]));

        const categoryData: Record<ProductCategory, { totalRevenue: number; totalCost: number }> = {
            'Café/Bebida': { totalRevenue: 0, totalCost: 0 },
            'Alimento': { totalRevenue: 0, totalCost: 0 },
            'Outro': { totalRevenue: 0, totalCost: 0 },
        };

        salesThisMonth.forEach(sale => {
            const product = productMap.get(sale.finishedProductId);
            if (product && product.category) {
                const cogs = getProductCost(product) * sale.quantity; // Cost of Goods Sold for this sale
                categoryData[product.category].totalRevenue += sale.totalRevenue;
                categoryData[product.category].totalCost += cogs;
            }
        });

        return (Object.entries(categoryData) as [ProductCategory, { totalRevenue: number; totalCost: number }][])
            .map(([category, data]) => {
                const margin = data.totalRevenue > 0
                    ? ((data.totalRevenue - data.totalCost) / data.totalRevenue) * 100
                    : 0;
                return {
                    category,
                    ...data,
                    margin,
                };
            })
            .filter(d => d.totalRevenue > 0);

    }, [sales, finishedProducts, getProductCost]);


    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-espresso">Dashboard</h1>
                <p className="text-oliva mt-1">Visão geral do seu negócio.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Valor Total do Estoque" value={formatCurrency(stats.totalStockValue)} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>} />
                <StatCard title="Receita Total (Vendas)" value={formatCurrency(stats.totalRevenue)} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} />
                <StatCard title="Lucro Total (Vendas)" value={formatCurrency(stats.totalProfit)} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>} />
                <StatCard title="Produtos para Venda" value={stats.productsForSale} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>} />
            </div>

            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-espresso">Resumo DRE (Mês Atual)</h2>
                 <div className="bg-lino p-6 rounded-xl shadow-lg">
                    <div className="flex flex-col md:flex-row justify-around items-center text-center space-y-4 md:space-y-0">
                        {/* Receita Líquida */}
                        <div className="flex-1">
                            <p className="text-sm font-medium text-oliva">Receita Líquida</p>
                            <p className="text-2xl font-bold text-espresso">{formatCurrency(dreSummary.receitaLiquida)}</p>
                        </div>

                        {/* Separator */}
                        <div className="text-2xl text-oliva transform md:-rotate-0 rotate-90">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </div>

                        {/* Lucro Bruto */}
                        <div className="flex-1">
                            <p className="text-sm font-medium text-oliva">Lucro Bruto</p>
                            <p className="text-2xl font-bold text-espresso">{formatCurrency(dreSummary.lucroBruto)}</p>
                        </div>
                        
                        {/* Separator */}
                         <div className="text-2xl text-oliva transform md:-rotate-0 rotate-90">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </div>

                        {/* Resultado Operacional */}
                        <div className="flex-1">
                            <p className="text-sm font-medium text-oliva">Resultado Operacional</p>
                            <p className={`text-2xl font-bold ${dreSummary.resultadoOperacional >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(dreSummary.resultadoOperacional)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="bg-lino p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-bold mb-4 text-espresso">Margem de Lucro Bruto por Categoria (Mês Atual)</h2>
                {categoryMargins.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-oliva">
                            <thead className="text-xs text-espresso uppercase bg-crema">
                                <tr>
                                    <th className="px-4 py-2">Categoria</th>
                                    <th className="px-4 py-2 text-right">Receita Total</th>
                                    <th className="px-4 py-2 text-right">Custo (CPV)</th>
                                    <th className="px-4 py-2 text-right">Margem de Lucro Bruto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categoryMargins.map(({ category, totalRevenue, totalCost, margin }) => (
                                    <tr key={category} className="border-b border-crema last:border-b-0">
                                        <td className="px-4 py-2 font-medium text-espresso">{category}</td>
                                        <td className="px-4 py-2 text-right">{formatCurrency(totalRevenue)}</td>
                                        <td className="px-4 py-2 text-right">{formatCurrency(totalCost)}</td>
                                        <td className="px-4 py-2 text-right font-bold">{margin.toFixed(2)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-oliva">Não há dados de vendas este mês para calcular as margens.</p>
                )}
            </div>

            <div className="bg-lino p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-bold mb-4 text-espresso">Estoque de Produtos Finais</h2>
                <div style={{ width: '100%', height: 400 }}>
                    <ResponsiveContainer>
                        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E9DFD3" />
                            <XAxis dataKey="name" stroke="#6A6C4F" />
                            <YAxis stroke="#6A6C4F" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#FAF3E3',
                                    border: '1px solid #E9DFD3',
                                    color: '#5E3A2E'
                                }}
                            />
                            <Legend />
                            <Bar dataKey="Estoque" fill="#6A6C4F" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;