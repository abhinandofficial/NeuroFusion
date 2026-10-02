import React, { useRef, useState } from 'react';
import { UploadCloud, FileCheck, AlertCircle, Trash2, Shield } from 'lucide-react';

interface NiftiUploaderProps {
  file: File | null;
  setFile: (file: File | null) => void;
  selectedSampleId: string | null;
  setSelectedSampleId: (id: string | null) => void;
  isLoading: boolean;
}

export const NiftiUploader: React.FC<NiftiUploaderProps> = ({
  file,
  setFile,
  selectedSampleId,
  setSelectedSampleId,
  isLoading
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (f: File) => {
    setErrorMsg(null);
    const name = f.name.toLowerCase();
    if (!name.endsWith('.nii') && !name.endsWith('.nii.gz')) {
      setErrorMsg('Invalid file format. Please upload a NIfTI volume (.nii or .nii.gz).');
      return;
    }
    if (f.size > 250 * 1024 * 1024) {
      setErrorMsg('File exceeds 250 MB size limit.');
      return;
    }
    setSelectedSampleId(null);
    setFile(f);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) validateAndSetFile(e.dataTransfer.files[0]);
  };
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) validateAndSetFile(e.target.files[0]);
  };
  const clearFile = () => {
    setFile(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-[17px] font-semibold text-[#0a0a0a] flex items-center gap-2">
          <span>Structural Brain MRI Scan</span>
          <span className="text-[14px] text-emerald-700 font-mono font-semibold">(.nii, .nii.gz)</span>
        </label>
        <div className="flex items-center gap-1.5 text-[14px] text-slate-600 font-medium" title="All processing is ephemeral in-memory">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span>In-Memory Privacy</span>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".nii,.nii.gz"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={isLoading}
      />

      {!file && !selectedSampleId ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all focus-within:ring-2 focus-within:ring-emerald-500 ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50'
              : 'border-gray-300 hover:border-emerald-500 bg-gray-50/80 hover:bg-emerald-50/40'
          }`}
        >
          <div className="mx-auto w-12 h-12 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-slate-500 mb-3">
            <UploadCloud className="w-6 h-6 text-slate-600" />
          </div>
          <p className="text-[16px] sm:text-[17px] font-medium text-slate-800 leading-normal">
            Drag &amp; drop NIfTI volume here, or{' '}
            <span className="text-emerald-700 font-semibold underline underline-offset-4 hover:text-emerald-800">browse</span>
          </p>
          <p className="text-[14px] text-slate-600 mt-1.5 leading-relaxed">
            Accepts 1.5T or 3T T1-weighted MPRAGE (.nii or .nii.gz up to 250MB)
          </p>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center justify-between gap-3.5">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
              <FileCheck className="w-6 h-6" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[16px] font-semibold text-[#0a0a0a] truncate">
                {file ? file.name : `Sample Patient Scan (${selectedSampleId})`}
              </p>
              <p className="text-[14px] text-slate-600 font-medium">
                {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB · Ready for RAS Preprocessing` : 'ADNI Baseline Preloaded Scan'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearFile}
            disabled={isLoading}
            className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Remove scan"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2.5 text-[14px] font-medium text-red-700 bg-red-50 border border-red-200 p-3.5 rounded-xl">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
