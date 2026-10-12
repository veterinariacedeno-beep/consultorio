import { useState } from 'react';
import { X, PackagePlus } from 'lucide-react';
import type { PharmacyItem, PharmacyRestock } from '../../types';
import { localDateString } from '../../context/AppContext';

interface Props {
  items: PharmacyItem[];
  preselectedItemId?: string;
  onSave: (restock: PharmacyRestock) => void;
  onClose: () => void;
}

export default function RestockForm({ items, preselectedItemId, onSave, onClose }: Props) {
  const [itemId, setItemId] = useState(preselectedItemId ?? items[0]?.id ?? '');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [invoiceRef, setInvoiceRef] = useState('');
  const [date, setDate] = useState(localDateString());

  const selectedItem = items.find(i => i.id === itemId);
  const qtyNum = parseInt(quantity) || 0;
  const unitCostNum = parseFloat(unitCost) || null;
  const totalCost = unitCostNum !== null ? unitCostNum * qtyNum : null;
  const isValid = qtyNum > 0 && !!selectedItem;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedItem || qtyNum <= 0) return;
    const restock: PharmacyRestock = {
      id: crypto.randomUUID(),
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      quantityAdded: qtyNum,
      unitCost: unitCostNum,
      totalCost,
      invoiceRef: invoiceRef.trim(),
      stockBefore: selectedItem.stock,
      stockAfter: selectedItem.stock + qtyNum,
      date,
      createdAt: new Date().toISOString(),
    };
    onSave(restock);
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-slate-800 font-semibold flex items-center gap-2">
            <PackagePlus size={20} className="text-teal-600" />
            Reabastecer Inventario
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Producto *</label>
            <select
              value={itemId}
              onChange={e => { setItemId(e.target.value); setQuantity(''); }}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {items.map(i => (
                <option key={i.id} value={i.id}>
                  {i.name} (stock actual: {i.stock})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 text-sm font-medium mb-1.5">Cantidad Comprada *</label>
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                required
                placeholder="Ej. 10"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 text-sm font-medium mb-1.5">Costo Unitario (USD)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={unitCost}
                onChange={e => setUnitCost(e.target.value)}
                placeholder="Opcional"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Factura / Proveedor</label>
            <input
              value={invoiceRef}
              onChange={e => setInvoiceRef(e.target.value)}
              placeholder="Ej. Distribuidora Vet S.A. — Fac. #1234"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Fecha</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {selectedItem && (
            <div className="bg-teal-50 rounded-lg p-4 space-y-1.5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Stock actual:</span>
                <span className="text-slate-700 font-semibold">{selectedItem.stock} unidades</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">+ Cantidad comprada:</span>
                <span className="text-teal-600 font-semibold">{qtyNum > 0 ? `${qtyNum} unidades` : '—'}</span>
              </div>
              <div className="flex justify-between items-center text-sm pt-1.5 border-t border-teal-100">
                <span className="text-teal-700 font-medium">= Nuevo stock:</span>
                <span className="text-teal-800 font-bold text-base">{selectedItem.stock + (qtyNum > 0 ? qtyNum : 0)} unidades</span>
              </div>
              {totalCost !== null && qtyNum > 0 && (
                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="text-slate-400">Costo total de compra:</span>
                  <span className="text-slate-500 font-medium">${totalCost.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="flex-1 px-4 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirmar Entrada
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
