"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera,
  X,
  Check,
  RotateCcw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { compressChecklistImage } from "@/lib/utils/image-compression";

export interface WastageCameraModalProps {
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Safely stop and release camera hardware
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
          track.enabled = false;
        } catch (e) {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch (e) {}
      videoRef.current.srcObject = null;
    }
    setIsStartingCamera(false);
  }, []);

  // Start Camera with back/environment camera (reusing stream if active to prevent permission re-prompts)
  const startCamera = useCallback(async () => {
    setError(null);
    setViewMode("camera");

    // 1. If we ALREADY have a live, active stream, simply re-attach and play without asking browser for permission again!
    if (
      streamRef.current &&
      streamRef.current.getVideoTracks().some((t) => t.readyState === "live" && t.enabled)
    ) {
      if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }
      setIsStartingCamera(false);
      return;
    }

    setIsStartingCamera(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsStartingCamera(false);
      setError("Live camera stream is not supported in this browser. Please use 'Open Phone Camera' below.");
      return;
    }

    let stream: MediaStream | null = null;

    // Safe, orientation-agnostic constraint (works in portrait on all mobile phones without OverconstrainedError)
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
        },
        audio: false,
      });
    } catch (e) {
      console.warn("Back camera facingMode failed, attempting standard video constraint:", e);
    }

    // Fallback to basic generic video constraint
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
            ? "Camera permission was denied. You can allow camera in browser settings or use 'Open Phone Camera' below."
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
  }, []);

  // Lock body scrolling when modal is active, ALWAYS unlock on unmount
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

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

  // Handle native phone camera file input
  const handleNativeCameraFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (videoRef.current) {
        try {
          videoRef.current.pause();
        } catch (e) {}
      }
      setError(null);
      setIsProcessing(false);
      const compressed = await compressChecklistImage(file, 1600, 1600, 0.8);
      setPreviewBlob(compressed.blob);
      setPreviewUrl(compressed.previewUrl);
      setPreviewMeta({
        width: compressed.width,
        height: compressed.height,
        sizeBytes: compressed.blob.size,
      });
      setViewMode("preview");
    } catch (err: any) {
      console.error("Native photo processing error:", err);
      setError("Failed to process photo from device camera");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

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

      // Pause video playback without killing stream tracks.
      // Keeping tracks active prevents browser permission re-prompts on retake!
      try {
        video.pause();
      } catch (e) {}

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

  // Retake photo: reopen live camera without asking browser permission again
  const handleRetake = () => {
    setPreviewBlob(null);
    setPreviewUrl(null);
    setPreviewMeta(null);
    setError(null);
    setViewMode("camera");

    // Reuse existing live stream if available
    if (
      streamRef.current &&
      streamRef.current.getVideoTracks().some((t) => t.readyState === "live" && t.enabled)
    ) {
      if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }
    } else {
      startCamera();
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-950 text-white w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-xl sm:rounded-3xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 border-b border-white/10 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider truncate">
                Photo Proof (Optional)
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white truncate max-w-[200px] sm:max-w-sm">
                {itemName}
              </h3>
            </div>
          </div>
          <button
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            title="Close Camera"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* VIEW 1: LIVE IN-BROWSER CAMERA FEED (ZERO SCROLL ON MOBILE) */}
        {viewMode === "camera" ? (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
            {/* Viewfinder Frame: touch-none & overflow-hidden prevents touch dragging */}
            <div className="flex-1 relative w-full overflow-hidden bg-black flex items-center justify-center touch-none select-none">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover pointer-events-none"
              />

              {isStartingCamera && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white gap-2 pointer-events-none z-10">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                  <span className="text-xs font-semibold">Opening live camera...</span>
                </div>
              )}

              {/* Viewfinder Target Reticle */}
              <div className="absolute inset-6 sm:inset-12 border border-white/20 rounded-2xl pointer-events-none flex items-center justify-center">
                <div className="w-12 h-12 border-2 border-amber-400/70 rounded-full" />
              </div>

              {/* Top live badge */}
              <div className="absolute top-3 left-3 pointer-events-none">
                <div className="bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold border border-white/10 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>Live Camera</span>
                </div>
              </div>

              {error && (
                <div className="absolute bottom-4 inset-x-4 p-3 bg-red-950/90 border border-red-500/50 rounded-2xl text-red-200 text-xs flex items-center gap-2 z-20">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Pinned Bottom Control Bar: Shutter + Native Fallback */}
            <div className="shrink-0 z-10 w-full bg-slate-950/95 sm:bg-slate-900/90 border-t border-white/10 px-5 sm:px-6 py-3.5 pb-[max(1rem,env(safe-area-inset-bottom))] flex items-center justify-between gap-4">
              <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-2xl cursor-pointer transition active:scale-95 border border-white/10 shrink-0">
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Open Phone Camera</span>
                <span className="sm:hidden">Native</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleNativeCameraFile}
                />
              </label>

              {/* Shutter Button */}
              <button
                type="button"
                onClick={handleCaptureFrame}
                disabled={isStartingCamera}
                className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center bg-white/20 active:scale-95 transition shadow-2xl hover:scale-105 cursor-pointer disabled:opacity-50"
                title="Capture Photo"
              >
                <div className="w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-600 flex items-center justify-center text-white shadow-inner">
                  <Camera className="w-6 h-6" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopCameraStream();
                  onClose();
                }}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-2xl transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* VIEW 2: CAPTURE PREVIEW WITH RETAKE & CONFIRM (ZERO SCROLL) */
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
            <div className="flex-1 relative w-full overflow-hidden bg-black flex items-center justify-center p-2 sm:p-4 touch-none select-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl!}
                alt="Captured wastage photo"
                className="w-full h-full object-contain rounded-2xl max-h-[75vh]"
              />
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold border border-white/10 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                Captured Photo Preview
              </div>
              {previewMeta && (
                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-xs font-mono border border-white/10">
                  {(previewMeta.sizeBytes / 1024).toFixed(0)} KB • {previewMeta.width}×{previewMeta.height}
                </div>
              )}
            </div>

            {/* Action Buttons: Retake and Confirm */}
            <div className="shrink-0 z-10 w-full bg-slate-950/95 sm:bg-slate-900/90 border-t border-white/10 px-4 sm:px-6 py-3.5 pb-[max(1rem,env(safe-area-inset-bottom))] grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleRetake}
                disabled={isProcessing}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white/15 hover:bg-white/25 text-white font-bold rounded-2xl text-xs sm:text-sm transition shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Retake Photo
              </button>
              <button
                type="button"
                onClick={handleConfirmPhoto}
                disabled={isProcessing}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl text-xs sm:text-sm transition shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
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
    </div>
  );
}

export default WastageCameraModal;
