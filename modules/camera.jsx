const { useState, useEffect, useRef, useCallback } = React;

/**
 * Camera - Composant caméra mobile complet
 * 
 * Props:
 *   - onCapture(file: File) : callback appelé avec le fichier capturé
 *   - mode: 'image' | 'video' | 'both' (défaut: 'image')
 *   - onClose() : callback pour fermer la caméra
 *   - facingMode: 'environment' | 'user' (défaut: 'environment')
 *   - compressImage: boolean (défaut: true)
 *   - imageQuality: number (défaut: 0.92)
 */
export function Camera({ onCapture, mode = 'image', onClose, facingMode: initialFacing = 'environment', compressImage = true, imageQuality = 0.92 }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  const [facingMode, setFacingMode] = useState(initialFacing);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [flash, setFlash] = useState(false);
  const [preview, setPreview] = useState(null); // { type: 'image'|'video', url, file }
  const [error, setError] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);

  const supportsVideo = mode === 'video' || mode === 'both';
  const supportsImage = mode === 'image' || mode === 'both';
  const [captureMode, setCaptureMode] = useState(supportsImage ? 'image' : 'video');

  // Générer le nom du fichier
  const generateFileName = (type, ext) => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const prefix = type === 'video' ? 'VID' : 'IMG';
    return `${prefix}_${date}.${ext}`;
  };

  // Démarrer la caméra
  const startCamera = useCallback(async () => {
    setError(null);
    setCameraReady(false);

    // Arrêter le stream existant
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    try {
      // Vérifier si l'API est disponible
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('API caméra non disponible. Utilisez HTTPS ou localhost.');
      }

      const constraints = {
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: supportsVideo,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
          setCameraReady(true);
        } catch (playErr) {
          // Ignorer les erreurs de play() si l'élément a été retiré du DOM
          if (playErr.name !== 'AbortError') {
            console.warn('Erreur play():', playErr);
          }
          // Réessayer après un court délai
          setTimeout(() => {
            if (videoRef.current && streamRef.current) {
              videoRef.current.play().then(() => {
                setCameraReady(true);
              }).catch(() => {});
            }
          }, 100);
        }
      }
    } catch (err) {
      console.error('Erreur caméra:', err);
      
      if (err.name === 'NotAllowedError') {
        setError('Accès à la caméra refusé. Vérifiez les permissions du navigateur.');
      } else if (err.name === 'NotFoundError') {
        setError('Aucune caméra détectée sur cet appareil.');
      } else if (err.name === 'NotReadableError') {
        setError('Caméra déjà utilisée par une autre application.');
      } else if (err.name === 'OverconstrainedError') {
        setError('Résolution demandée non supportée par la caméra.');
      } else if (err.message && err.message.includes('HTTPS')) {
        setError(' Accès caméra nécessite HTTPS. Utilisez localhost ou un serveur HTTPS.');
      } else {
        setError(`Erreur: ${err.message || 'Impossible d\'accéder à la caméra.'}`);
      }
    }
  }, [facingMode, supportsVideo]);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }

      if (videoRef.current) {
        try {
          videoRef.current.pause();
          videoRef.current.srcObject = null;
        } catch {}
      }
    };
  }, [startCamera]);

  useEffect(() => {
    if (preview !== null) return;

    if (streamRef.current && videoRef.current) {
      try {
        videoRef.current.srcObject = streamRef.current;
        const p = videoRef.current.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
        setCameraReady(true);
      } catch {}
    } else if (!streamRef.current) {
      startCamera();
    }
  }, [preview, startCamera]);

  // Timer enregistrement vidéo
  useEffect(() => {
    let interval;
    if (recording) {
      interval = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [recording]);

  // Formater le temps
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Capturer une photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    // Miroir si caméra frontale
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);

    // Flash visuel
    setFlash(true);
    setTimeout(() => setFlash(false), 150);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const fileName = generateFileName('image', 'jpg');
      const file = new File([blob], fileName, { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      setPreview({ type: 'image', url, file });
    }, 'image/jpeg', compressImage ? imageQuality : 1.0);
  };

  // Démarrer l'enregistrement vidéo
  const startRecording = () => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4';

    try {
      const recorder = new MediaRecorder(streamRef.current, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const ext = mimeType.includes('webm') ? 'webm' : 'mp4';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const fileName = generateFileName('video', ext);
        const file = new File([blob], fileName, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setPreview({ type: 'video', url, file });
      };

      recorder.start(100);
      setRecording(true);
    } catch (err) {
      setError('Impossible de démarrer l\'enregistrement.');
    }
  };

  // Arrêter l'enregistrement vidéo
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  // Basculer caméra avant/arrière
  const toggleCamera = () => {
    setFacingMode(f => f === 'environment' ? 'user' : 'environment');
  };

  // Confirmer la capture
  const confirmCapture = () => {
    if (preview?.file && onCapture) {
      onCapture(preview.file);
    }
    if (preview?.url) {
      URL.revokeObjectURL(preview.url);
    }
    setPreview(null);
  };

  // Reprendre (annuler la preview)
  const retake = () => {
    if (preview?.url) {
      URL.revokeObjectURL(preview.url);
    }
    setPreview(null);
  };

  // Fermer
  const handleClose = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      } catch {}
    }

    if (preview?.url) {
      URL.revokeObjectURL(preview.url);
    }
    if (onClose) onClose();
  };

  // Bouton de capture principal
  const handleMainButton = () => {
    if (captureMode === 'image') {
      capturePhoto();
    } else {
      if (recording) {
        stopRecording();
      } else {
        startRecording();
      }
    }
  };

  // Écran d'erreur
  if (error) {
    return (
      <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-6">
        <svg className="h-16 w-16 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <p className="text-white text-center mb-6">{error}</p>
        <button
          type="button"
          onClick={handleClose}
          className="px-6 py-3 rounded-lg bg-white/20 text-white font-medium"
        >
          Fermer
        </button>
      </div>
    );
  }

  // Écran de preview
  if (preview) {
    return (
      <div className="fixed inset-0 z-[200] bg-black flex flex-col">
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          {preview.type === 'image' ? (
            <img src={preview.url} alt="Preview" className="max-w-full max-h-full object-contain" />
          ) : (
            <video src={preview.url} controls autoPlay className="max-w-full max-h-full object-contain" />
          )}
        </div>

        <div className="p-6 flex items-center justify-center gap-8">
          <button
            type="button"
            onClick={retake}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <span className="text-white text-xs">Reprendre</span>
          </button>

          <button
            type="button"
            onClick={confirmCapture}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-white text-xs">Utiliser</span>
          </button>
        </div>
      </div>
    );
  }

  // Écran caméra
  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      {/* Flash overlay */}
      {flash && <div className="absolute inset-0 z-10 bg-white pointer-events-none" />}

      {/* Video feed */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
        />

        {/* Loading overlay */}
        {!cameraReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
          </div>
        )}

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20">
          <button
            type="button"
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
          >
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {recording && (
            <div className="flex items-center gap-2 bg-red-600/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-white text-sm font-medium">{formatTime(recordingTime)}</span>
            </div>
          )}

          <button
            type="button"
            onClick={toggleCamera}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
          >
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="bg-black p-6">
        {/* Mode switcher */}
        {mode === 'both' && !recording && (
          <div className="flex items-center justify-center gap-6 mb-4">
            <button
              type="button"
              onClick={() => setCaptureMode('image')}
              className={`text-sm font-medium transition-colors ${captureMode === 'image' ? 'text-white' : 'text-white/50'}`}
            >
              Photo
            </button>
            <button
              type="button"
              onClick={() => setCaptureMode('video')}
              className={`text-sm font-medium transition-colors ${captureMode === 'video' ? 'text-white' : 'text-white/50'}`}
            >
              Vidéo
            </button>
          </div>
        )}

        {/* Capture button */}
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={handleMainButton}
            disabled={!cameraReady}
            className="relative disabled:opacity-50"
          >
            {captureMode === 'image' ? (
              // Bouton photo: cercle blanc
              <div className="w-[72px] h-[72px] rounded-full border-4 border-white p-1">
                <div className="w-full h-full rounded-full bg-white active:bg-white/80 transition-colors" />
              </div>
            ) : recording ? (
              // Bouton stop: carré rouge dans cercle
              <div className="w-[72px] h-[72px] rounded-full border-4 border-red-500 flex items-center justify-center">
                <div className="w-7 h-7 rounded-md bg-red-500" />
              </div>
            ) : (
              // Bouton record: cercle rouge
              <div className="w-[72px] h-[72px] rounded-full border-4 border-white p-1">
                <div className="w-full h-full rounded-full bg-red-500 active:bg-red-600 transition-colors" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

export default Camera;
