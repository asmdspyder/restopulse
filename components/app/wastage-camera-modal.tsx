"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera,
  X,
  Check,
  RotateCcw,
  Loader2,
  AlertCircle,
  UtensilsCrossed,
} from "lucide-react";
import { compressChecklistImage } from "@/lib/utils/image-compression";

interface WastageCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName?: string;
  onPhotoCaptured: (data: { blob: Blob; previewUrl: string; sizeBytes: number }) => void;
}

export function WastageCameraModal({
  isOpen,
  onClose,
  itemName = "Wastage Item",
  onPhotoCaptured,
}: WastageCameraModalProps) {
  // View states: "camera" | "preview"
  const [viewMode, setViewMode] = useState<"camera" | "preview">("camera");

  // Camera stream state
  const [isStartingCamera, setIsStartingCamera] = useState(false);

  // Snapshot preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewMeta, setPreviewMeta] = useState<{ width: number; height: number; sizeBytes: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Safely stop and release camera hardware
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      try {
        videoRef.current.load();
      } catch (e) {}
    }
    setIsStartingCamera(false);
  }, []);

  // Start Camera with back/environment camera
  const startCamera = useCallback(async () => {
    setError(null);
    setViewMode("camera");
    setIsStartingCamera(true);

    // 1. Release previous stream and wait a brief tick for OS hardware unlock
    stopCameraStream();
    await new Promise((r) => setTimeout(r, 60));

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsStartingCamera(false);
      setError("Live camera is not supported or permission is blocked in this browser.");
      return;
    }

    let stream: MediaStream | null = null;

    // Tier 1: Try back/environment camera
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
    } catch (e) {
      console.warn("Back camera facingMode failed, attempting standard video constraint:", e);
    }

    // Tier 2: Fallback to basic generic video constraint
    if (!stream) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      } catch (err: any) {
        console.error("Camera access error:", err);
        setIsStartingCamera(false);
        setError(
          err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
            ? "Camera permission was denied. Please allow camera access in your browser settings."
            : err.message || "Failed to access device camera."
        );
        return;
      }
    }

    if (stream) {
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn("Video play exception:", playErr);
        }
      }
    }

    setIsStartingCamera(false);
  }, [stopCameraStream]);

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen) {
      setViewMode("camera");
      setPreviewUrl(null);
      setPreviewBlob(null);
      setPreviewMeta(null);
      startCamera();
    }
    return () => {
      stopCameraStream();
    };
  }, [isOpen, startCamera, stopCameraStream]);

  if (!isOpen) return null;

  // Instant Snapshot Capture
  const handleCaptureFrame = async () => {
    if (!videoRef.current) {
      setError("Camera feed not ready yet.");
      return;
    }

    try {
      const video = videoRef.current;
      const width = video.videoWidth || video.clientWidth || 1280;
      const height = video.videoHeight || video.clientHeight || 720;

      if (width === 0 || height === 0) {
        setError("Camera feed is loading. Please wait a moment and try again.");
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D context unavailable");

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, width, height);

      // Stop camera stream immediately
      stopCameraStream();

      // Zero-lag immediate visual preview
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      setPreviewUrl(dataUrl);
      setViewMode("preview");
      setIsProcessing(true);

      // Compress to high quality WebP
      canvas.toBlob(
        async (rawBlob) => {
          if (!rawBlob) {
            setIsProcessing(false);
            setError("Failed to create photo blob");
            return;
          }

          try {
            const compressed = await compressChecklistImage(rawBlob, 1600, 1600, 0.8);
            setPreviewBlob(compressed.blob);
            setPreviewMeta({
              width: compressed.width,
              height: compressed.height,
              sizeBytes: compressed.blob.size,
            });
          } catch (compErr: any) {
            console.warn("Compression fallback:", compErr);
            setPreviewBlob(rawBlob);
            setPreviewMeta({
              width,
              height,
              sizeBytes: rawBlob.size,
            });
          } finally {
            setIsProcessing(false);
          }
        },
        "image/jpeg",
        0.92
      );
    } catch (err: any) {
      console.error("Capture error:", err);
      setError(err.message || "Failed to capture photo from camera");
    }
  };

  // Retake photo: reopen live camera
  const handleRetake = () => {
    setPreviewBlob(null);
    setPreviewUrl(null);
    setPreviewMeta(null);
    setError(null);
    startCamera();
  };

  // Confirm photo capture & pass back to parent form
  const handleConfirmPhoto = async () => {
    let finalBlob = previewBlob;

    if (!finalBlob && previewUrl && previewUrl.startsWith("data:")) {
      try {
        const fetchRes = await fetch(previewUrl);
        finalBlob = await fetchRes.blob();
      } catch (e) {}
    }

    if (!finalBlob || !previewUrl) {
      setError("Photo is not ready yet. Please wait a second or retake.");
      return;
    }

    onPhotoCaptured({
      blob: finalBlob,
      previewUrl,
      sizeBytes: finalBlob.size,
    });

    stopCameraStream();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                Photo Proof (Optional)
              </div>
              <h3 className="text-base font-extrabold text-slate-900 line-clamp-1">
                {itemName}
              </h3>
            </div>
          </div>
          <button
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* VIEW 1: LIVE IN-BROWSER CAMERA FEED */}
          {viewMode === "camera" ? (
            <div className="space-y-4 animate-in zoom-in-95 duration-200">
              <div className="relative rounded-3xl overflow-hidden bg-black aspect-4/3 shadow-2xl flex items-center justify-center border border-slate-800">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {isStartingCamera && (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                    <span className="text-xs font-semibold">Opening live camera...</span>
                  </div>
                )}

                {/* Top overlay badges & controls */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                  <div className="bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold border border-white/10 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span>Live Camera</span>
                  </div>

                  <div className="flex items-center gap-2 pointer-events-auto">
                    <button
                      type="button"
                      onClick={() => {
                        stopCameraStream();
                        onClose();
                      }}
                      className="p-2.5 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white rounded-full border border-white/10 transition shadow-sm cursor-pointer"
                      title="Close Camera"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Viewfinder Target Grid */}
                <div className="absolute inset-8 border border-white/20 rounded-2xl pointer-events-none flex items-center justify-center">
                  <div className="w-10 h-10 border-2 border-amber-400/60 rounded-full" />
                </div>

                {/* Shutter Button */}
                <div className="absolute bottom-4 inset-x-0 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={handleCaptureFrame}
                    disabled={isStartingCamera}
                    className="w-16 h-16 rounded-full bg-white border-4 border-amber-500 shadow-2xl flex items-center justify-center text-amber-700 hover:scale-105 active:scale-95 transition cursor-pointer disabled:opacity-50 group"
                    title="Capture Photo"
                  >
                    <div className="w-11 h-11 rounded-full bg-amber-600 group-hover:bg-amber-700 flex items-center justify-center text-white shadow-inner">
                      <Camera className="w-6 h-6" />
                    </div>
                  </button>
                </div>
              </div>

              <p className="text-center text-xs text-slate-500">
                Position the wasted item in the frame and press the circular shutter button.
              </p>
            </div>
          ) : (
            /* VIEW 2: CAPTURE PREVIEW WITH RETAKE & CONFIRM */
            <div className="space-y-4 animate-in zoom-in-95 duration-200">
              <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex items-center justify-center min-h-[260px] max-h-[360px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl!}
                  alt="Captured wastage photo"
                  className="w-full h-full object-contain max-h-[360px]"
                />
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold border border-white/10 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  Captured Photo
                </div>
                {previewMeta && (
                  <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-xs font-mono border border-white/10">
                    {(previewMeta.sizeBytes / 1024).toFixed(0)} KB • {previewMeta.width}×{previewMeta.height}
                  </div>
                )}
              </div>

              {/* Action Buttons: Retake and Confirm */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleRetake}
                  disabled={isProcessing}
                  className="flex items-center justify-center gap-2 px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl text-xs sm:text-sm transition shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retake Photo
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPhoto}
                  disabled={isProcessing}
                  className="flex items-center justify-center gap-2 px-4 py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl text-xs sm:text-sm transition shadow-lg shadow-amber-600/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Attach Photo (✓)
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <span className="text-xs text-slate-500">Live Camera Stream</span>
          <button
            type="button"
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default WastageCameraModal;
