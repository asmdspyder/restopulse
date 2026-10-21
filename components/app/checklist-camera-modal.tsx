"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera,
  X,
  Check,
  RotateCcw,
  Trash2,
  Loader2,
  Clock,
  User,
  ZoomIn,
  AlertCircle,
  Plus,
} from "lucide-react";
import { compressChecklistImage } from "@/lib/utils/image-compression";

export interface ChecklistItemImage {
  id: string;
  slot: number;
  storageKey: string;
  url: string;
  uploadedAt: string;
  uploadedBy?: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
}

interface ChecklistCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyRecordId: string;
  itemKey: string;
  itemLabel: string;
  sectionTitle?: string;
  itemId?: string;
  sectionId?: string;
  initialImages?: ChecklistItemImage[];
  onImagesUpdated: (newImages: ChecklistItemImage[]) => void;
  readOnly?: boolean;
}

export function ChecklistCameraModal({
  isOpen,
  onClose,
  dailyRecordId,
  itemKey,
  itemLabel,
  sectionTitle = "Checklist",
  itemId,
  sectionId,
  initialImages = [],
  onImagesUpdated,
  readOnly = false,
}: ChecklistCameraModalProps) {
  const [images, setImages] = useState<ChecklistItemImage[]>(initialImages);
  const [capturingSlot, setCapturingSlot] = useState<number>(1);

  // View state machine: "camera" | "preview" | "gallery"
  const [viewMode, setViewMode] = useState<"camera" | "preview" | "gallery">(() =>
    initialImages.length === 0 ? "camera" : "gallery"
  );

  // Live Camera Stream State (Always Back/Environment Camera)
  const [isStartingCamera, setIsStartingCamera] = useState(false);

  // Preview & Upload State
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMeta, setPreviewMeta] = useState<{ width: number; height: number; sizeBytes: number } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingSlot, setIsDeletingSlot] = useState<number | null>(null);
  const [viewingImage, setViewingImage] = useState<ChecklistItemImage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef(images);

  useEffect(() => {
    setImages(initialImages);
    imagesRef.current = initialImages;
  }, [initialImages]);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  // Clean up and release camera stream
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

  // Start Camera Stream with back/environment camera (reusing stream if active to prevent permission re-prompts)
  const startCamera = useCallback(
    async (slotNumber?: number) => {
      setError(null);

      // Determine target slot
      const currentImages = imagesRef.current;
      if (slotNumber) {
        setCapturingSlot(slotNumber);
      } else {
        const usedSlots = new Set(currentImages.map((img) => img.slot));
        let freeSlot = 1;
        for (let s = 1; s <= 5; s++) {
          if (!usedSlots.has(s)) {
            freeSlot = s;
            break;
          }
        }
        setCapturingSlot(freeSlot);
      }

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
              : err.message || "Failed to access live device camera"
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
    },
    []
  );

  // Lock body scrolling when modal is active, ALWAYS unlock on unmount
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  // Initial camera start on mount if in camera mode
  useEffect(() => {
    if (isOpen && !readOnly && viewMode === "camera") {
      startCamera();
    }
    return () => {
      stopCameraStream();
    };
  }, [isOpen, readOnly, viewMode, startCamera, stopCameraStream]);

  // Native phone camera handler
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
      setIsUploading(false);
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

  // 1. Instant Camera Shutter Capture
  const handleCaptureFrame = async () => {
    if (!videoRef.current) {
      setError("Camera video feed not ready");
      return;
    }

    try {
      const video = videoRef.current;
      const width = video.videoWidth || video.clientWidth || 1280;
      const height = video.videoHeight || video.clientHeight || 720;

      if (width === 0 || height === 0) {
        setError("Camera video feed has not loaded yet. Please wait a second and try again.");
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not initialize canvas 2d context");

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, width, height);

      // Pause video playback instead of killing stream tracks.
      // Keeping tracks active prevents browser permission re-prompts on retake or next slot!
      try {
        video.pause();
      } catch (e) {}

      // Convert canvas to Data URL for instant, zero-lag preview!
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      setPreviewUrl(dataUrl);
      setViewMode("preview");

      // Asynchronously compress into high-quality WebP blob for uploading
      canvas.toBlob(async (rawBlob) => {
        if (!rawBlob) {
          setError("Failed to generate photo snapshot");
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
          console.warn("Compression error, using raw capture:", compErr);
          setPreviewBlob(rawBlob);
          setPreviewMeta({
            width,
            height,
            sizeBytes: rawBlob.size,
          });
        }
      }, "image/jpeg", 0.92);
    } catch (err: any) {
      console.error("Snapshot error:", err);
      setError(err.message || "Failed to capture photo from camera");
    }
  };

  // 2. Retake Photo -> Re-open Live Camera WITHOUT requesting browser permission again
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
      startCamera(capturingSlot);
    }
  };

  // 3. Confirm & Save to Cloudflare R2
  const handleConfirmUpload = async () => {
    let blobToUpload = previewBlob;

    // Fallback: If canvas.toBlob hasn't finished yet, convert previewUrl (Data URL) to Blob
    if (!blobToUpload && previewUrl && previewUrl.startsWith("data:")) {
      try {
        const fetchRes = await fetch(previewUrl);
        blobToUpload = await fetchRes.blob();
      } catch (e) {
        console.error("DataURL to blob error:", e);
      }
    }

    if (!blobToUpload || capturingSlot === null) {
      setError("Photo data is not ready yet. Please wait a moment or retake.");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", blobToUpload, `capture_${capturingSlot}.webp`);
      formData.append("itemKey", itemKey);
      if (itemId) formData.append("itemId", itemId);
      if (sectionId) formData.append("sectionId", sectionId);
      formData.append("slot", String(capturingSlot));
      formData.append("itemLabel", itemLabel);
      formData.append("sectionTitle", sectionTitle);
      if (previewMeta) {
        formData.append("width", String(previewMeta.width));
        formData.append("height", String(previewMeta.height));
      }

      const res = await fetch(`/api/checklists/daily/${dailyRecordId}/images`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save photo. Please try again.");
      }

      setImages(data.allImages || []);
      onImagesUpdated(data.allImages || []);

      // Switch to gallery view after successful capture & upload
      setPreviewUrl(null);
      setPreviewBlob(null);
      setPreviewMeta(null);
      setViewMode("gallery");

      // Pause live video while viewing gallery so it doesn't run in background
      if (videoRef.current) {
        try {
          videoRef.current.pause();
        } catch (e) {}
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to save photo to Cloudflare R2");
    } finally {
      setIsUploading(false);
    }
  };

  // 4. Delete Image from Slot
  const handleDeleteImage = async (img: ChecklistItemImage) => {
    if (readOnly) return;
    if (!confirm(`Are you sure you want to delete Photo ${img.slot}?`)) return;

    try {
      setIsDeletingSlot(img.slot);
      setError(null);

      const res = await fetch(`/api/checklists/daily/${dailyRecordId}/images`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemKey,
          slot: img.slot,
          storageKey: img.storageKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete photo");
      }

      setImages(data.allImages || []);
      onImagesUpdated(data.allImages || []);
      if (viewingImage?.slot === img.slot) {
        setViewingImage(null);
      }
    } catch (err: any) {
      console.error("Delete error:", err);
      setError(err.message || "Failed to delete photo");
    } finally {
      setIsDeletingSlot(null);
    }
  };

  const formatUploadTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-2xl sm:rounded-3xl overflow-hidden flex flex-col shadow-2xl transition-colors ${
          viewMode === "camera" || viewMode === "preview"
            ? "bg-slate-950 text-white"
            : "bg-white text-slate-900 border border-slate-200"
        }`}
      >
        {/* Header */}
        {viewMode === "camera" || viewMode === "preview" ? (
          <div className="px-4 sm:px-6 py-3 border-b border-white/10 flex items-center justify-between bg-slate-900/90 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Camera className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider truncate">
                  {sectionTitle} • Slot #{capturingSlot}
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-white truncate max-w-[200px] sm:max-w-sm">
                  {itemLabel}
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {images.length > 0 && viewMode === "camera" && (
                <button
                  type="button"
                  onClick={() => {
                    if (videoRef.current) {
                      try {
                        videoRef.current.pause();
                      } catch (e) {}
                    }
                    setViewMode("gallery");
                  }}
                  className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition"
                >
                  Gallery ({images.length})
                </button>
              )}
              <button
                onClick={() => {
                  stopCameraStream();
                  onClose();
                }}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs shrink-0">
                <Camera className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider truncate">
                  {sectionTitle}
                </div>
                <h3 className="text-base font-extrabold text-slate-900 truncate">
                  {itemLabel}
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
        )}

        {/* VIEW 1: LIVE IN-BROWSER CAMERA STREAM & VIEWFINDER (NO VERTICAL SCROLLING ON MOBILE) */}
        {viewMode === "camera" ? (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
            {/* Viewfinder Frame: touch-none & overflow-hidden prevents all touch dragging */}
            <div className="flex-1 relative w-full overflow-hidden bg-black flex items-center justify-center touch-none select-none">
              {/* Live Video Feed */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover pointer-events-none"
              />

              {isStartingCamera && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white gap-2 pointer-events-none z-10">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                  <span className="text-xs font-semibold">Opening device camera...</span>
                </div>
              )}

              {/* Viewfinder Target Reticle */}
              <div className="absolute inset-6 sm:inset-12 border border-white/20 rounded-2xl pointer-events-none flex items-center justify-center">
                <div className="w-12 h-12 border-2 border-emerald-400/70 rounded-full" />
              </div>

              {/* Top overlay badge */}
              <div className="absolute top-3 left-3 pointer-events-none">
                <div className="bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold border border-white/10 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Live • Slot #{capturingSlot} of 5</span>
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
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
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

              {/* Shutter Capture Button */}
              <button
                type="button"
                onClick={handleCaptureFrame}
                disabled={isStartingCamera}
                className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center bg-white/20 active:scale-95 transition shadow-2xl hover:scale-105 cursor-pointer disabled:opacity-50"
                title="Capture Photo"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center text-white shadow-inner">
                  <Camera className="w-6 h-6" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (images.length > 0) {
                    if (videoRef.current) {
                      try {
                        videoRef.current.pause();
                      } catch (e) {}
                    }
                    setViewMode("gallery");
                  } else {
                    stopCameraStream();
                    onClose();
                  }
                }}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-2xl transition cursor-pointer"
              >
                {images.length > 0 ? "Gallery" : "Cancel"}
              </button>
            </div>
          </div>
        ) : viewMode === "preview" && previewUrl ? (
          /* VIEW 2: CAPTURED PHOTO PREVIEW WITH RETAKE & CONFIRM (ZERO SCROLL) */
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
            <div className="flex-1 relative w-full overflow-hidden bg-black flex items-center justify-center p-2 sm:p-4 touch-none select-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Captured photo preview"
                className="w-full h-full object-contain rounded-2xl max-h-[75vh]"
              />
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold border border-white/10 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                Photo Slot #{capturingSlot} Preview
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
                disabled={isUploading}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white/15 hover:bg-white/25 text-white font-bold rounded-2xl text-xs sm:text-sm transition shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Retake Photo
              </button>
              <button
                type="button"
                onClick={handleConfirmUpload}
                disabled={isUploading}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs sm:text-sm transition shadow-lg shadow-emerald-700/20 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving Photo...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Confirm & Save (✓)
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* VIEW 3: PHOTO GALLERY & SLOT MANAGEMENT */
          <>
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {error && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-extrabold text-slate-900">
                    Captured Photos ({images.length}/5)
                  </span>
                  {!readOnly && images.length < 5 && (
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer border border-slate-200 shadow-2xs">
                        <Camera className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="hidden sm:inline">Phone Camera</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => {
                            const usedSlots = new Set(imagesRef.current.map((img) => img.slot));
                            let freeSlot = 1;
                            for (let s = 1; s <= 5; s++) {
                              if (!usedSlots.has(s)) {
                                freeSlot = s;
                                break;
                              }
                            }
                            setCapturingSlot(freeSlot);
                            handleNativeCameraFile(e);
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => startCamera()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-700/20 active:scale-95 cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Live Camera</span>
                      </button>
                    </div>
                  )}
                </div>

                {images.length === 0 ? (
                  <div className="text-center py-10 px-4 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 shadow-xs">
                      <Camera className="w-8 h-8" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">
                      No photos captured yet
                    </h4>
                    <p className="text-xs text-slate-500 max-w-xs mb-5">
                      Open device camera directly to snap high-resolution proof for this checklist task.
                    </p>
                    {!readOnly && (
                      <div className="flex flex-wrap items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => startCamera(1)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-2xl shadow-md shadow-emerald-700/20 active:scale-95 transition cursor-pointer"
                        >
                          <Camera className="w-4 h-4" />
                          Open Live Camera
                        </button>
                        <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 active:scale-95 transition cursor-pointer shadow-2xs">
                          <Camera className="w-4 h-4 text-emerald-600" />
                          Open Phone Camera
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => {
                              setCapturingSlot(1);
                              handleNativeCameraFile(e);
                            }}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5].map((slotNumber) => {
                      const img = images.find((i) => i.slot === slotNumber);

                      if (img) {
                        return (
                          <div
                            key={slotNumber}
                            className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 aspect-video shadow-xs transition hover:shadow-md"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={img.url}
                              alt={`Photo ${img.slot}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                              onClick={() => setViewingImage(img)}
                            />

                            {/* Slot Badge */}
                            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[11px] font-extrabold px-2 py-0.5 rounded-lg border border-white/10">
                              #{img.slot}
                            </div>

                            {/* Overlay info & actions */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 pointer-events-none">
                              <div className="flex justify-end pointer-events-auto">
                                <button
                                  type="button"
                                  onClick={() => setViewingImage(img)}
                                  className="p-1.5 bg-black/50 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm transition-colors cursor-pointer"
                                  title="View Full Size"
                                >
                                  <ZoomIn className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="flex items-center justify-between pointer-events-auto">
                                <div className="text-[10px] text-slate-200 font-medium leading-tight">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5 text-emerald-400" />
                                    {formatUploadTime(img.uploadedAt)}
                                  </div>
                                  {img.uploadedBy && (
                                    <div className="flex items-center gap-1 text-slate-300 truncate max-w-[85px]">
                                      <User className="w-2.5 h-2.5" />
                                      {img.uploadedBy}
                                    </div>
                                  )}
                                </div>

                                {!readOnly && (
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => startCamera(img.slot)}
                                      className="p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg backdrop-blur-sm transition-colors text-[10px] font-bold cursor-pointer"
                                      title="Retake photo for this slot"
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteImage(img)}
                                      disabled={isDeletingSlot === img.slot}
                                      className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg backdrop-blur-sm transition-colors cursor-pointer"
                                      title="Delete photo"
                                    >
                                      {isDeletingSlot === img.slot ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <Trash2 className="w-3 h-3" />
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // Empty Slot Card
                      if (!readOnly) {
                        return (
                          <div
                            key={slotNumber}
                            className="rounded-2xl border-2 border-dashed border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 aspect-video flex flex-col items-center justify-between p-2.5 text-slate-400 hover:text-emerald-800 transition group relative"
                          >
                            <button
                              type="button"
                              onClick={() => startCamera(slotNumber)}
                              className="w-full flex-1 flex flex-col items-center justify-center cursor-pointer"
                              title={`Take photo for Slot ${slotNumber} using live camera`}
                            >
                              <div className="w-7 h-7 rounded-xl bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center mb-1 text-slate-500 group-hover:text-emerald-700 transition-colors">
                                <Plus className="w-4 h-4" />
                              </div>
                              <span className="text-[11px] font-bold">Slot {slotNumber}</span>
                            </button>
                            <label
                              className="text-[10px] text-slate-400 hover:text-emerald-700 font-semibold underline cursor-pointer mt-0.5"
                              onClick={() => setCapturingSlot(slotNumber)}
                            >
                              Phone App
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={(e) => {
                                  setCapturingSlot(slotNumber);
                                  handleNativeCameraFile(e);
                                }}
                              />
                            </label>
                          </div>
                        );
                      }

                      return null;
                    })}
                  </div>
                )}
              </div>

              {/* Retention notice footer */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-500 leading-relaxed">
                  <strong className="text-slate-700">30-Day Retention:</strong> Photos captured here are securely saved and accessible for 30 days for operational audit compliance.
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between shrink-0">
              <div className="text-xs text-slate-500 font-medium">
                {images.length > 0 ? `${images.length} of 5 photos saved` : "Camera ready"}
              </div>
              <button
                type="button"
                onClick={() => {
                  stopCameraStream();
                  onClose();
                }}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-xs transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>

      {/* Full Image Preview Lightbox Modal */}
      {viewingImage && (
        <div
          className="fixed inset-0 z-60 bg-black/95 backdrop-blur-md flex flex-col animate-in fade-in duration-200"
          onClick={() => setViewingImage(null)}
        >
          <div className="p-4 flex items-center justify-between text-white border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-extrabold border border-emerald-500/30">
                Photo #{viewingImage.slot}
              </span>
              <span className="text-sm font-semibold text-slate-200 truncate max-w-sm">
                {itemLabel}
              </span>
            </div>
            <button
              onClick={() => setViewingImage(null)}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div
            className="flex-1 flex items-center justify-center p-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={viewingImage.url}
              alt="Full size photo"
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            />
          </div>

          <div className="p-4 bg-black/60 border-t border-white/10 text-center text-xs text-slate-400 flex items-center justify-center gap-4">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Captured: {new Date(viewingImage.uploadedAt).toLocaleString()}</span>
            </div>
            {viewingImage.uploadedBy && (
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span>By: {viewingImage.uploadedBy}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
