'use client';

import React, { useState } from 'react';
import { PageContainer } from '../../components/layout/page-container';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Modal } from '../../components/ui/modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import { Icons } from '../../components/ui/icons';
import { useERPStorage } from '../../lib/storage/context';
import { Department } from '../../types/issue';

export default function DepartmentsPage() {
  const { departments, saveDepartment } = useERPStorage();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [isKitchen, setIsKitchen] = useState(true);
  const [description, setDescription] = useState('');

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const newDept: Department = {
      id: `dept-${Date.now()}`,
      code: code || `DEP-${departments.length + 1}`,
      name,
      isKitchen,
      expenseAccountId: isKitchen ? 'acc-500100' : 'acc-600300',
      description,
      isActive: true,
    };

    await saveDepartment(newDept);
    setIsModalOpen(false);
    setName('');
    setCode('');
    setDescription('');
    setIsKitchen(true);
  };

  return (
    <PageContainer
      title="Departments"
      subtitle="Manage internal restaurant stations and classify food consumption vs operating expense"
      actions={
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Icons.Plus size={14} />
          <span>Add Department</span>
        </Button>
      }
    >
      <Card>
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Code</TableHead>
              <TableHead>Department Name</TableHead>
              <TableHead>Accounting Classification</TableHead>
              <TableHead>P&L Impact</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {departments.map((dept) => (
              <TableRow key={dept.id}>
                <TableCell className="font-mono font-semibold">{dept.code}</TableCell>
                <TableCell className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {dept.name}
                </TableCell>
                <TableCell>
                  {dept.isKitchen ? (
                    <Badge variant="success">Kitchen / Food Prep</Badge>
                  ) : (
                    <Badge variant="info">Operations / Overhead</Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs">
                  {dept.isKitchen ? (
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                      Estimated COGS (Cost of Goods Sold)
                    </span>
                  ) : (
                    <span className="text-zinc-500 font-medium">
                      Operating Expense (Supplies/Hygiene)
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-zinc-500">{dept.description || '—'}</TableCell>
                <TableCell>
                  <Badge variant="default">Active</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Add Department Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Restaurant Department"
        description="Configure kitchen stations, counters, or internal divisions"
      >
        <form onSubmit={handleCreateDepartment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Department Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Pastry Station, Live Tandoor, Housekeeping"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Department Code
            </label>
            <input
              type="text"
              placeholder="e.g. DEP-07"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Food Consumption Classification
            </label>
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="radio"
                  name="deptType"
                  checked={isKitchen}
                  onChange={() => setIsKitchen(true)}
                  className="text-emerald-600"
                />
                <span className="font-medium">Kitchen (Contributes to COGS)</span>
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="radio"
                  name="deptType"
                  checked={!isKitchen}
                  onChange={() => setIsKitchen(false)}
                  className="text-emerald-600"
                />
                <span>Non-Kitchen (Operating Expense)</span>
              </label>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              {isKitchen
                ? 'Stock issued to this department will be treated as direct food ingredient cost.'
                : 'Stock issued here (e.g. napkins, soap, shoppers) will be expensed as packaging/cleaning.'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Main dining hall service"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Department
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}

