'use client';

import React, { useState } from 'react';
import { PageContainer } from '../../../components/layout/page-container';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Modal } from '../../../components/ui/modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/table';
import { EmptyState } from '../../../components/ui/empty-state';
import { Icons } from '../../../components/ui/icons';
import { useERPStorage } from '../../../lib/storage/context';
import { useToast } from '../../../components/ui/toast';
import { formatCurrency } from '../../../lib/utils/formatters';
import { Item, ItemCategory, UnitOfMeasure } from '../../../types/inventory';

export default function ItemsAndCategoriesPage() {
  const { items, categories, stockStatusList, saveItem, saveCategory } = useERPStorage();
  const toast = useToast();

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
  const [isItemSubmitting, setIsItemSubmitting] = useState(false);

  // New category form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatCode, setNewCatCode] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [isCatSubmitting, setIsCatSubmitting] = useState(false);

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
    if (!newItemName || !newItemCategoryId) {
      toast.error('Validation Error', 'Please specify item name and select a category.');
      return;
    }

    setIsItemSubmitting(true);
    try {
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
      toast.success('Item Created', `${item.name} added to inventory catalog.`);
      setIsItemModalOpen(false);
      setNewItemName('');
      setNewItemCode('');
      setNewItemCostPrice('0');
      setNewItemMinStock('10');
      setNewItemNotes('');
    } catch (err) {
      toast.error('Save Failed', 'Could not create item.');
    } finally {
      setIsItemSubmitting(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) {
      toast.error('Validation Error', 'Please enter a category name.');
      return;
    }

    setIsCatSubmitting(true);
    try {
      const category: ItemCategory = {
        id: `cat-${Date.now()}`,
        code: newCatCode || `CAT-${categories.length + 1}`,
        name: newCatName,
        description: newCatDesc,
        defaultExpenseAccountId: 'acc-500100',
      };

      await saveCategory(category);
      toast.success('Category Created', `${category.name} added.`);
      setIsCategoryModalOpen(false);
      setNewCatName('');
      setNewCatCode('');
      setNewCatDesc('');
    } catch (err) {
      toast.error('Save Failed', 'Could not create category.');
    } finally {
      setIsCatSubmitting(false);
    }
  };

  return (
    <PageContainer
      title="Items & Categories Master"
      subtitle="Configure raw ingredients, poultry, spices, and packaging inventory catalog"
      actions={
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="md" onClick={() => setIsCategoryModalOpen(true)}>
            <Icons.Plus size={15} />
            <span>New Category</span>
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              if (categories.length > 0 && !newItemCategoryId) {
                setNewItemCategoryId(categories[0].id);
              }
              setIsItemModalOpen(true);
            }}
          >
            <Icons.Plus size={16} />
            <span>New Item</span>
          </Button>
        </div>
      }
    >
      {/* Category Pills & Search */}
      <Card>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <Icons.Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" size={18} />
              <input
                type="text"
                placeholder="Search items by code or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-11 pl-10 pr-4 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] placeholder-[#94A3B8] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none transition-all"
              />
            </div>

            <div className="text-[13px] text-[#64748B] font-medium">
              Showing <span className="font-bold text-[#172554]">{filteredItems.length}</span> of {items.length} items
            </div>
          </div>

          {/* Categories Horizontal Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-2 border-t border-[#F1F5F9]">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-[13px] font-semibold transition-all whitespace-nowrap ${
                selectedCategory === 'ALL'
                  ? 'bg-[#0F766E] text-white shadow-xs'
                  : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#172554] hover:bg-slate-200'
              }`}
            >
              All Items ({items.length})
            </button>
            {categories.map((cat) => {
              const count = items.filter((i) => i.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-[13px] font-semibold transition-all whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'bg-[#0F766E] text-white shadow-xs'
                      : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#172554] hover:bg-slate-200'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Items Table or EmptyState */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon="Layers"
          title="No items found in this section"
          description="Create raw materials, poultry, produce, dairy, or packaging catalog items."
          action={
            <Button
              variant="primary"
              onClick={() => {
                if (categories.length > 0 && !newItemCategoryId) {
                  setNewItemCategoryId(categories[0].id);
                }
                setIsItemModalOpen(true);
              }}
            >
              <Icons.Plus size={16} />
              <span>Create Item</span>
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Code</TableHead>
              <TableHead>Item Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Standard Rate (PKR)</TableHead>
              <TableHead className="text-right">Min Threshold</TableHead>
              <TableHead className="text-right">Store Balance</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => {
              const cat = categories.find((c) => c.id === item.categoryId);
              const stock = stockStatusList.find((s) => s.itemId === item.id);
              const available = stock?.availableQty || 0;

              return (
                <TableRow key={item.id}>
                  <TableCell className="font-mono font-bold text-[#172554]">
                    {item.code}
                  </TableCell>
                  <TableCell className="font-semibold text-[#172554]">
                    {item.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="primary" size="sm">{cat?.name || 'General'}</Badge>
                  </TableCell>
                  <TableCell className="text-[#64748B] font-mono">{item.unit}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-[#64748B]">
                    {formatCurrency(item.costPrice)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-[#64748B]">
                    {item.minStockLevel} {item.unit}
                  </TableCell>
                  <TableCell className="text-right font-bold font-mono tabular-nums text-[#172554]">
                    {available} {item.unit}
                  </TableCell>
                  <TableCell className="text-center">
                    {available <= 0 ? (
                      <Badge variant="danger">Out of Stock</Badge>
                    ) : available <= item.minStockLevel ? (
                      <Badge variant="warning">Low Stock</Badge>
                    ) : (
                      <Badge variant="success">Active</Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Create Item Modal */}
      <Modal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        title="Add New Inventory Item"
        description="Add a raw grocery material or packing item to the restaurant catalog"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateItem} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[14px] font-semibold text-[#1E293B] mb-1.5">
                Item Name <span className="text-[#B91C1C]">*</span>
              </label>
              <input
                type="text"
                required
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="e.g. Mutton Bone-in, White Sugar"
                className="w-full h-12 px-4 text-[15px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
              />
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-[#1E293B] mb-1.5">
                Item Code / SKU
              </label>
              <input
                type="text"
                value={newItemCode}
                onChange={(e) => setNewItemCode(e.target.value)}
                placeholder="e.g. RAW-01"
                className="w-full h-12 px-4 text-[15px] font-mono rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[14px] font-semibold text-[#1E293B] mb-1.5">
                Category <span className="text-[#B91C1C]">*</span>
              </label>
              <select
                required
                value={newItemCategoryId}
                onChange={(e) => setNewItemCategoryId(e.target.value)}
                className="w-full h-12 px-4 text-[15px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-[#1E293B] mb-1.5">
                Unit of Measure <span className="text-[#B91C1C]">*</span>
              </label>
              <select
                value={newItemUnit}
                onChange={(e) => setNewItemUnit(e.target.value as UnitOfMeasure)}
                className="w-full h-12 px-4 text-[15px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none cursor-pointer"
              >
                <option value="KG">KG (Kilograms)</option>
                <option value="GRAM">GRAM</option>
                <option value="LITER">LITER</option>
                <option value="PCS">PCS (Pieces)</option>
                <option value="PACKET">PACKET</option>
                <option value="BAG">BAG</option>
                <option value="BOX">BOX</option>
                <option value="BOTTLE">BOTTLE</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[14px] font-semibold text-[#1E293B] mb-1.5">
                Default Rate / Cost (PKR)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={newItemCostPrice}
                onChange={(e) => setNewItemCostPrice(e.target.value)}
                className="w-full h-12 px-4 text-[15px] font-mono tabular-nums rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
              />
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-[#1E293B] mb-1.5">
                Minimum Stock Level (Safety Reorder)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={newItemMinStock}
                onChange={(e) => setNewItemMinStock(e.target.value)}
                className="w-full h-12 px-4 text-[15px] font-mono tabular-nums rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[14px] font-semibold text-[#1E293B] mb-1.5">
              Item Notes / Brand Specification
            </label>
            <input
              type="text"
              value={newItemNotes}
              onChange={(e) => setNewItemNotes(e.target.value)}
              placeholder="e.g. Standard grade A meat from Punjab slaughterhouse"
              className="w-full h-12 px-4 text-[15px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F1F5F9]">
            <Button type="button" variant="secondary" onClick={() => setIsItemModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isItemSubmitting}>
              <Icons.CheckCircle size={16} />
              <span>Save Catalog Item</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Category Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Add Category"
        description="Classify items into Meat, Produce, Beverages, Grocery, or Disposables"
        maxWidth="md"
      >
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <div>
            <label className="block text-[14px] font-semibold text-[#1E293B] mb-1.5">
              Category Name <span className="text-[#B91C1C]">*</span>
            </label>
            <input
              type="text"
              required
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="e.g. Seafood & Fish"
              className="w-full h-12 px-4 text-[15px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
            />
          </div>

          <div>
            <label className="block text-[14px] font-semibold text-[#1E293B] mb-1.5">
              Category Code
            </label>
            <input
              type="text"
              value={newCatCode}
              onChange={(e) => setNewCatCode(e.target.value)}
              placeholder="e.g. CAT-07"
              className="w-full h-12 px-4 text-[15px] font-mono rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
            />
          </div>

          <div>
            <label className="block text-[14px] font-semibold text-[#1E293B] mb-1.5">
              Description
            </label>
            <input
              type="text"
              value={newCatDesc}
              onChange={(e) => setNewCatDesc(e.target.value)}
              placeholder="Brief description of category contents..."
              className="w-full h-12 px-4 text-[15px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F1F5F9]">
            <Button type="button" variant="secondary" onClick={() => setIsCategoryModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isCatSubmitting}>
              <Icons.CheckCircle size={16} />
              <span>Save Category</span>
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
