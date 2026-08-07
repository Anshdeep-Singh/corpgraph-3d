'use client';

import React, { useEffect, useState } from 'react';
import { fetchSECFilings, SECFiling } from '@/lib/api/secEdgar';
import { FileText, ExternalLink, Filter, Loader2, Calendar } from 'lucide-react';

interface FilingsViewerPaneProps {
  symbol: string;
}

export default function FilingsViewerPane({ symbol }: FilingsViewerPaneProps) {
  const [loading, setLoading] = useState(true);
  const [filings, setFilings] = useState<SECFiling[]>([]);
  const [filterForm, setFilterForm] = useState<string>('ALL');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchSECFilings(symbol).then((res) => {
      if (isMounted) {
        setFilings(res);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [symbol]);

  const filteredFilings =
    filterForm === 'ALL' ? filings : filings.filter((f) => f.form.toUpperCase() === filterForm);

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#090b11] text-amber-400 font-mono text-xs">
        <Loader2 className="w-8 h-8 animate-spin mb-2 text-amber-500" />
        <span>FETCHING SEC EDGAR RECENT FILINGS FOR {symbol.toUpperCase()}...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#090b11] text-slate-100 font-mono text-xs flex flex-col p-3 overflow-y-auto select-none">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#1f2536] pb-2.5 mb-3 gap-2 shrink-0">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-pink-400" />
          <span className="font-bold text-pink-300 text-sm tracking-wide">
            SEC EDGAR RECENT FILINGS ({symbol.toUpperCase()})
          </span>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center space-x-1.5 text-[11px]">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">FORM:</span>
          <select
            value={filterForm}
            onChange={(e) => setFilterForm(e.target.value)}
            className="bg-[#121624] border border-[#232a3d] text-amber-300 rounded px-2 py-0.5 focus:outline-none focus:border-amber-500 font-bold"
          >
            <option value="ALL">ALL FILINGS</option>
            <option value="10-K">10-K (ANNUAL)</option>
            <option value="10-Q">10-Q (QUARTERLY)</option>
            <option value="8-K">8-K (CURRENT)</option>
            <option value="FORM 4">FORM 4 (INSIDER)</option>
          </select>
        </div>
      </div>

      {/* Filings Table */}
      <div className="overflow-x-auto border border-[#1e2333] rounded bg-[#0c0f18] flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#121624] text-amber-400 border-b border-[#1e2333] text-[10px] font-bold">
              <th className="p-2.5">FORM</th>
              <th className="p-2.5">FILING DATE</th>
              <th className="p-2.5">DESCRIPTION / ITEMS</th>
              <th className="p-2.5">ACCESSION NO.</th>
              <th className="p-2.5 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#181d2a] text-[11px]">
            {filteredFilings.map((f, idx) => (
              <tr key={idx} className="hover:bg-[#131724] transition-colors">
                <td className="p-2.5 font-bold">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] ${
                      f.form === '10-K'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : f.form === '10-Q'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : f.form === '8-K'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    }`}
                  >
                    {f.form}
                  </span>
                </td>
                <td className="p-2.5 text-slate-300 font-mono">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>{f.filingDate}</span>
                  </span>
                </td>
                <td className="p-2.5 text-slate-200 max-w-[280px] truncate">{f.description}</td>
                <td className="p-2.5 text-slate-400 font-mono text-[10px]">{f.accessionNumber}</td>
                <td className="p-2.5 text-right">
                  <a
                    href={`https://www.sec.gov/edgar/browse/?CIK=${symbol}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#181e2e] hover:bg-[#222a40] text-amber-300 hover:text-amber-200 rounded border border-[#2b344c] text-[10px] font-bold transition-colors"
                  >
                    <span>SEC</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
