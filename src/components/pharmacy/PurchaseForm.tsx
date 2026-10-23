import { useState } from 'react';
import { X, Plus, Trash2, Search, PackagePlus, TrendingUp } from 'lucide-react';
import type { PharmacyItem, PurchaseLineItem, InventoryPurchase } from '../../types';
import { localDateString } from '../../context/AppContext';

interface Props {
  items: PharmacyItem[];
  onSave: (purchase: InventoryPurchase) => void;
  onClose: () => void;
}

export default function PurchaseForm({ items, onSave, onClose }: Props) {
  const [supplier, setSupplier] = useState('');
  const [invoiceRef, setInvoiceRef] = useState('');
  const [date, setDate] = useState(localDateString());
  const [lines, setLines] = useState<PurchaseLineItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const filteredItems = items.filter(i =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !lines.some(l => l.itemId === i.id)
  );

  const total = lines.reduce((sum, l) => sum + l.subtotal, 0);

  function addLine(item: PharmacyItem) {
    setLines(prev => [...prev, {
      itemId: item.id,
      itemName: item.name,
      quantity: 1,
      unitCost: item.costPrice,
      subtotal: item.costPrice,
      lotNumber: '',
      expiryDate: '',
    }]);
    setSearchQuery('');
    setShowSearch(false);
  }

  function updateLine(idx: number, patch: Partial<PurchaseLineItem>) {
    setLines(prev => prev.map((l, i) => {
      if (i !== idx) return l;
      const updated = { ...l, ...patch };
      updated.subtotal = updated.quantity * updated.unitCost;
      return updated;
    }));
  }

  function removeLine(idx: number) {
    setLines(prev => prev.filter((_, i) => i !== idx));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supplier.trim() || lines.length === 0) return;
    onSave({
      id: crypto.randomUUID(),
      supplier: supplier.trim(),
      invoiceRef: invoiceRef.trim(),
      date,
      items: lines,
      total,
      createdAt: new Date().toISOString(),
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-slate-800 font-semibold flex items-center gap-2">
            <PackagePlus size={20} className="text-blue-600" />
            Registrar Entrada de Mercadería
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            {/* Header fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-600 text-sm font-medium mb-1.5">Proveedor / Distribuidor *</label>
                <input
                  value={supplier}
                  onChange={e => setSupplier(e.target.value)}
                  required
                  placeholder="Ej. Distribuidora VetPharma"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 text-sm font-medium mb-1.5">N° de Factura</label>
                <input
                  value={invoiceRef}
                  onChange={e => setInvoiceRef(e.target.value)}
                  placeholder="Ej. FAC-2024-1234"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 text-sm font-medium mb-1.5">Fecha de Compra *</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Product search + add */}
            <div className="relative">
              <label className="block text-slate-600 text-sm font-medium mb-1.5">Buscar producto del catálogo</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setShowSearch(true); }}
                  onFocus={() => setShowSearch(true)}
                  placeholder="Escriba el nombre del producto..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {showSearch && searchQuery && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredItems.length === 0 ? (
                    <p className="px-4 py-3 text-slate-400 text-sm">No se encontraron productos.</p>
                  ) : (
                    filteredItems.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => addLine(item)}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-blue-50 transition-colors text-left"
                      >
                        <span className="text-slate-700 text-sm font-medium">{item.name}</span>
                        <span className="text-slate-400 text-xs">Stock: {item.stock} · Costo: ${item.costPrice.toFixed(2)}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Lines table */}
            {lines.length > 0 ? (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left text-slate-600 font-medium px-3 py-2 text-xs uppercase tracking-wide">Producto</th>
                      <th className="text-center text-slate-600 font-medium px-2 py-2 text-xs uppercase tracking-wide">Cant.</th>
                      <th className="text-center text-slate-600 font-medium px-2 py-2 text-xs uppercase tracking-wide">Costo Unit.</th>
                      <th className="text-center text-slate-600 font-medium px-2 py-2 text-xs uppercase tracking-wide hidden md:table-cell">Lote</th>
                      <th className="text-center text-slate-600 font-medium px-2 py-2 text-xs uppercase tracking-wide hidden md:table-cell">Vence</th>
                      <th className="text-right text-slate-600 font-medium px-3 py-2 text-xs uppercase tracking-wide">Subtotal</th>
                      <th className="px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lines.map((line, idx) => (
                      <tr key={line.itemId}>
                        <td className="px-3 py-2 text-slate-700 font-medium text-xs">{line.itemName}</td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min="1"
                            value={line.quantity}
                            onChange={e => updateLine(idx, { quantity: parseInt(e.target.value) || 1 })}
                            className="w-14 px-1.5 py-1 rounded border border-slate-200 text-slate-800 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.unitCost}
                            onChange={e => updateLine(idx, { unitCost: parseFloat(e.target.value) || 0 })}
                            className="w-20 px-1.5 py-1 rounded border border-slate-200 text-slate-800 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-2 py-2 hidden md:table-cell">
                          <input
                            value={line.lotNumber}
                            onChange={e => updateLine(idx, { lotNumber: e.target.value })}
                            placeholder="—"
                            className="w-20 px-1.5 py-1 rounded border border-slate-200 text-slate-800 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-2 py-2 hidden md:table-cell">
                          <input
                            type="date"
                            value={line.expiryDate}
                            onChange={e => updateLine(idx, { expiryDate: e.target.value })}
                            className="w-32 px-1.5 py-1 rounded border border-slate-200 text-slate-800 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-3 py-2 text-right text-slate-800 font-semibold tabular-nums text-xs">
                          ${line.subtotal.toFixed(2)}
                        </td>
                        <td className="px-2 py-2">
                          <button
                            type="button"
                            onClick={() => removeLine(idx)}
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                    <tr>
                      <td colSpan={5} className="px-3 py-2.5 text-right text-slate-600 text-xs font-semibold uppercase tracking-wide">
                        Total Factura
                      </td>
                      <td className="px-3 py-2.5 text-right text-blue-700 font-bold text-base tabular-nums">
                        ${total.toFixed(2)}
                      </td>
                      <td className="px-2 py-2.5" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center">
                <Plus size={28} className="text-slate-300 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">Busca y agrega productos arriba para iniciar la compra.</p>
              </div>
            )}

            {/* Info note */}
            {lines.length > 0 && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-2">
                <TrendingUp size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-blue-700 text-xs">
                  Al guardar, se actualizará automáticamente el stock y el precio de costo de cada producto en el catálogo.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t border-slate-100 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!supplier.trim() || lines.length === 0}
              className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Registrar Compra
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
