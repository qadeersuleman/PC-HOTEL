'use client';

import React, { useState } from 'react';
import { PageContainer } from '../../../components/layout/page-container';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Modal } from '../../../components/ui/modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/table';
import { Icons } from '../../../components/ui/icons';
import { useERPStorage } from '../../../lib/storage/context';
import { formatCurrency } from '../../../lib/utils/formatters';
import { Item, ItemCategory, UnitOfMeasure } from '../../../types/inventory';

export default function ItemsAndCategoriesPage() {
  const { items, categories, stockStatusList, saveItem, saveCategory } = useERPStorage();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // New item form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemCode, setNewItemCode] = useState('');
  const [newItemCategoryId, setNewItemCategoryId] = useState('');
  const [newItemUnit, setNewItemUnit] = useState<UnitOfMeasure>('KG');
  const [newItemCostPrice, setNewItemCostPrice] = useState('0');
  const [newItemMinStock, setNewItemMinStock] = useState('10');
  const [newItemNotes, setNewItemNotes] = useState('');

  // New category form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatCode, setNewCatCode] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || item.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemCategoryId) return;

    const item: Item = {
      id: `item-${Date.now()}`,
      code: newItemCode || `${items.length + 100}`,
      name: newItemName,
      categoryId: newItemCategoryId,
      unit: newItemUnit,
      minStockLevel: parseFloat(newItemMinStock) || 0,
      costPrice: parseFloat(newItemCostPrice) || 0,
      isActive: true,
      notes: newItemNotes,
    };

    await saveItem(item);
    setIsItemModalOpen(false);
    setNewItemName('');
    setNewItemCode('');
    setNewItemCostPrice('0');
    setNewItemMinStock('10');
    setNewItemNotes('');
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;

    const category: ItemCategory = {
      id: `cat-${Date.now()}`,
      code: newCatCode || `CAT-${categories.length + 1}`,
      name: newCatName,
      description: newCatDesc,
      defaultExpenseAccountId: 'acc-500100',
    };

    await saveCategory(category);
    setIsCategoryModalOpen(false);
    setNewCatName('');
    setNewCatCode('');
    setNewCatDesc('');
  };

  return (
    <PageContainer
      title="Items & Categories"
      subtitle="Manage grocery products, raw food items, packaging, and classification"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsCategoryModalOpen(true)}>
            <Icons.Plus size={14} />
            <span>Add Category</span>
          </Button>
          <Button variant="primary" size="sm" onClick={() => {
            if (categories.length > 0 && !newItemCategoryId) {
              setNewItemCategoryId(categories[0].id);
            }
            setIsItemModalOpen(true);
          }}>
            <Icons.Plus size={14} />
            <span>Add Item</span>
          </Button>
        </div>
      }
    >
      {/* Search & Category Filter bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input
                type="text"
                placeholder="Search items by name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-zinc-500 whitespace-nowrap">Filter Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">All Categories ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Code</TableHead>
              <TableHead>Item Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Avg Cost Price</TableHead>
              <TableHead>Min Stock</TableHead>
              <TableHead>Available</TableHead>
              <TableHead>Status</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-zinc-400 text-xs">
                  No items found matching criteria.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const stock = stockStatusList.find((s) => s.itemId === item.id);
                const category = categories.find((c) => c.id === item.categoryId);

                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                      {item.code}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">{item.name}</p>
                        {item.notes && <p className="text-[11px] text-zinc-400">{item.notes}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{category?.name || 'General'}</Badge>
                    </TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(item.costPrice)}
                    </TableCell>
                    <TableCell>{item.minStockLevel} {item.unit}</TableCell>
                    <TableCell>
                      <span className={`font-bold ${stock?.isLowStock ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                        {stock?.availableQty ?? 0} {item.unit}
                      </span>
                    </TableCell>
                    <TableCell>
                      {stock?.isLowStock ? (
                        <Badge variant="danger">Low Stock</Badge>
                      ) : (
                        <Badge variant="success">Normal</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add Item Modal */}
      <Modal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        title="Add New Inventory Item"
        description="Define a raw food product, beverage, or packing supply"
      >
        <form onSubmit={handleCreateItem} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Item Code / ID
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 8, 96, 105"
                value={newItemCode}
                onChange={(e) => setNewItemCode(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Category
              </label>
              <select
                required
                value={newItemCategoryId}
                onChange={(e) => setNewItemCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Item Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Mutton Withbone, Basmati Rice, Coal"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Unit of Measure
              </label>
              <select
                value={newItemUnit}
                onChange={(e) => setNewItemUnit(e.target.value as UnitOfMeasure)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              >
                <option value="KG">KG</option>
                <option value="Kg">Kg</option>
                <option value="Gram">Gram</option>
                <option value="Litre">Litre</option>
                <option value="Pat">Pat</option>
                <option value="Pcs">Pcs</option>
                <option value="Box">Box</option>
                <option value="Packet">Packet</option>
                <option value="Dozen">Dozen</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Initial Cost (PKR)
              </label>
              <input
                type="number"
                step="0.01"
                value={newItemCostPrice}
                onChange={(e) => setNewItemCostPrice(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Min Stock Alert
              </label>
              <input
                type="number"
                value={newItemMinStock}
                onChange={(e) => setNewItemMinStock(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Notes / Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Cuts for mutton handi, BBQ charcoal"
              value={newItemNotes}
              onChange={(e) => setNewItemNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsItemModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Item
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Category Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Add Item Category"
        description="Group items by culinary section (e.g., Mutton & Poultry, Dairy, Beverages)"
      >
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Category Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Spices & Masala A/c"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Category Code
            </label>
            <input
              type="text"
              placeholder="e.g. CAT-09"
              value={newCatCode}
              onChange={(e) => setNewCatCode(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Description
            </label>
            <input
              type="text"
              placeholder="Category usage notes"
              value={newCatDesc}
              onChange={(e) => setNewCatDesc(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCategoryModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Category
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}

