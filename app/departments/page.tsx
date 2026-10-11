'use client';

import React, { useState } from 'react';
import { PageContainer } from '../../components/layout/page-container';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Modal } from '../../components/ui/modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import { Icons } from '../../components/ui/icons';
import { useERPStorage } from '../../lib/storage/context';
import { useToast } from '../../components/ui/toast';
import { Department } from '../../types/issue';

export default function DepartmentsPage() {
  const { departments, saveDepartment } = useERPStorage();
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [isKitchen, setIsKitchen] = useState(true);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error('Validation Error', 'Please enter a department name.');
      return;
    }

    setIsSubmitting(true);
    try {
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
      toast.success('Department Created', `${newDept.name} added to station directory.`);
      setIsModalOpen(false);
      setName('');
      setCode('');
      setDescription('');
      setIsKitchen(true);
    } catch (err) {
      toast.error('Save Failed', 'Could not create department.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer
      title="Departments & Stations Directory"
      subtitle="Configure internal restaurant stations and classify food consumption vs operating supplies"
      actions={
        <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
          <Icons.Plus size={16} />
          <span>Add Station / Department</span>
        </Button>
      }
    >
      <Table>
        <TableHeader>
          <tr>
            <TableHead>Code</TableHead>
            <TableHead>Department / Station</TableHead>
            <TableHead>Station Classification</TableHead>
            <TableHead>P&L Accounting Treatment</TableHead>
            <TableHead>Role & Station Destination</TableHead>
            <TableHead className="text-center">Status</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {departments.map((dept) => (
            <TableRow key={dept.id}>
              <TableCell className="font-mono font-bold text-[#172554]">{dept.code}</TableCell>
              <TableCell className="font-semibold text-[#172554]">
                {dept.name}
              </TableCell>
              <TableCell>
                {dept.isKitchen ? (
                  <Badge variant="success">Kitchen Station</Badge>
                ) : (
                  <Badge variant="info">Operations / Store</Badge>
                )}
              </TableCell>
              <TableCell>
                {dept.isKitchen ? (
                  <span className="text-[#047857] font-semibold text-[13px]">
                    Direct Food Cost (COGS)
                  </span>
                ) : (
                  <span className="text-[#64748B] font-medium text-[13px]">
                    Operating Expense (Overhead)
                  </span>
                )}
              </TableCell>
              <TableCell className="text-[13px] text-[#64748B]">{dept.description || '—'}</TableCell>
              <TableCell className="text-center">
                <Badge variant="success">Active</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Add Department Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Department / Station"
        description="Define a new food station, bar, dining hall, or housekeeping supply destination"
        maxWidth="md"
      >
        <form onSubmit={handleCreateDepartment} className="space-y-4">
          <div>
            <label className="block text-[14px] font-semibold text-[#1E293B] mb-1.5">
              Department Name <span className="text-[#B91C1C]">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dessert & Ice Cream Counter"
              className="w-full h-12 px-4 text-[15px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
            />
          </div>

          <div>
            <label className="block text-[14px] font-semibold text-[#1E293B] mb-1.5">
              Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. DEP-07"
              className="w-full h-12 px-4 text-[15px] font-mono rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
            />
          </div>

          <div>
            <label className="block text-[14px] font-semibold text-[#1E293B] mb-1.5">
              Accounting Treatment Type <span className="text-[#B91C1C]">*</span>
            </label>
            <select
              value={isKitchen ? 'kitchen' : 'operating'}
              onChange={(e) => setIsKitchen(e.target.value === 'kitchen')}
              className="w-full h-12 px-4 text-[15px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none cursor-pointer"
            >
              <option value="kitchen">Kitchen Prep (Treat as Food Cost / COGS)</option>
              <option value="operating">Support Department (Treat as Packaging / Cleaning Expense)</option>
            </select>
          </div>

          <div>
            <label className="block text-[14px] font-semibold text-[#1E293B] mb-1.5">
              Station Description / Notes
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Cold desserts, fruit salad, ice cream prep"
              className="w-full h-12 px-4 text-[15px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F1F5F9]">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              <Icons.CheckCircle size={16} />
              <span>Save Department</span>
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
