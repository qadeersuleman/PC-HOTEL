'use client';

import React from 'react';
import { PageContainer } from '../../../components/layout/page-container';
import { Card, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/table';
import { EmptyState } from '../../../components/ui/empty-state';
import { Icons } from '../../../components/ui/icons';
import { useERPStorage } from '../../../lib/storage/context';
import { formatCurrency } from '../../../lib/utils/formatters';

export default function InventorySalesReportsPage() {
  const { stockStatusList, sales, issues, departments, totalStockValuation } = useERPStorage();

  const totalSalesRevenue = sales.reduce((sum, s) => sum + s.netSales, 0);
  const totalKitchenConsumption = issues
    .filter((iss) => departments.find((d) => d.id === iss.departmentId)?.isKitchen)
    .reduce((sum, iss) => sum + iss.totalCost, 0);

  const foodCostRatio = totalSalesRevenue > 0 ? ((totalKitchenConsumption / totalSalesRevenue) * 100).toFixed(1) : '0.0';

  return (
    <PageContainer
      title="Stock & Sales Consumption Reports"
      subtitle="Analyze inventory movement velocity, culinary kitchen consumption, and food cost ratio metrics"
      breadcrumbs={[
        { label: 'Financial Reports' },
        { label: 'Stock & Sales Reports' },
      ]}
      actions={
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Icons.Printer size={15} />
          <span>Print Summary</span>
        </Button>
      }
    >
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <span className="text-[12px] text-[#64748B] uppercase tracking-wider font-semibold">
            Total Stock Holding Value
          </span>
          <div className="mt-2">
            <p className="text-3xl font-bold font-mono tabular-nums text-[#0F766E]">
              {formatCurrency(totalStockValuation)}
            </p>
            <p className="text-[12px] text-[#64748B] mt-1">Current central store asset balance</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <span className="text-[12px] text-[#64748B] uppercase tracking-wider font-semibold">
            Culinary Kitchen Consumption
          </span>
          <div className="mt-2">
            <p className="text-3xl font-bold font-mono tabular-nums text-[#C2410C]">
              {formatCurrency(totalKitchenConsumption)}
            </p>
            <p className="text-[12px] text-[#64748B] mt-1">Food ingredients issued to kitchens</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <span className="text-[12px] text-[#64748B] uppercase tracking-wider font-semibold">
            Food Cost Percentage (FC%)
          </span>
          <div className="mt-2">
            <p className="text-3xl font-bold font-mono tabular-nums text-[#047857]">
              {foodCostRatio}%
            </p>
            <p className="text-[12px] text-[#64748B] mt-1">Industry standard: 30% – 40% optimal</p>
          </div>
        </div>
      </div>

      {/* Item Stock Turnover & Availability Table */}
      <Card>
        <CardHeader className="p-6 border-b border-[#E2E8F0] bg-[#F8FAFC]/50">
          <CardTitle className="text-base font-bold text-[#172554]">SKU Inventory Velocity & Stock Summary</CardTitle>
          <p className="text-[13px] text-[#64748B] mt-0.5">Chronological summary of all received, issued, and available warehouse items</p>
        </CardHeader>
        {stockStatusList.length === 0 ? (
          <EmptyState
            icon="Boxes"
            title="No Inventory Items Found"
            description="Register catalog items and receive purchase orders to see stock velocity."
            actionLabel="View Items"
            actionHref="/inventory/items"
          />
        ) : (
          <Table>
            <TableHeader>
              <tr>
                <TableHead>SKU / Code</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Opening Qty</TableHead>
                <TableHead className="text-right">Purchased</TableHead>
                <TableHead className="text-right">Issued</TableHead>
                <TableHead className="text-right">In Stock</TableHead>
                <TableHead className="text-right">Valuation (PKR)</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {stockStatusList.map((item) => (
                <TableRow key={item.itemId}>
                  <TableCell className="font-mono font-bold text-[#172554] text-[13px]">{item.itemCode}</TableCell>
                  <TableCell className="font-semibold text-[#172554] text-[14px]">{item.itemName}</TableCell>
                  <TableCell className="text-[13px] text-[#64748B]">{item.categoryName}</TableCell>
                  <TableCell className="text-right font-mono text-[13px] text-[#64748B] tabular-nums">
                    {item.openingQty} {item.unit}
                  </TableCell>
                  <TableCell className="text-right font-mono text-[13px] text-[#047857] font-semibold tabular-nums">
                    +{item.purchasedQty} {item.unit}
                  </TableCell>
                  <TableCell className="text-right font-mono text-[13px] text-[#C2410C] font-semibold tabular-nums">
                    -{item.issuedQty} {item.unit}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-[13px] text-[#172554] tabular-nums">
                    {item.availableQty} {item.unit}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-[14px] text-[#0F766E] tabular-nums">
                    {formatCurrency(item.stockValue)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </PageContainer>
  );
}
