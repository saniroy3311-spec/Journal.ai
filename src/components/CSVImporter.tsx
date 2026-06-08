import React, { useState } from 'react';
import { Upload, X, CheckCircle2, AlertCircle, HelpCircle, FileText } from 'lucide-react';
import type { Trade } from '../types';

interface CSVImporterProps {
  token: string;
  onImportComplete: () => void;
  onClose: () => void;
}

export const CSVImporter: React.FC<CSVImporterProps> = ({ token, onImportComplete, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'IDLE' | 'PARSING' | 'IMPORTING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');
  const [importedCount, setImportedCount] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setStatus('IDLE');
      setErrorMessage('');
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setStatus('PARSING');
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/);
        if (lines.length < 2) {
          throw new Error('CSV file is empty or missing headers.');
        }

        // Parse Headers
        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
        const expectedHeaders = ['date', 'symbol', 'type', 'market', 'entryprice', 'exitprice', 'quantity', 'strategy', 'emotion', 'notes', 'tags'];
        
        // Basic header check
        const missing = expectedHeaders.filter((h) => !headers.includes(h) && h !== 'tags');
        if (missing.length > 0) {
          throw new Error(`Missing required CSV column headers: ${missing.join(', ')}`);
        }

        const tradesToImport: Trade[] = [];

        // Parse Rows
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].trim();
          if (!row) continue; // skip blank lines

          // Simple CSV splitter that respects quotes is helpful, but standard split is fine for simple values.
          // Let's implement a clean comma splitter that parses quoted strings.
          const columns: string[] = [];
          let insideQuotes = false;
          let currentColumn = '';
          for (let charIdx = 0; charIdx < row.length; charIdx++) {
            const char = row[charIdx];
            if (char === '"') {
              insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
              columns.push(currentColumn.trim());
              currentColumn = '';
            } else {
              currentColumn += char;
            }
          }
          columns.push(currentColumn.trim());

          const getColValue = (headerName: string) => {
            const idx = headers.indexOf(headerName);
            return idx !== -1 ? columns[idx] : '';
          };

          const symbol = getColValue('symbol').toUpperCase();
          const type = getColValue('type').toUpperCase() as 'BUY' | 'SELL';
          const market = getColValue('market').toUpperCase() as 'EQUITY' | 'INDEX' | 'CRYPTO';
          const entryPrice = parseFloat(getColValue('entryprice'));
          const exitPrice = parseFloat(getColValue('exitprice'));
          const quantity = parseFloat(getColValue('quantity'));
          const dateStr = getColValue('date');
          const strategy = getColValue('strategy') || 'Naked Price Action';
          const emotion = getColValue('emotion') || '😊';
          const notes = getColValue('notes') || '';
          
          // Tags parsing (comma separated list in the column, e.g. "FOMO;EarlyExit" or "#FOMO;#EarlyExit")
          const tagsStr = getColValue('tags') || '';
          const tags = tagsStr 
            ? tagsStr.split(/[;,]/).map(t => {
                let tag = t.trim();
                if (tag && !tag.startsWith('#')) tag = '#' + tag;
                return tag;
              }).filter(t => t.length > 0)
            : [];

          if (!symbol || !type || !market || isNaN(entryPrice) || isNaN(exitPrice) || isNaN(quantity) || !dateStr) {
            console.warn(`Skipping invalid CSV row ${i + 1}: ${row}`);
            continue;
          }

          const calculatedPnL = type === 'BUY' ? (exitPrice - entryPrice) * quantity : (entryPrice - exitPrice) * quantity;
          const calculatedPnLPercent = (calculatedPnL / (entryPrice * quantity)) * 100;

          tradesToImport.push({
            id: Math.random().toString(36).substring(2, 11),
            symbol,
            type,
            market,
            entryPrice,
            exitPrice,
            quantity,
            date: new Date(dateStr).toISOString(),
            strategy,
            emotion,
            sl: entryPrice * 0.95, // default SL
            tp: entryPrice * 1.05, // default TP
            pnl: calculatedPnL,
            pnlPercentage: calculatedPnLPercent,
            notes,
            status: 'CLOSED',
            recurring: 'NONE',
            tags,
            executions: []
          });
        }

        if (tradesToImport.length === 0) {
          throw new Error('No valid trade logs found in the CSV file.');
        }

        setStatus('IMPORTING');
        let imported = 0;

        // Upload in parallel batches of 5 to avoid overloading
        const batchSize = 5;
        for (let batchIdx = 0; batchIdx < tradesToImport.length; batchIdx += batchSize) {
          const batch = tradesToImport.slice(batchIdx, batchIdx + batchSize);
          await Promise.all(
            batch.map(async (trade) => {
              const res = await fetch('/api/trades', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  ...trade,
                  tags: JSON.stringify(trade.tags || []),
                  executions: JSON.stringify(trade.executions || [])
                })
              });
              if (res.ok) {
                imported++;
              }
            })
          );
          setImportedCount(imported);
        }

        setStatus('SUCCESS');
        onImportComplete();
      } catch (err: any) {
        console.error(err);
        setStatus('ERROR');
        setErrorMessage(err.message || 'Failed to parse CSV file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-[#D9D9D2] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto scrollbar-thin select-none">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-[#D9D9D2]/60">
          <h3 className="text-sm font-extrabold font-display text-[#1C1C1E] uppercase tracking-tight flex items-center gap-1.5">
            <FileText size={16} className="text-[#244230]" /> Import Broker Trade Logs
          </h3>
          <button
            onClick={onClose}
            className="text-[#5C5C5E] hover:text-[#1C1C1E] p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        {status === 'SUCCESS' ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 size={44} className="mx-auto text-[#166534]" />
            <h4 className="text-sm font-bold text-[#1C1C1E]">Import Successful!</h4>
            <p className="text-xs text-[#5C5C5E] font-semibold">
              Successfully imported {importedCount} trades into your Turso Cloud Database.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-5 py-2 bg-[#244230] text-white rounded-xl text-xs font-bold hover:bg-[#1D3526] transition-all cursor-pointer"
            >
              Done & Close
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Guide Template block */}
            <div className="p-3.5 bg-[#FAFAF7] border border-[#D9D9D2] rounded-xl space-y-1.5 text-left">
              <span className="text-[10px] font-extrabold text-[#244230] uppercase tracking-wider block flex items-center gap-1">
                <HelpCircle size={12} /> CSV Format Requirements
              </span>
              <p className="text-[10px] text-[#5C5C5E] font-medium leading-relaxed">
                Make sure your CSV file has a header row with these exact names (case-insensitive):
              </p>
              <code className="block p-2 bg-white border border-[#D9D9D2]/70 rounded-lg text-[9px] font-mono font-bold text-[#1C1C1E] select-all overflow-x-auto">
                Date, Symbol, Type, Market, EntryPrice, ExitPrice, Quantity, Strategy, Emotion, Notes, Tags
              </code>
              <p className="text-[9px] text-[#5C5C5E] font-medium leading-none">
                * Note: `Type` can be BUY/SELL. `Market` can be EQUITY/INDEX/CRYPTO. `Tags` is semi-colon separated (e.g. FOMO;EarlyExit).
              </p>
            </div>

            {/* File Drag-and-Drop Dropzone */}
            <div className="relative border-2 border-dashed border-[#D9D9D2] hover:border-[#244230] transition-colors rounded-xl p-6 text-center cursor-pointer bg-[#FAFAF7]">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload size={28} className="mx-auto text-[#5C5C5E] mb-2" />
              <p className="text-xs font-bold text-[#1C1C1E]">
                {file ? file.name : 'Click or drag a CSV file here to upload'}
              </p>
              {file && (
                <p className="text-[10px] text-[#5C5C5E] font-semibold mt-1">
                  Size: {(file.size / 1024).toFixed(1)} KB
                </p>
              )}
            </div>

            {/* Status indicators */}
            {status === 'PARSING' && (
              <p className="text-xs text-[#5C5C5E] font-bold text-center animate-pulse">
                Parsing CSV rows...
              </p>
            )}
            {status === 'IMPORTING' && (
              <p className="text-xs text-[#166534] font-bold text-center animate-pulse">
                Uploading trades to Turso cloud: {importedCount} imported...
              </p>
            )}
            {status === 'ERROR' && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-[#991B1B]">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold block">Import Failed</span>
                  <span className="font-medium">{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[#D9D9D2] text-[#5C5C5E] rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={!file || status === 'PARSING' || status === 'IMPORTING'}
                className="px-4 py-2 bg-[#244230] text-white rounded-xl text-xs font-bold hover:bg-[#1D3526] transition-colors cursor-pointer disabled:opacity-50"
              >
                Import Logs
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
