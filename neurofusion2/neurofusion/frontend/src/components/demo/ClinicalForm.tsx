import React from 'react';
import { HelpCircle, UserCheck, Brain, Loader2 } from 'lucide-react';
import type { ClinicalFormValues, SamplePatient } from '../../lib/types';

interface ClinicalFormProps {
  values: ClinicalFormValues;
  onChange: (vals: ClinicalFormValues) => void;
  samples: SamplePatient[];
  onSelectSample: (sample: SamplePatient) => void;
  selectedSampleId: string | null;
  onSubmit: () => void;
  isLoading: boolean;
  hasScan: boolean;
}

export const ClinicalForm: React.FC<ClinicalFormProps> = ({
  values,
  onChange,
  samples,
  onSelectSample,
  selectedSampleId,
  onSubmit,
  isLoading,
  hasScan,
}) => {
  const updateField = <K extends keyof ClinicalFormValues>(
    key: K,
    val: ClinicalFormValues[K]
  ) => {
    onChange({ ...values, [key]: val });
  };

  // Interpretations for MMSE
  const getMmseCategory = (score: number) => {
    if (score >= 27) return { text: 'Normal Cognition', color: 'text-emerald-800 bg-emerald-100 border-emerald-300' };
    if (score >= 24) return { text: 'Mild Impairment / MCI', color: 'text-amber-800 bg-amber-100 border-amber-300' };
    if (score >= 18) return { text: 'Moderate Decline', color: 'text-orange-800 bg-orange-100 border-orange-300' };
    return { text: 'Severe Decline', color: 'text-red-800 bg-red-100 border-red-300' };
  };

  // Interpretations for CDRSB
  const getCdrCategory = (score: number) => {
    if (score === 0) return { text: 'Normal (CDR 0)', color: 'text-emerald-800 bg-emerald-100 border-emerald-300' };
    if (score <= 2.5) return { text: 'Very Mild (CDR 0.5)', color: 'text-amber-800 bg-amber-100 border-amber-300' };
    if (score <= 9.0) return { text: 'Mild/Moderate (CDR 1-2)', color: 'text-orange-800 bg-orange-100 border-orange-300' };
    return { text: 'Severe (CDR 3)', color: 'text-red-800 bg-red-100 border-red-300' };
  };

  const mmseInfo = getMmseCategory(values.mmse);
  const cdrInfo = getCdrCategory(values.cdrsb);

  return (
    <div className="space-y-6">
      {/* Sample Patient Quick Selector */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-1 mb-2.5">
          <label className="text-[13px] sm:text-[14px] font-semibold uppercase tracking-[0.06em] text-slate-700 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-emerald-700" />
            <span>Load Sample ADNI Patient</span>
          </label>
          <span className="text-[14px] text-slate-600 font-medium">Pre-calibrated test cases</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {samples.map((sample) => {
            const isSelected = selectedSampleId === sample.id;
            const isCN = sample.category.includes('Normal');
            const subjectId = sample.label.split(' ')[1] || sample.id;
            return (
              <button
                key={sample.id}
                type="button"
                onClick={() => onSelectSample(sample)}
                disabled={isLoading}
                className={`p-3 rounded-2xl text-left border transition-all flex flex-col justify-between gap-1.5 ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/90 shadow-sm ring-1 ring-emerald-600'
                    : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[14px] sm:text-[15px] font-bold text-[#0a0a0a] tracking-tight">
                    {subjectId}
                  </span>
                  <span
                    className={`text-[12px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                      isCN
                        ? 'text-emerald-800 bg-emerald-100 border border-emerald-300'
                        : 'text-red-800 bg-red-100 border border-red-300'
                    }`}
                  >
                    {isCN ? 'CN' : 'Dementia'}
                  </span>
                </div>
                <div className="text-[13px] sm:text-[14px] font-medium text-slate-600 flex items-center justify-between">
                  <span>MMSE: <strong className="text-slate-900">{sample.mmse}</strong></span>
                  <span>CDR: <strong className="text-slate-900">{sample.cdrsb}</strong></span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Clinical Biomarkers Form Fields */}
      <div className="space-y-4.5">
        {/* MMSE Score Slider */}
        <div className="p-4 sm:p-4.5 rounded-2xl bg-gray-50/90 border border-gray-200 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[17px] font-semibold text-[#0a0a0a]">MMSE Score</span>
              <span className="text-[14px] text-slate-600 font-mono font-medium">(0–30)</span>
              <span
                className="text-slate-500 hover:text-slate-800 cursor-help"
                title="Mini-Mental State Exam: Standardized 30-point questionnaire assessing cognitive impairment. Scores ≥27 typically indicate normal cognition."
              >
                <HelpCircle className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className={`text-[13px] sm:text-[14px] font-semibold px-2.5 py-0.5 rounded-full border ${mmseInfo.color}`}>
                {mmseInfo.text}
              </span>
              <span className="text-[22px] sm:text-[24px] font-bold font-mono text-[#0a0a0a] w-8 text-right tabular-nums">
                {values.mmse}
              </span>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="30"
            step="1"
            value={values.mmse}
            onChange={(e) => updateField('mmse', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            disabled={isLoading}
          />
          <div className="flex justify-between text-[14px] font-medium text-slate-600 font-mono mt-1.5">
            <span>0 (Severe)</span>
            <span>18</span>
            <span>24</span>
            <span>30 (Optimal)</span>
          </div>
        </div>

        {/* CDRSB Score Slider */}
        <div className="p-4 sm:p-4.5 rounded-2xl bg-gray-50/90 border border-gray-200 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[17px] font-semibold text-[#0a0a0a]">CDR Sum of Boxes</span>
              <span className="text-[14px] text-slate-600 font-mono font-medium">(0–18)</span>
              <span
                className="text-slate-500 hover:text-slate-800 cursor-help"
                title="Clinical Dementia Rating Sum of Boxes: Evaluates 6 domains (Memory, Orientation, Judgment, Community, Home, Personal care). 0 is normal."
              >
                <HelpCircle className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className={`text-[13px] sm:text-[14px] font-semibold px-2.5 py-0.5 rounded-full border ${cdrInfo.color}`}>
                {cdrInfo.text}
              </span>
              <span className="text-[22px] sm:text-[24px] font-bold font-mono text-[#0a0a0a] w-12 text-right tabular-nums">
                {values.cdrsb}
              </span>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="18"
            step="0.5"
            value={values.cdrsb}
            onChange={(e) => updateField('cdrsb', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            disabled={isLoading}
          />
          <div className="flex justify-between text-[14px] font-medium text-slate-600 font-mono mt-1.5">
            <span>0 (Normal)</span>
            <span>4.5</span>
            <span>9.0</span>
            <span>18 (Severe)</span>
          </div>
        </div>

        {/* Demographics: Age, Sex, Education */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Age */}
          <div className="p-3.5 rounded-2xl bg-gray-50/90 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[16px] sm:text-[17px] font-semibold text-[#0a0a0a]">Age</span>
              <span className="text-[20px] sm:text-[22px] font-mono font-bold text-[#0a0a0a] tabular-nums">{values.age} <span className="text-[14px] font-normal text-slate-600">yrs</span></span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="1"
              value={values.age}
              onChange={(e) => updateField('age', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              disabled={isLoading}
            />
          </div>

          {/* Sex */}
          <div className="p-3.5 rounded-2xl bg-gray-50/90 border border-gray-200 shadow-sm">
            <span className="text-[16px] sm:text-[17px] font-semibold text-[#0a0a0a] block mb-2">Sex</span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => updateField('sex', 'Male')}
                disabled={isLoading}
                className={`py-2 text-[15px] font-semibold rounded-xl transition-colors min-h-[40px] ${
                  values.sex === 'Male'
                    ? 'bg-[#0a0a0a] text-white shadow-sm'
                    : 'bg-white border border-gray-300 text-slate-700 hover:text-black hover:bg-gray-100'
                }`}
              >
                Male
              </button>
              <button
                type="button"
                onClick={() => updateField('sex', 'Female')}
                disabled={isLoading}
                className={`py-2 text-[15px] font-semibold rounded-xl transition-colors min-h-[40px] ${
                  values.sex === 'Female'
                    ? 'bg-[#0a0a0a] text-white shadow-sm'
                    : 'bg-white border border-gray-300 text-slate-700 hover:text-black hover:bg-gray-100'
                }`}
              >
                Female
              </button>
            </div>
          </div>

          {/* Education */}
          <div className="p-3.5 rounded-2xl bg-gray-50/90 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[16px] sm:text-[17px] font-semibold text-[#0a0a0a]">Education</span>
              <span className="text-[20px] sm:text-[22px] font-mono font-bold text-[#0a0a0a] tabular-nums">{values.education} <span className="text-[14px] font-normal text-slate-600">yrs</span></span>
            </div>
            <input
              type="range"
              min="4"
              max="24"
              step="1"
              value={values.education}
              onChange={(e) => updateField('education', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={isLoading || !hasScan}
        className={`w-full min-h-[48px] py-3.5 px-5 rounded-2xl font-bold text-[16px] sm:text-[17px] flex items-center justify-center gap-2.5 transition-all shadow-md ${
          !hasScan
            ? 'bg-gray-200 text-slate-500 cursor-not-allowed border border-gray-300'
            : isLoading
            ? 'bg-emerald-700 text-white cursor-wait'
            : 'bg-[#0a0a0a] hover:bg-[#222] text-white hover:-translate-y-0.5 active:translate-y-0 shadow-lg'
        }`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processing 3D Volume &amp; Biomarkers...</span>
          </>
        ) : (
          <>
            <Brain className="w-5 h-5" />
            <span>{hasScan ? 'Run Multimodal Prediction' : 'Upload Scan or Select Sample'}</span>
          </>
        )}
      </button>
    </div>
  );
};
