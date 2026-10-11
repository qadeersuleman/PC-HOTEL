'use client';

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageContainer } from '../../../components/layout/page-container';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Modal } from '../../../components/ui/modal';
import { EmptyState } from '../../../components/ui/empty-state';
import { useToast } from '../../../components/ui/toast';
import { Icons } from '../../../components/ui/icons';
import { useERPStorage } from '../../../lib/storage/context';
import { formatCurrency, formatDate, getTodayDateString, round2 } from '../../../lib/utils/formatters';
import { Voucher, JournalLine } from '../../../types/voucher';

interface CPVRow {
  id: string;
  payeeKey: string; // 'vendor:<id>' or 'account:<id>'
  description: string;
  reference: string;
  amount: string;
}

const createBlankRow = (id: string): CPVRow => ({
  id,
  payeeKey: '',
  description: '',
  reference: '',
  amount: '',
});

function CashPaymentVouchersContent() {
  const searchParams = useSearchParams();
  const initialVendorId = searchParams.get('vendorId');

  const { vouchers, vendors, accounts, saveVoucher, cancelVoucher } = useERPStorage();
  const toast = useToast();

  const cpvVouchers = useMemo(() => {
    return vouchers
      .filter((v) => v.voucherType === 'CPV')
      .sort((a, b) => b.voucherNumber.localeCompare(a.voucherNumber));
  }, [vouchers]);

  // Current Voucher Form State
  const [currentVoucherId, setCurrentVoucherId] = useState<string | null>(null);
  const [date, setDate] = useState(getTodayDateString());
  const [voucherNumber, setVoucherNumber] = useState('');
  const [paidFromAccountCode, setPaidFromAccountCode] = useState('100100');
  const [allowEditing, setAllowEditing] = useState(true);
  const [rows, setRows] = useState<CPVRow[]>([
    createBlankRow('row-1'),
    createBlankRow('row-2'),
    createBlankRow('row-3'),
    createBlankRow('row-4'),
  ]);

  // UI Modals / Panels
  const [isFindModalOpen, setIsFindModalOpen] = useState(false);
  const [findSearchQuery, setFindSearchQuery] = useState('');
  const [showHistoryView, setShowHistoryView] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Input refs for automatic focus & keyboard jump
  const rowRefs = useRef<{
    [key: string]: {
      payee?: HTMLSelectElement | null;
      description?: HTMLInputElement | null;
      reference?: HTMLInputElement | null;
      amount?: HTMLInputElement | null;
    };
  }>({});

  // Generate next CPV number
  const generateNextVoucherNo = () => {
    const nextSeq = cpvVouchers.length + 1;
    return `CPV-2026-00${nextSeq}`;
  };

  // Initial load or vendor query parameter
  useEffect(() => {
    if (!voucherNumber) {
      setVoucherNumber(generateNextVoucherNo());
    }
    if (initialVendorId && vendors.length > 0) {
      setRows((prev) => {
        const updated = [...prev];
        if (updated[0]) {
          updated[0].payeeKey = `vendor:${initialVendorId}`;
        }
        return updated;
      });
    }
  }, [vendors, initialVendorId, cpvVouchers.length]);

  // Reset to brand new voucher
  const handleNewVoucher = () => {
    setCurrentVoucherId(null);
    setDate(getTodayDateString());
    setVoucherNumber(`CPV-2026-00${cpvVouchers.length + 1}`);
    setPaidFromAccountCode('100100');
    setAllowEditing(true);
    setRows([
      createBlankRow(`row-${Date.now()}-1`),
      createBlankRow(`row-${Date.now()}-2`),
      createBlankRow(`row-${Date.now()}-3`),
      createBlankRow(`row-${Date.now()}-4`),
    ]);
    toast.info('New Voucher Ready', 'Form cleared for fresh payment entries.');
  };

  // Load a saved voucher into the form
  const loadVoucher = (v: Voucher) => {
    setCurrentVoucherId(v.id);
    setVoucherNumber(v.voucherNumber);
    setDate(v.date);
    setAllowEditing(false); // Locked by default for safety

    // Detect paidFrom from credit line
    const creditLine = v.lines.find((l) => l.credit > 0);
    if (creditLine) {
      setPaidFromAccountCode(creditLine.accountCode || '100100');
    }

    // Map debit lines to rows
    const debitLines = v.lines.filter((l) => l.debit > 0);
    const loadedRows: CPVRow[] = debitLines.map((line, idx) => {
      let payeeKey = '';
      if (line.partyId && line.partyType === 'VENDOR') {
        payeeKey = `vendor:${line.partyId}`;
      } else {
        payeeKey = `account:${line.accountId}`;
      }

      return {
        id: `row-loaded-${idx}-${line.id}`,
        payeeKey,
        description: line.description || v.description,
        reference: v.referenceNo || '',
        amount: String(line.debit || ''),
      };
    });

    // Pad with empty rows if fewer than 4 for visual consistency
    while (loadedRows.length < 4) {
      loadedRows.push(createBlankRow(`row-pad-${loadedRows.length + 1}`));
    }

    setRows(loadedRows);
    setIsFindModalOpen(false);
  };

  // Navigate Back (Previous voucher)
  const handleBack = () => {
    if (cpvVouchers.length === 0) return;
    if (!currentVoucherId) {
      // If on new form, load the most recent voucher
      loadVoucher(cpvVouchers[0]);
      return;
    }
    const idx = cpvVouchers.findIndex((v) => v.id === currentVoucherId);
    if (idx < cpvVouchers.length - 1) {
      loadVoucher(cpvVouchers[idx + 1]);
    } else {
      toast.info('First Voucher Reached', 'No older vouchers in history.');
    }
  };

  // Navigate Next (Newer voucher)
  const handleNext = () => {
    if (cpvVouchers.length === 0) return;
    if (!currentVoucherId) return;
    const idx = cpvVouchers.findIndex((v) => v.id === currentVoucherId);
    if (idx > 0) {
      loadVoucher(cpvVouchers[idx - 1]);
    } else if (idx === 0) {
      // Transition to New Voucher
      handleNewVoucher();
    }
  };

  // Add a new row to the table
  const handleAddRow = () => {
    const newId = `row-${Date.now()}-${rows.length + 1}`;
    setRows((prev) => [...prev, createBlankRow(newId)]);
    setTimeout(() => {
      rowRefs.current[newId]?.payee?.focus();
    }, 50);
  };

  // Delete a row
  const handleDeleteRow = (index: number) => {
    if (rows.length <= 1) {
      // Reset row content instead of deleting last row
      setRows([createBlankRow(`row-${Date.now()}`)]);
      return;
    }
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  // Update row fields
  const handleRowChange = (index: number, field: keyof CPVRow, value: string) => {
    setRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Keyboard navigation handler ("jaise enter karon to dosre data new line pe")
  const handleKeyDown = (
    e: React.KeyboardEvent,
    index: number,
    field: 'payee' | 'description' | 'reference' | 'amount'
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentRowId = rows[index].id;

      if (field === 'payee') {
        rowRefs.current[currentRowId]?.description?.focus();
      } else if (field === 'description') {
        rowRefs.current[currentRowId]?.reference?.focus();
      } else if (field === 'reference') {
        rowRefs.current[currentRowId]?.amount?.focus();
      } else if (field === 'amount') {
        if (index === rows.length - 1) {
          // At the last row: Add a new row and focus it!
          const newId = `row-${Date.now()}-${rows.length + 1}`;
          setRows((prev) => [...prev, createBlankRow(newId)]);
          setTimeout(() => {
            rowRefs.current[newId]?.payee?.focus();
          }, 50);
        } else {
          // Move to next row's payee
          const nextRowId = rows[index + 1]?.id;
          if (nextRowId) {
            rowRefs.current[nextRowId]?.payee?.focus();
          }
        }
      }
    }
  };

  // Global hotkeys (F3 for Find Voucher, Ctrl+S for Save)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault();
        setIsFindModalOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveVoucher();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  });

  // Calculate total amount
  const totalAmount = useMemo(() => {
    return round2(
      rows.reduce((sum, r) => {
        const val = parseFloat(r.amount) || 0;
        return sum + (val > 0 ? val : 0);
      }, 0)
    );
  }, [rows]);

  // Valid rows count
  const validRowsCount = useMemo(() => {
    return rows.filter((r) => r.payeeKey && (parseFloat(r.amount) || 0) > 0).length;
  }, [rows]);

  // Save / Post Voucher
  const handleSaveVoucher = async () => {
    if (!allowEditing) {
      toast.error('Editing Locked', 'Check "Allow Editing" on top right before saving modifications.');
      return;
    }

    const validLines = rows.filter((r) => {
      const val = parseFloat(r.amount) || 0;
      return r.payeeKey && val > 0;
    });

    if (validLines.length === 0) {
      toast.error(
        'Validation Error',
        'Please enter at least one valid line with an Account/Vendor and an Amount greater than zero.'
      );
      return;
    }

    const paidFromAccount = accounts.find((a) => a.code === paidFromAccountCode);
    if (!paidFromAccount) {
      toast.error('Configuration Error', 'Selected payment disbursement account was not found.');
      return;
    }

    const apAccount = accounts.find((a) => a.code === '201900') || accounts.find((a) => a.category === 'LIABILITY');

    setIsSubmitting(true);
    try {
      const compiledLines: JournalLine[] = [];
      let primaryVendorId: string | undefined = undefined;

      validLines.forEach((r, idx) => {
        const amt = round2(parseFloat(r.amount) || 0);
        const [prefix, id] = r.payeeKey.split(':');

        if (prefix === 'vendor') {
          const ven = vendors.find((v) => v.id === id);
          if (!primaryVendorId) primaryVendorId = id;
          compiledLines.push({
            id: `jl-cpv-${Date.now()}-dr-${idx}`,
            accountId: apAccount?.id || 'acc-201900',
            accountCode: apAccount?.code || '201900',
            accountName: apAccount?.name || 'Accounts Payable (Vendors)',
            debit: amt,
            credit: 0,
            partyId: id,
            partyType: 'VENDOR',
            description: r.description || `Disbursement to ${ven?.name || 'Vendor'}`,
          });
        } else {
          const acc = accounts.find((a) => a.id === id);
          compiledLines.push({
            id: `jl-cpv-${Date.now()}-dr-${idx}`,
            accountId: acc?.id || id,
            accountCode: acc?.code || '600000',
            accountName: acc?.name || 'Expense Account',
            debit: amt,
            credit: 0,
            description: r.description || `Expense disbursement: ${acc?.name}`,
          });
        }
      });

      // Credit balancing line to Cash in Hand or Bank
      compiledLines.push({
        id: `jl-cpv-${Date.now()}-cr-paidfrom`,
        accountId: paidFromAccount.id,
        accountCode: paidFromAccount.code,
        accountName: paidFromAccount.name,
        debit: 0,
        credit: totalAmount,
        description: `Disbursed via ${paidFromAccount.name}`,
      });

      const newVoucher: Voucher = {
        id: currentVoucherId || `v-cpv-${Date.now()}`,
        voucherNumber: voucherNumber || generateNextVoucherNo(),
        voucherType: 'CPV',
        date,
        description:
          validLines.map((l) => l.description).filter(Boolean).join('; ') ||
          `Cash Payment Voucher for ${validLines.length} item(s)`,
        referenceNo: validLines.find((l) => l.reference)?.reference || '',
        amount: totalAmount,
        partyId: primaryVendorId,
        partyType: primaryVendorId ? 'VENDOR' : undefined,
        paymentMethod: paidFromAccountCode === '100100' ? 'CASH' : 'BANK',
        bankAccountId: paidFromAccount.id,
        lines: compiledLines,
        isPosted: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveVoucher(newVoucher);
      setCurrentVoucherId(newVoucher.id);
      setAllowEditing(false);
      toast.success(
        'Voucher Saved & Posted',
        `${newVoucher.voucherNumber} recorded with ${validLines.length} line(s) totaling ${formatCurrency(totalAmount)}.`
      );
    } catch (err) {
      console.error(err);
      toast.error('Save Error', 'Failed to save and post cash payment voucher.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reverse / Cancel Voucher
  const handleCancelCurrentVoucher = async () => {
    if (!currentVoucherId) return;
    if (!allowEditing) {
      toast.error('Action Locked', 'Please check "Allow Editing" to cancel or reverse this voucher.');
      return;
    }

    if (
      confirm(
        `Are you sure you want to cancel and reverse ${voucherNumber}? This will reverse the GL entries and restore balances.`
      )
    ) {
      try {
        await cancelVoucher(currentVoucherId);
        toast.warning('Voucher Reversed', `${voucherNumber} has been reversed and marked as cancelled.`);
        handleNewVoucher();
      } catch {
        toast.error('Error', 'Failed to cancel voucher.');
      }
    }
  };

  // Filtered vouchers for Find Voucher modal
  const filteredSearchVouchers = useMemo(() => {
    if (!findSearchQuery.trim()) return cpvVouchers;
    const q = findSearchQuery.toLowerCase();
    return cpvVouchers.filter((v) => {
      const ven = vendors.find((vend) => vend.id === v.partyId);
      return (
        v.voucherNumber.toLowerCase().includes(q) ||
        v.date.includes(q) ||
        (v.referenceNo && v.referenceNo.toLowerCase().includes(q)) ||
        (v.description && v.description.toLowerCase().includes(q)) ||
        (ven && ven.name.toLowerCase().includes(q))
      );
    });
  }, [cpvVouchers, findSearchQuery, vendors]);

  const currentlyLoadedVoucher = useMemo(() => {
    return cpvVouchers.find((v) => v.id === currentVoucherId);
  }, [cpvVouchers, currentVoucherId]);

  return (
    <PageContainer
      title="Cash Payment Voucher (CPV)"
      subtitle="Direct interactive desktop-style disbursement grid for multiple expenses and supplier settlements"
      breadcrumbs={[
        { label: 'Vouchers & GL', href: '/accounts/general-ledger' },
        { label: 'Cash Payment Voucher (CPV)' },
      ]}
    >
      {/* MAIN VOUCHER DESKTOP CARD (Matches the user's uploaded reference image) */}
      <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-sm overflow-hidden mb-6">
        {/* Top Voucher Header Bar */}
        <div className="p-5 md:p-6 border-b border-[#CBD5E1] flex flex-wrap items-center justify-between gap-4 bg-white">
          {/* Left: Icon & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center font-bold">
              <Icons.Receipt size={22} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[#172554] tracking-tight flex items-center gap-2">
                <span>Cash Payment Voucher</span>
                {currentVoucherId && (
                  <Badge variant={currentlyLoadedVoucher?.isPosted ? 'success' : 'error'}>
                    {currentlyLoadedVoucher?.isPosted ? 'Posted' : 'Cancelled'}
                  </Badge>
                )}
              </h1>
            </div>
          </div>

          {/* Right: Date, Voucher No, Paid From, Allow Editing Toggle */}
          <div className="flex flex-wrap items-center gap-3 md:gap-4">
            {/* Date Field */}
            <div className="flex items-center gap-2">
              <label className="text-[13px] font-semibold text-[#172554] flex items-center gap-1 whitespace-nowrap">
                <Icons.Clock size={14} className="text-[#64748B]" />
                <span>Date</span>
              </label>
              <input
                type="date"
                disabled={!allowEditing}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-10 px-3 text-[14px] rounded-xl border border-[#CBD5E1] bg-white text-[#172554] font-medium focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] disabled:bg-[#F1F5F9] disabled:text-[#64748B]"
              />
            </div>

            {/* Voucher No Field */}
            <div className="flex items-center gap-2">
              <label className="text-[13px] font-semibold text-[#172554] flex items-center gap-1 whitespace-nowrap">
                <Icons.Receipt size={14} className="text-[#64748B]" />
                <span>CPV No</span>
              </label>
              <input
                type="text"
                disabled={!allowEditing}
                value={voucherNumber}
                onChange={(e) => setVoucherNumber(e.target.value)}
                placeholder="CPV-2026-001"
                className="h-10 w-36 px-3 text-[14px] rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#172554] font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] disabled:bg-[#F1F5F9]"
              />
            </div>

            {/* Paid From Account */}
            <div className="flex items-center gap-2">
              <label className="text-[13px] font-semibold text-[#172554] flex items-center gap-1 whitespace-nowrap">
                <Icons.CreditCard size={14} className="text-[#64748B]" />
                <span>Paid From</span>
              </label>
              <select
                disabled={!allowEditing}
                value={paidFromAccountCode}
                onChange={(e) => setPaidFromAccountCode(e.target.value)}
                className="h-10 px-3 text-[13px] rounded-xl border border-[#CBD5E1] bg-white text-[#172554] font-semibold focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] disabled:bg-[#F1F5F9]"
              >
                <option value="100100">100100 — Cash in Hand (Counter)</option>
                <option value="100110">100110 — Meezan Bank Operating A/C</option>
                {accounts
                  .filter((a) => a.category === 'ASSET' && a.code !== '100100' && a.code !== '100110' && a.code.startsWith('100'))
                  .map((a) => (
                    <option key={a.id} value={a.code}>
                      {a.code} — {a.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Allow Editing Checkbox */}
            <label className="flex items-center gap-2 text-[13px] font-semibold text-[#172554] cursor-pointer select-none bg-[#F8FAFC] border border-[#CBD5E1] px-3 py-2 rounded-xl hover:bg-[#F1F5F9] transition-colors">
              <input
                type="checkbox"
                checked={allowEditing}
                onChange={(e) => setAllowEditing(e.target.checked)}
                className="w-4 h-4 rounded text-[#0F766E] focus:ring-[#0F766E]"
              />
              <span className="flex items-center gap-1">
                {allowEditing ? '🔓' : '🔒'} Allow Editing
              </span>
            </label>
          </div>
        </div>

        {/* Direct Interactive Grid (No Modal!) */}
        <div className="p-5 md:p-6">
          <div className="border border-[#CBD5E1] rounded-xl overflow-x-auto shadow-sm">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-[#F1F5F9] border-b border-[#CBD5E1] text-[#172554] text-[13px] font-bold">
                  <th className="py-3 px-3 w-12 text-center border-r border-[#CBD5E1]">#</th>
                  <th className="py-3 px-3 w-[30%] border-r border-[#CBD5E1]">
                    AcName / Pay To (Vendor or Expense Head)
                  </th>
                  <th className="py-3 px-3 w-[34%] border-r border-[#CBD5E1]">
                    Description / Narration
                  </th>
                  <th className="py-3 px-3 w-[16%] border-r border-[#CBD5E1]">
                    Reference (Bill / Slip #)
                  </th>
                  <th className="py-3 px-3 w-[16%] text-right border-r border-[#CBD5E1]">
                    Debit / Amount (PKR)
                  </th>
                  <th className="py-3 px-2 w-12 text-center">Del</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {rows.map((row, index) => {
                  if (!rowRefs.current[row.id]) {
                    rowRefs.current[row.id] = {};
                  }
                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-[#F8FAFC]/80 transition-colors group focus-within:bg-[#EFF6FF]/40"
                    >
                      {/* Row Sequence */}
                      <td className="py-2.5 px-3 text-center text-[13px] font-mono text-[#64748B] border-r border-[#E2E8F0] select-none">
                        {index + 1}
                      </td>

                      {/* Pay To / Account Selector */}
                      <td className="py-1 px-2 border-r border-[#E2E8F0]">
                        <select
                          ref={(el) => {
                            if (rowRefs.current[row.id]) rowRefs.current[row.id].payee = el;
                          }}
                          disabled={!allowEditing}
                          value={row.payeeKey}
                          onChange={(e) => handleRowChange(index, 'payeeKey', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, index, 'payee')}
                          className="w-full h-10 px-2.5 text-[14px] rounded-lg border border-transparent hover:border-[#CBD5E1] focus:border-[#0F766E] focus:bg-white bg-transparent text-[#172554] font-medium focus:outline-none focus:ring-1 focus:ring-[#0F766E] transition-all disabled:text-[#64748B]"
                        >
                          <option value="">-- Choose Vendor or Expense --</option>
                          <optgroup label="📋 Suppliers & Vendors (Accounts Payable)">
                            {vendors.map((v) => (
                              <option key={`v-${v.id}`} value={`vendor:${v.id}`}>
                                [Vendor] {v.name} ({v.accountNo})
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="💼 Direct & Operating Expense Heads">
                            {accounts
                              .filter((a) => a.category === 'EXPENSE')
                              .map((a) => (
                                <option key={`acc-${a.id}`} value={`account:${a.id}`}>
                                  [{a.code}] {a.name}
                                </option>
                              ))}
                          </optgroup>
                          <optgroup label="🏦 Other Chart of Accounts">
                            {accounts
                              .filter((a) => a.category !== 'EXPENSE')
                              .map((a) => (
                                <option key={`acc-${a.id}`} value={`account:${a.id}`}>
                                  [{a.code}] {a.name}
                                </option>
                              ))}
                          </optgroup>
                        </select>
                      </td>

                      {/* Description / Narration */}
                      <td className="py-1 px-2 border-r border-[#E2E8F0]">
                        <input
                          ref={(el) => {
                            if (rowRefs.current[row.id]) rowRefs.current[row.id].description = el;
                          }}
                          type="text"
                          disabled={!allowEditing}
                          value={row.description}
                          placeholder="e.g. Daily meat purchase, kitchen gas refill, staff advance..."
                          onChange={(e) => handleRowChange(index, 'description', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, index, 'description')}
                          className="w-full h-10 px-2.5 text-[14px] rounded-lg border border-transparent hover:border-[#CBD5E1] focus:border-[#0F766E] focus:bg-white bg-transparent text-[#334155] focus:outline-none focus:ring-1 focus:ring-[#0F766E] transition-all disabled:text-[#64748B]"
                        />
                      </td>

                      {/* Reference */}
                      <td className="py-1 px-2 border-r border-[#E2E8F0]">
                        <input
                          ref={(el) => {
                            if (rowRefs.current[row.id]) rowRefs.current[row.id].reference = el;
                          }}
                          type="text"
                          disabled={!allowEditing}
                          value={row.reference}
                          placeholder="Bill # or Slip #"
                          onChange={(e) => handleRowChange(index, 'reference', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, index, 'reference')}
                          className="w-full h-10 px-2.5 text-[14px] font-mono rounded-lg border border-transparent hover:border-[#CBD5E1] focus:border-[#0F766E] focus:bg-white bg-transparent text-[#334155] focus:outline-none focus:ring-1 focus:ring-[#0F766E] transition-all disabled:text-[#64748B]"
                        />
                      </td>

                      {/* Amount (Debit) */}
                      <td className="py-1 px-2 border-r border-[#E2E8F0]">
                        <input
                          ref={(el) => {
                            if (rowRefs.current[row.id]) rowRefs.current[row.id].amount = el;
                          }}
                          type="number"
                          step="any"
                          disabled={!allowEditing}
                          value={row.amount}
                          placeholder="0.00"
                          onChange={(e) => handleRowChange(index, 'amount', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, index, 'amount')}
                          className="w-full h-10 px-2.5 text-[14px] text-right font-mono font-bold rounded-lg border border-transparent hover:border-[#CBD5E1] focus:border-[#0F766E] focus:bg-white bg-transparent text-[#172554] focus:outline-none focus:ring-1 focus:ring-[#0F766E] transition-all tabular-nums disabled:text-[#64748B]"
                        />
                      </td>

                      {/* Delete Action */}
                      <td className="py-1 px-2 text-center">
                        <button
                          type="button"
                          disabled={!allowEditing}
                          onClick={() => handleDeleteRow(index)}
                          title="Delete row"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors disabled:opacity-40"
                        >
                          <Icons.Trash size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Total Summary Row (Matches screenshot totals row) */}
              <tfoot>
                <tr className="bg-[#F8FAFC] border-t-2 border-[#CBD5E1] text-[#172554] font-bold">
                  <td colSpan={4} className="py-3 px-4 text-left border-r border-[#CBD5E1]">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] tracking-wide text-[#334155] uppercase font-semibold">
                        Total Payment Disbursements
                      </span>
                      <span className="text-[12px] font-normal text-[#64748B]">
                        {validRowsCount} valid line item{validRowsCount === 1 ? '' : 's'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-[16px] text-[#172554] border-r border-[#CBD5E1] tabular-nums">
                    {formatCurrency(totalAmount)}
                  </td>
                  <td className="py-3 px-2 text-center bg-[#F1F5F9]"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Quick Add Row Button */}
          {allowEditing && (
            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={handleAddRow}
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0F766E] hover:text-[#115E59] py-1.5 px-3 rounded-lg hover:bg-[#0F766E]/10 transition-colors"
              >
                <Icons.Plus size={16} />
                <span>Add Row (Press Enter on Amount to auto-add)</span>
              </button>
              <div className="text-[12px] text-[#64748B] flex items-center gap-3">
                <span>Tip: Press <strong>Enter</strong> to jump through fields & create new rows</span>
                <span>•</span>
                <span>Press <strong>F3</strong> to find vouchers</span>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM ACTION BUTTONS TOOLBAR (Exactly matches the user's reference image!) */}
        <div className="p-4 md:p-5 bg-white border-t border-[#CBD5E1] flex flex-wrap items-center justify-between gap-3">
          {/* Left Buttons: View All & Find Voucher */}
          <div className="flex items-center gap-3">
            {/* View All (Blue Button) */}
            <button
              type="button"
              onClick={() => setShowHistoryView(!showHistoryView)}
              className="h-11 px-5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold text-[14px] shadow-sm flex items-center gap-2 transition-all active:scale-[0.98]"
            >
              <Icons.Eye size={17} />
              <span>{showHistoryView ? 'Hide List' : 'View All'}</span>
            </button>

            {/* Find Voucher (Cyan / Light Blue Button) */}
            <button
              type="button"
              onClick={() => setIsFindModalOpen(true)}
              className="h-11 px-5 rounded-xl bg-[#06B6D4] hover:bg-[#0891B2] text-white font-semibold text-[14px] shadow-sm flex items-center gap-2 transition-all active:scale-[0.98]"
            >
              <Icons.Search size={16} />
              <span>Find Voucher (F3)</span>
            </button>
          </div>

          {/* Center Navigation Buttons: Back & Next */}
          <div className="flex items-center gap-3">
            {/* Back (Yellow / Amber Button) */}
            <button
              type="button"
              onClick={handleBack}
              disabled={cpvVouchers.length === 0}
              className="h-11 px-5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold text-[14px] shadow-sm flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Icons.ArrowLeft size={16} />
              <span>Back</span>
            </button>

            {/* Next (Teal / Emerald Button) */}
            <button
              type="button"
              onClick={handleNext}
              disabled={cpvVouchers.length === 0}
              className="h-11 px-5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-[14px] shadow-sm flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <span>Next</span>
              <Icons.ArrowRight size={16} />
            </button>
          </div>

          {/* Right Action Buttons: New, Delete, Save */}
          <div className="flex items-center gap-3">
            {/* New + (Light Gray / Bordered Button) */}
            <button
              type="button"
              onClick={handleNewVoucher}
              className="h-11 px-5 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5E1] text-[#1E293B] font-semibold text-[14px] shadow-sm flex items-center gap-2 transition-all active:scale-[0.98]"
            >
              <span>New +</span>
            </button>

            {/* Delete / Reverse Voucher (Red Button - visible when viewing existing) */}
            {currentVoucherId && allowEditing && (
              <button
                type="button"
                onClick={handleCancelCurrentVoucher}
                className="h-11 px-4 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-semibold text-[14px] shadow-sm flex items-center gap-2 transition-all active:scale-[0.98]"
              >
                <Icons.Trash size={16} />
                <span>Delete</span>
              </button>
            )}

            {/* Save (Green Button) */}
            <button
              type="button"
              disabled={isSubmitting || !allowEditing}
              onClick={handleSaveVoucher}
              className="h-11 px-6 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-[14px] shadow-sm flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Icons.Save size={17} />
              <span>{isSubmitting ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ALL SAVED CPV VOUCHERS LIST (Shown when clicking 'View All') */}
      {showHistoryView && (
        <Card className="mb-6 animate-in fade-in duration-200">
          <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <h2 className="text-base font-bold text-[#172554] flex items-center gap-2">
              <Icons.Clock size={16} className="text-[#0F766E]" />
              <span>All Recorded Cash Payment Vouchers ({cpvVouchers.length})</span>
            </h2>
            <button
              onClick={() => setShowHistoryView(false)}
              className="text-xs font-semibold text-[#64748B] hover:text-[#172554]"
            >
              Close List ✕
            </button>
          </div>
          {cpvVouchers.length === 0 ? (
            <EmptyState
              icon="ArrowUpRight"
              title="No Cash Payment Vouchers Yet"
              description="Record your first supplier payment or operational expense using the grid above."
              actionLabel="Create First CPV"
              onAction={handleNewVoucher}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#172554] font-semibold">
                    <th className="py-3 px-4">Voucher #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Payee / Description</th>
                    <th className="py-3 px-4">Paid From</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4 text-right">Amount (PKR)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {cpvVouchers.map((v) => {
                    const creditLine = v.lines.find((l) => l.credit > 0);
                    const ven = vendors.find((item) => item.id === v.partyId);

                    return (
                      <tr
                        key={v.id}
                        className={`hover:bg-[#F8FAFC] cursor-pointer transition-colors ${
                          v.id === currentVoucherId ? 'bg-[#0F766E]/5 font-medium' : ''
                        }`}
                        onClick={() => loadVoucher(v)}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-[#172554]">
                          {v.voucherNumber}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#64748B]">{formatDate(v.date)}</td>
                        <td className="py-3 px-4 text-[#334155] max-w-[280px] truncate">
                          {ven?.name ? `[${ven.name}] ` : ''}
                          {v.description}
                        </td>
                        <td className="py-3 px-4 text-[#64748B]">
                          <Badge variant="outline">{creditLine?.accountName || 'Cash'}</Badge>
                        </td>
                        <td className="py-3 px-4 font-mono text-[#64748B]">{v.referenceNo || '—'}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#C2410C] tabular-nums">
                          {formatCurrency(v.amount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {v.isPosted ? (
                            <Badge variant="success">Posted to GL</Badge>
                          ) : (
                            <Badge variant="error">Cancelled</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              loadVoucher(v);
                            }}
                            className="px-3 py-1 rounded-lg bg-[#0F766E]/10 hover:bg-[#0F766E]/20 text-[#0F766E] font-semibold text-xs transition-colors"
                          >
                            Load
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* FIND VOUCHER MODAL (Triggered by F3 or button) */}
      <Modal
        isOpen={isFindModalOpen}
        onClose={() => setIsFindModalOpen(false)}
        title="Find Cash Payment Voucher (F3)"
        description="Search past vouchers by voucher number, date, payee name, or amount to view or edit."
      >
        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              autoFocus
              placeholder="Search voucher #, payee name, or description..."
              value={findSearchQuery}
              onChange={(e) => setFindSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-4 text-[14px] rounded-xl border border-[#CBD5E1] bg-white text-[#172554] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
            />
            <div className="absolute left-3 top-3 text-[#94A3B8]">
              <Icons.Search size={18} />
            </div>
          </div>

          <div className="max-h-[340px] overflow-y-auto divide-y divide-[#E2E8F0] border border-[#E2E8F0] rounded-xl">
            {filteredSearchVouchers.length === 0 ? (
              <div className="p-8 text-center text-[13px] text-[#64748B]">
                No matching vouchers found for &quot;{findSearchQuery}&quot;.
              </div>
            ) : (
              filteredSearchVouchers.map((v) => {
                const ven = vendors.find((item) => item.id === v.partyId);
                return (
                  <div
                    key={v.id}
                    onClick={() => loadVoucher(v)}
                    className="p-3 hover:bg-[#F8FAFC] cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#172554] text-[14px]">
                          {v.voucherNumber}
                        </span>
                        <span className="text-[12px] text-[#64748B] font-mono">
                          {formatDate(v.date)}
                        </span>
                        {!v.isPosted && <Badge variant="error">Cancelled</Badge>}
                      </div>
                      <div className="text-[13px] text-[#334155] mt-0.5 truncate max-w-[320px]">
                        {ven?.name ? `[${ven.name}] ` : ''}
                        {v.description}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-[#C2410C] text-[14px]">
                        {formatCurrency(v.amount)}
                      </div>
                      <span className="text-[11px] text-[#0F766E] font-semibold">Click to Load →</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setIsFindModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-[13px] font-semibold text-[#64748B] hover:bg-[#F1F5F9]"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}

export default function CashPaymentVouchersPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-[14px] text-[#64748B]">Loading Cash Payment Vouchers...</div>}>
      <CashPaymentVouchersContent />
    </Suspense>
  );
}
