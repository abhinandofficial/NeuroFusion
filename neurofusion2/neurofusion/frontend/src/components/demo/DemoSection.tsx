import React, { useState } from 'react';
import { NiftiUploader } from './NiftiUploader';
import { ClinicalForm } from './ClinicalForm';
import { MriViewer } from './MriViewer';
import { PredictionResults } from './PredictionResults';
import { ExplainabilityPanel } from './ExplainabilityPanel';
import { RepresentationMap } from './RepresentationMap';
import type {
  ClinicalFormValues,
  PredictionResult,
  SliceData,
  SamplePatient
} from '../../lib/types';
import {
  predictWithUpload,
  predictSamplePatient,
  fetchOrthogonalSlice
} from '../../lib/api';
import { Activity, AlertCircle } from 'lucide-react';

interface DemoSectionProps {
  samples: SamplePatient[];
}

export const DemoSection: React.FC<DemoSectionProps> = ({ samples }) => {
  const [file, setFile] = useState<File | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [clinicalValues, setClinicalValues] = useState<ClinicalFormValues>({
    mmse: 28,
    cdrsb: 0.0,
    age: 72,
    sex: 'Male',
    education: 16
  });

  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [slices, setSlices] = useState<SliceData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Explainability Heatmap State
  const [heatmapVolume, setHeatmapVolume] = useState<{ data: Float32Array; shape: [number, number, number] } | null>(null);
  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(0.65);
  const [heatmapColormap, setHeatmapColormap] = useState<'turbo' | 'jet' | 'hot' | 'inferno'>('turbo');
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);

  const handleSelectSample = async (sample: SamplePatient) => {
    setSelectedSampleId(sample.id);
    setFile(null);
    setHeatmapVolume(null);
    setClinicalValues({
      mmse: sample.mmse,
      cdrsb: sample.cdrsb,
      age: sample.age,
      sex: sample.sex,
      education: sample.education
    });
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const response = await predictSamplePatient(sample.id);
      setPrediction(response.prediction);
      setSessionId(response.session_id);
      setSlices(response.slices);
    } catch (err: any) {
      setErrorMessage(err.message || 'Sample prediction failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitPrediction = async () => {
    setErrorMessage(null);
    setHeatmapVolume(null);
    setIsLoading(true);
    try {
      if (file) {
        const response = await predictWithUpload(file, clinicalValues);
        setPrediction(response.prediction);
        setSessionId(response.session_id);
        setSlices(response.slices);
      } else if (selectedSampleId) {
        const response = await predictSamplePatient(selectedSampleId);
        setPrediction(response.prediction);
        setSessionId(response.session_id);
        setSlices(response.slices);
      } else {
        setErrorMessage('Please upload a NIfTI scan or choose a sample patient first.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Prediction failed. Check backend connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSliceChange = async (
    plane: 'axial' | 'coronal' | 'sagittal',
    value: number
  ) => {
    if (!sessionId && !selectedSampleId) return;
    try {
      const updatedSlices = await fetchOrthogonalSlice({
        sessionId: sessionId || undefined,
        sampleId: !sessionId && selectedSampleId ? selectedSampleId : undefined,
        [plane]: value
      });
      setSlices(updatedSlices);
    } catch (err) {
      console.warn('Slice fetch error:', err);
    }
  };

  const handleSessionPurged = () => {
    setSessionId(null);
    setHeatmapVolume(null);
  };

  const hasScan = !!file || !!selectedSampleId;

  return (
    <section id="demo" className="py-16 sm:py-20 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto">
          <p className="eyebrow text-emerald-600 mb-2 flex items-center justify-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            Interactive Inference Pipeline
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0a0a0a] tracking-tight">Live Multimodal Inference</h2>
          <p className="mt-3 text-sm text-slate-500 leading-relaxed">
            Upload a T1 MPRAGE NIfTI scan or load an ADNI test subject. Adjust clinical biomarkers,
            tune classification thresholds, inspect multi-method saliency maps, and examine cohort representation clusters.
          </p>
        </div>

        {/* Error banner */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2.5 max-w-3xl mx-auto">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            <div className="flex-1">
              <strong className="font-semibold">Notice:</strong> {errorMessage}
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs text-red-500 hover:text-red-700 underline ml-auto"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Two-column workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* Left: inputs (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
            <NiftiUploader
              file={file}
              setFile={setFile}
              selectedSampleId={selectedSampleId}
              setSelectedSampleId={setSelectedSampleId}
              isLoading={isLoading}
            />
            <div className="border-t border-gray-100 pt-5">
              <ClinicalForm
                values={clinicalValues}
                onChange={setClinicalValues}
                samples={samples}
                onSelectSample={handleSelectSample}
                selectedSampleId={selectedSampleId}
                onSubmit={handleSubmitPrediction}
                isLoading={isLoading}
                hasScan={hasScan}
              />
            </div>
          </div>

          {/* Right: viewer + results (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <MriViewer
              slices={slices}
              onSliceChange={handleSliceChange}
              heatmapVolume={heatmapVolume}
              heatmapOpacity={heatmapOpacity}
              heatmapColormap={heatmapColormap}
              showHeatmap={showHeatmap}
            />
            <PredictionResults
              result={prediction}
              isLoading={isLoading}
              onSessionPurged={handleSessionPurged}
            />
          </div>
        </div>

        {/* Multi-Method Explainability Section */}
        <ExplainabilityPanel
          sessionId={sessionId || undefined}
          onHeatmapLoaded={(volume) => setHeatmapVolume(volume)}
          heatmapOpacity={heatmapOpacity}
          setHeatmapOpacity={setHeatmapOpacity}
          colormap={heatmapColormap}
          setColormap={setHeatmapColormap}
          showHeatmap={showHeatmap}
          setShowHeatmap={setShowHeatmap}
        />

        {/* Representation Clustering Map */}
        <RepresentationMap
          clinicalValues={clinicalValues}
          currentPatientCoords={prediction?.patient_coords}
        />
      </div>
    </section>
  );
};

