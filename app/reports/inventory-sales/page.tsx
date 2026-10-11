'use client';

import React from 'react';
import { PageContainer } from '../../../components/layout/page-container';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/table';
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
      subtitle="Analyze inventory turnover, culinary consumption, and food cost ratio metrics"
      actions={
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Icons.Printer size={14} />
          <span>Print Summary</span>
        </Button>
      }
    >
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Total Stock Holding Value</span>
          <p className="text-2xl font-bold text-sky-600 dark:text-sky-400 mt-1">
            {formatCurrency(totalStockValuation)}
          </p>
          <span className="text-[11px] text-zinc-400">Current store balance at average cost</span>
        </Card>

        <Card className="p-4">
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Culinary Food Consumption</span>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {formatCurrency(totalKitchenConsumption)}
          </p>
          <span className="text-[11px] text-zinc-400">Total issues dispatched to kitchen & BBQ</span>
        </Card>

        <Card className="p-4">
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Food Cost Percentage</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {foodCostRatio}%
          </p>
          <span className="text-[11px] text-zinc-400">Benchmark: 30% - 40% optimal for restaurant</span>
        </Card>
      </div>

      {/* Item Stock Turnover & Availability Table */}
      <Card>
        <CardHeader>
          <CardTitle>SKU Inventory Velocity & Stock Summary</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <tr>
              <TableHead>SKU / ID</TableHead>
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
                <TableCell className="font-mono font-bold text-xs">{item.itemCode}</TableCell>
                <TableCell className="font-semibold text-xs">{item.itemName}</TableCell>
                <TableCell className="text-xs">{item.categoryName}</TableCell>
                <TableCell className="text-right font-mono text-xs">{item.openingQty} {item.unit}</TableCell>
                <TableCell className="text-right font-mono text-xs text-emerald-600">
                  +{item.purchasedQty} {item.unit}
                </TableCell>
                <TableCell className="text-right font-mono text-xs text-amber-600">
                  -{item.issuedQty} {item.unit}
                </TableCell>
                <TableCell className="text-right font-mono font-bold text-xs text-zinc-900 dark:text-zinc-100">
                  {item.availableQty} {item.unit}
                </TableCell>
                <TableCell className="text-right font-mono font-bold text-xs text-sky-600 dark:text-sky-400">
                  {formatCurrency(item.stockValue)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </PageContainer>
  );
}

