const { useState, useRef , useEffect  , useCallback} = React ;

const StatusBanner = ({ status }) => {
  return (
    <div className={`px-4 py-2 text-sm font-medium ${
      status === 'connected' 
        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
    }`}>
      <div className="flex items-center justify-center">
        <div className={`w-2 h-2 rounded-full mr-2 ${
          status === 'connected' ? 'bg-green-500' : 'bg-yellow-500'
        }`}></div>
        {status === 'connected' ? 'Connecté au réseau' : 'En attente de connexion...'}
      </div>
    </div>
  );
};

const SelectFilesStep = ({ onFileSelect , onSelectEnd }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);
  
  // Gestion du glisser-déposer
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      const updatedFiles = [...selectedFiles, ...newFiles];
      setSelectedFiles(updatedFiles);
      onFileSelect(updatedFiles);
    }
  };
  
  // Gestion de la sélection de fichiers via le bouton
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const updatedFiles = [...selectedFiles, ...newFiles];
      setSelectedFiles(updatedFiles);
      onFileSelect(updatedFiles);
    }
  };
  
  return (
    <>
      {/* Zone de glisser-déposer */}
      <div 
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 mb-4 transition-all ${
          isDragging 
            ? 'border-[#34B7F1] bg-[#34B7F1]/5 dark:bg-[#34B7F1]/10' 
            : 'border-gray-300 dark:border-gray-700 hover:border-[#34B7F1] dark:hover:border-[#34B7F1]/70'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#34B7F1] to-[#25D366] p-1 mb-6">
          <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
            <svg className="w-12 h-12 text-[#34B7F1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
          Glissez-déposez vos fichiers ici
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          ou cliquez pour sélectionner des fichiers
        </p>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          multiple
        />
      </div>
      
      {/* Liste des fichiers sélectionnés */}
      {selectedFiles.length > 0 && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden mb-4">
          <div className="bg-gray-50 dark:bg-gray-800 p-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-700 dark:text-gray-300">
              {selectedFiles.length} fichier(s) sélectionné(s) - {formatFileSize(getTotalSize(selectedFiles))}
            </h3>
          </div>
          <div className="max-h-60 overflow-y-auto p-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center p-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 mr-3">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-gray-800 dark:text-white">{file.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onSelectEnd}
        disabled={selectedFiles.length === 0}
        className={`w-full py-3 px-4 rounded-xl font-medium text-lg transition-all ${
          selectedFiles.length > 0
            ? 'bg-[#25D366] hover:bg-[#22c35e] active:bg-[#1eb455] text-white shadow-md'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
        }`}
      >
        Rechercher des appareils
      </button>
    </>
  );
};

const SelectDeviceStep = ({ 
  selectedFiles,
  onDeviceSelect,
  deviceName,
  onCancel,
}) => {
  const { id , subscribe , sendMessage} = useWebSocket();
  const [isScanning, setIsScanning] = useState(true);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const peers = useRef({});


  const onPeerResponse = useCallback((data) => {
      peers.current[data.sender] = {
        id: data.sender,
        name: data.name,
        sender: data.sender
      };
  }, [deviceName]);
  
  useEffect(() => {
    const unsubscribe = subscribe('peer-discovery-response',onPeerResponse);
    return unsubscribe;
  }, [subscribe, onPeerResponse]);
  
  useEffect(() => {
    if (isScanning) {
      const scanTimer = setTimeout(() => {
        setIsScanning(false);
      }, 2000);
      return () => clearTimeout(scanTimer);
    }
  }, [isScanning]);
  
  const handleDeviceSelect = (device) => {
    setSelectedDeviceId(device.id);
    onDeviceSelect(device);
  };
  
  const renderEmptyState = () => (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
      <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
        <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
        Aucun appareil trouvé
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
        Assurez-vous que les appareils sont connectés au même réseau WiFi et que l'application LocalLoop est ouverte.
      </p>
      <button 
        onClick={() => { 
          sendMessage({
            type: 'peer-discovery',
            name: deviceName,
          });
          setIsScanning(true);
        }}
        className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        Rechercher à nouveau
      </button>
    </div>
  );
  
  const renderDeviceList = () => (
    <div className="flex-1 flex flex-col">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
          Appareils disponibles
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Sélectionnez un appareil pour envoyer {selectedFiles.length} fichier(s) ({formatFileSize(getTotalSize(selectedFiles))})
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {Object.values(peers.current).map(device => (
          <DeviceItem 
            key={device.id}
            device={device}
            onSelect={handleDeviceSelect}
            selectedDeviceId={selectedDeviceId}
          />
        ))}
      </div>
    </div>
  );
  
  return (
    <div className="flex-1 flex flex-col">
      {isScanning ? (
        <ScanningStep />
      ) : (
        Object.keys(peers.current).length > 0 ? renderDeviceList() : renderEmptyState()
      )}
      <button
        onClick={onCancel}
        className="mt-6 px-4 py-2 border-2 border-blue-500 text-blue-500 rounded-lg hover:border-blue-600 hover:text-blue-600 transition-colors"
      >
        Annuler
      </button>
    </div>
  );
};

const DeviceItem = ({ device, onSelect, selectedDeviceId }) => {
  const isSelected = device.id === selectedDeviceId;
  
  return (
    <div 
      className={`flex items-center p-4 border rounded-xl mb-3 cursor-pointer transition-all ${
        isSelected 
          ? 'border-[#25D366] bg-[#25D366]/5 dark:bg-[#25D366]/10' 
          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
      }`}
      onClick={() => onSelect(device)}
    >
      <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-800 mr-4">
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-gray-900 dark:text-white">{device.name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Disponible</p>
      </div>
      <div className="flex items-center">
        <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
        <span className="text-sm text-gray-600 dark:text-gray-300">En ligne</span>
      </div>
    </div>
  );
};

const ScanningStep = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="w-32 h-32 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center relative mb-6">
        <div className="absolute w-full h-full rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
        <svg className="w-16 h-16 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
        Recherche d'appareils à proximité...
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md text-center">
        Assurez-vous que les appareils sont connectés au même réseau WiFi et que l'application LocalLoop est ouverte.
      </p>
    </div>
  );
};

const TransferItem = ({ item, onRetry, onCancel, progress }) => {
  const getStatusBadge = () => {
    let bgColor, textColor, label;
    switch (item.status) {
      case 'pending':
        bgColor = 'bg-yellow-100 dark:bg-yellow-900/30';
        textColor = 'text-yellow-800 dark:text-yellow-300';
        label = 'En attente';
        break;
      case 'sending':
      case 'receiving':
      case 'transferring':
        bgColor = 'bg-blue-100 dark:bg-blue-900/30';
        textColor = 'text-blue-800 dark:text-blue-300';
        label = item.status === 'sending' ? 'Envoi' : (item.status === 'receiving' ? 'Réception' : 'En cours');
        break;
      case 'assembling':
        bgColor = 'bg-purple-100 dark:bg-purple-900/30';
        textColor = 'text-purple-800 dark:text-purple-300';
        label = 'Assemblage';
        break;
      case 'completed':
        bgColor = 'bg-green-100 dark:bg-green-900/30';
        textColor = 'text-green-800 dark:text-green-300';
        label = 'Terminé';
        break;
      case 'error':
        bgColor = 'bg-red-100 dark:bg-red-900/30';
        textColor = 'text-red-800 dark:text-red-300';
        label = 'Erreur';
        break;
      case 'cancelled':
        bgColor = 'bg-gray-100 dark:bg-gray-800';
        textColor = 'text-gray-800 dark:text-gray-300';
        label = 'Annulé';
        break;
      default:
        bgColor = 'bg-gray-100 dark:bg-gray-800';
        textColor = 'text-gray-800 dark:text-gray-300';
        label = 'Inconnu';
    }
    return <span className={`text-xs px-2 py-1 rounded-full ${bgColor} ${textColor}`}>{label}</span>;
  };

  const isInProgress = ['pending', 'sending', 'receiving', 'transferring', 'assembling'].includes(item.status);

  return (
    <div className={`border ${item.status === 'error' ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'} rounded-lg overflow-hidden mb-3`}>
      <div className="p-3 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <div className={`p-2 rounded-md ${
              item.status === 'error'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300'
            } mr-3`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatFileSize(item.size)} • {item.recipient ? `Envoyé à ${item.recipient}` : ''}
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {item.status === 'error' && item.error && (
          <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded text-xs text-red-800 dark:text-red-300">
            <strong>Erreur:</strong> {item.error}
          </div>
        )}

        {isInProgress && (
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-2">
            <div
              className={`${item.status === 'assembling' ? 'bg-purple-600' : 'bg-blue-600'} h-1.5 rounded-full transition-all`}
              style={{ width: `${progress || 0}%` }}
            />
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {isInProgress && progress ? `${Math.round(progress)}%` : ''}
            {item.status === 'completed' && 'Transfert terminé'}
            {item.status === 'error' && 'Le transfert a échoué'}
            {item.status === 'cancelled' && 'Transfert annulé'}
          </div>

          <div className="flex space-x-2">
            {item.status === 'error' && onRetry && (
              <button
                onClick={() => onRetry(item.id)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Réessayer
              </button>
            )}

            {isInProgress && onCancel && (
              <button
                onClick={() => onCancel(item.id)}
                className="text-xs text-red-600 dark:text-red-400 hover:underline"
              >
                Annuler
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TransferringStep = ({
  selectedDevice,
  selectedFiles,
  onTransferComplete,
  offerSdp
}) => {
  const [activeTransfers, setActiveTransfers] = useState({});
  const [transferProgress, setTransferProgress] = useState({});
  const [dataChannelReady, setDataChannelReady] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting' | 'connected' | 'error'
  const [hasErrors, setHasErrors] = useState(false);
  
  const sentOnceRef = useRef(false); // évite le double envoi au passage "open"
  const { sendMessage, subscribe } = useWebSocket();
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
    ]
  };
  const peerRef = useRef(null);
  
  // Initialiser l'instance ManualRTC une seule fois
  useEffect(() => {
    // Fonction asynchrone pour initialiser le peer
    const initPeer = async () => {
      peerRef.current = new ManualRTC({
        rtcConfig,
        onState: (s) => {
          console.log('State:', s);
          // Mettre à jour l'état du canal de données
          if (s === 'connected') {
            setDataChannelReady(true);
            setConnectionStatus('connected');
          } else if (s === 'closed') {
            setDataChannelReady(false);
            setConnectionStatus('error');
          }
        },
        onMessage: (data) => {
          console.log('Message:', data);
          // Traiter les messages de progression et de fin de transfert
          if (data && data.type === 'file-progress') {
            const progress = data;
            setTransferProgress(prev => ({ ...prev, [progress.fileId]: progress.progress }));
            setActiveTransfers(prev => {
              if (prev[progress.fileId]) {
                return {
                  ...prev,
                  [progress.fileId]: { ...prev[progress.fileId], status: progress.status }
                };
              }
              return {
                ...prev,
                [progress.fileId]: {
                  fileId: progress.fileId,
                  fileName: progress.fileName,
                  fileSize: progress.fileSize,
                  fileType: progress.fileType,
                  status: progress.status,
                  recipient: selectedDevice?.current?.name || 'Appareil inconnu'
                }
              };
            });
          } else if (data && data.type === 'file-complete') {
            const file = data;
            setActiveTransfers(prev => ({
              ...prev,
              [file.fileId]: { ...(prev[file.fileId] || {}), status: 'completed' }
            }));
            
            // Si c'est un fichier reçu, télécharger le fichier
            if (file.fileBlob) {
              const url = URL.createObjectURL(file.fileBlob);
              const a = document.createElement('a');
              a.href = url;
              a.download = file.fileName;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }
          }
        },
        onError: (e) => {
          console.error('Error:', e);
          setConnectionStatus('error');
          setHasErrors(true);
        }
      });
    };
    
    initPeer();
    
    // Nettoyage lors du démontage du composant
    return () => {
      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }
    };
  }, [rtcConfig]);
  
  // Gestion de la signalisation
  useEffect(() => {
    if (!peerRef.current) return;
    
    // Gérer les réponses (answers) pour le mode envoi
    const unsubAnswer = subscribe('answer', async (msg) => {
      try {
        await peerRef.current.acceptAnswer(msg.data);
      } catch (e) {
        console.error('Erreur acceptAnswer:', e);
      }
    });
    
    // Gérer les candidats ICE
    const unsubIce = subscribe('ice-candidate', async (msg) => {
      try {
        // Ajouter le candidat ICE distant
        if (peerRef.current.addRemoteIceCandidate) {
          await peerRef.current.addRemoteIceCandidate(msg.data);
        }
      } catch (e) {
        console.error('Erreur lors de l\'ajout du candidat ICE:', e);
      }
    });
    
    // Si on est en mode réception (offerSdp présent)
    const handleOffer = async () => {
      if (offerSdp) {
        try {
          const answer = await peerRef.current.acceptOfferAndCreateAnswer(offerSdp.data);
          sendMessage({
            type: 'answer',
            data: answer,
            to: offerSdp.sender
          });
          setConnectionStatus('connecting');
        } catch (e) {
          console.error('Erreur lors de la création de la réponse:', e);
          setConnectionStatus('error');
        }
      }
    };
    
    handleOffer();
    
    // Si on est en mode envoi (selectedDevice et selectedFiles présents)
    const initiateConnection = async () => {
      console.log(offerSdp , selectedDevice?.current , selectedFiles?.current?.length)
      if (!offerSdp && selectedDevice?.current != undefined && selectedFiles?.current?.length != undefined) {
        try {
          const device = selectedDevice.current;
          const remoteId = device.sender;
          console.log("offer cration " , peerRef.current)
          // Créer l'offre et l'envoyer via WS

          const offer = await peerRef.current.createOffer();
          console.log("create offer : " , offer);
          if (offer) {
            sendMessage({
              type: 'offer',
              data: offer,
              origin: device.id,
              to: remoteId,
              sender: device.id
            });
            setConnectionStatus('connecting');
          }
          
          // Configurer le forwarding des candidats ICE
          if (peerRef.current.onLocalCandidate) {
            peerRef.current.onLocalCandidate((candidate) => {
              if (candidate) {
                sendMessage({
                  type: 'ice-candidate',
                  data: candidate,
                  to: remoteId
                });
              }
            });
          }
        } catch (e) {
          console.error('Erreur lors de l\'initiation de la connexion:', e);
          setConnectionStatus('error');
        }
      }
    };
    
    initiateConnection();
    
    return () => {
      unsubAnswer();
      unsubIce();
    };
  }, []);

  // Envoi des fichiers
  const handleSendFiles = async () => {
    if (!selectedFiles?.current?.length || !selectedDevice?.current) {
      console.error("Impossible d'envoyer les fichiers : appareil non connecté ou aucun fichier sélectionné");
      return;
    }

    const isReady = await waitForDataChannel();
    if (!isReady) {
      alert("Impossible d'établir une connexion stable. Veuillez réessayer.");
      onTransferComplete && onTransferComplete();
      return;
    }

    for (const file of selectedFiles.current) {
      try {
        const fileId = await peerRef.current.sendFile?.(file);
        // Initialiser l'entrée
        setActiveTransfers(prev => ({
          ...prev,
          [fileId || file.name]: {
            fileId: fileId || file.name,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            status: 'sending',
            recipient: selectedDevice.current.name || 'Appareil inconnu'
          }
        }));
      } catch (error) {
        console.error(`Erreur lors du transfert du fichier ${file.name}:`, error);
        setActiveTransfers(prev => ({
          ...prev,
          [`error-${Date.now()}`]: {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            status: 'error',
            error: error?.message || 'Échec du transfert'
          }
        }));
        setHasErrors(true);
      }
    }
  };

  // Annulation d'un transfert
  const onCancelTransfer = (fileId) => {
    setActiveTransfers(prev => ({
      ...prev,
      [fileId]: { ...(prev[fileId] || {}), status: 'cancelled' }
    }));
    
    // Annuler le transfert via le peer
    if (peerRef.current?.cancelFile) {
      peerRef.current.cancelFile(fileId);
    }
  };

  // Fin globale : quand tout est terminé
  useEffect(() => {
    const values = Object.values(activeTransfers);
    if (values.length === 0) return;

    const allDone = values.every(t => t.status === 'completed' || t.status === 'error' || t.status === 'cancelled');
    if (allDone && onTransferComplete) {
      const timer = setTimeout(() => onTransferComplete(), 2000);
      return () => clearTimeout(timer);
    }
  }, [activeTransfers, onTransferComplete]);

  const recipientName = selectedDevice?.current?.name || 'Appareil inconnu';

  const calculateOverallProgress = () => {
    const transfers = Object.values(activeTransfers);
    if (transfers.length === 0) return 0;
    const total = transfers.reduce((sum, t) => sum + (transferProgress[t.fileId] || 0), 0);
    return Math.floor(total / transfers.length);
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
          Transfert en cours
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {selectedDevice?.current && `Transfert vers ${selectedDevice.current.name}`} • {selectedFiles?.current?.length || 0} fichier(s) ({formatFileSize(getTotalSize(selectedFiles?.current || []))})
        </p>

        <div className={`mt-2 flex items-center ${dataChannelReady ? 'text-green-600' : 'text-amber-600'}`}>
          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${dataChannelReady ? 'bg-green-600' : 'bg-amber-600'}`} />
          <span className="text-xs font-medium">
            {dataChannelReady ? 'Canal WebRTC connecté' : 'Connexion WebRTC en cours...'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {Object.values(activeTransfers).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
              {dataChannelReady ? (
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-amber-600 dark:text-amber-400 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {dataChannelReady ? 'Préparation des transferts...' : 'Établissement de la connexion WebRTC...'}
            </p>
            {!dataChannelReady && <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Cela peut prendre quelques instants</p>}
          </div>
        ) : (
          Object.values(activeTransfers).map(transfer => (
            <TransferItem
              key={transfer.fileId || `error-${transfer.fileName}`}
              item={{
                id: transfer.fileId || `error-${transfer.fileName}`,
                name: transfer.fileName || `Fichier-${(transfer.fileId || '').substring(0, 8)}`,
                size: transfer.fileSize || 0,
                status: transfer.status,
                recipient: recipientName,
                error: transfer.error
              }}
              progress={transferProgress[transfer.fileId] || 0}
              onCancel={onCancelTransfer}
              onRetry={() => handleSendFiles()}
            />
          ))
        )}
      </div>

      {Object.values(activeTransfers).length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progression totale</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {Object.values(activeTransfers).filter(t => t.status === 'completed').length} / {Object.values(activeTransfers).length} terminés
              {hasErrors && ' (avec erreurs)'}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
            <div className={`h-2 rounded-full ${hasErrors ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${calculateOverallProgress()}%` }} />
          </div>
        </div>
      )}
    </div>
  );
};

const WSTransferItem = ({ item, onRetry, onCancel, progress }) => {
  const getStatusBadge = () => {
    let bgColor, textColor, label;
    switch (item.status) {
      case 'pending':
        bgColor = 'bg-yellow-100 dark:bg-yellow-900/30';
        textColor = 'text-yellow-800 dark:text-yellow-300';
        label = 'En attente';
        break;
      case 'sending':
      case 'receiving':
        bgColor = 'bg-blue-100 dark:bg-blue-900/30';
        textColor = 'text-blue-800 dark:text-blue-300';
        label = item.status === 'sending' ? 'Envoi' : 'Réception';
        break;
      case 'completed':
        bgColor = 'bg-green-100 dark:bg-green-900/30';
        textColor = 'text-green-800 dark:text-green-300';
        label = 'Terminé';
        break;
      case 'error':
        bgColor = 'bg-red-100 dark:bg-red-900/30';
        textColor = 'text-red-800 dark:text-red-300';
        label = 'Erreur';
        break;
      case 'cancelled':
      case 'refused':
        bgColor = 'bg-gray-100 dark:bg-gray-800';
        textColor = 'text-gray-800 dark:text-gray-300';
        label = item.status === 'cancelled' ? 'Annulé' : 'Refusé';
        break;
      default:
        bgColor = 'bg-gray-100 dark:bg-gray-800';
        textColor = 'text-gray-800 dark:text-gray-300';
        label = 'Inconnu';
    }
    return <span className={`text-xs px-2 py-1 rounded-full ${bgColor} ${textColor}`}>{label}</span>;
  };

  const isInProgress = ['pending', 'sending', 'receiving'].includes(item.status);

  return (
    <div className={`border ${item.status === 'error' ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'} rounded-lg overflow-hidden mb-3`}>
      <div className="p-3 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <div className={`p-2 rounded-md ${
              item.status === 'error'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300'
            } mr-3`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatFileSize(item.size)} • {item.sender ? `De ${item.sender}` : (item.recipient ? `À ${item.recipient}` : '')}
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {item.status === 'error' && item.error && (
          <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded text-xs text-red-800 dark:text-red-300">
            <strong>Erreur:</strong> {item.error}
          </div>
        )}

        {isInProgress && (
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-2">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all"
              style={{ width: `${progress || 0}%` }}
            />
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {isInProgress && progress ? `${Math.round(progress)}%` : ''}
            {item.status === 'completed' && 'Transfert terminé'}
            {item.status === 'error' && 'Le transfert a échoué'}
            {item.status === 'cancelled' && 'Transfert annulé'}
            {item.status === 'refused' && 'Transfert refusé'}
          </div>

          <div className="flex space-x-2">
            {item.status === 'error' && onRetry && (
              <button
                onClick={() => onRetry(item.id)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Réessayer
              </button>
            )}

            {isInProgress && onCancel && (
              <button
                onClick={() => onCancel(item.id)}
                className="text-xs text-red-600 dark:text-red-400 hover:underline"
              >
                Annuler
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ConfirmationModal = ({ offer, onAccept, onRefuse }) => {
  if (!offer) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 animate-fade-in">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
          Demande de transfert de fichier
        </h3>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          <span className="font-medium">{offer.senderName}</span> souhaite vous envoyer {offer.files.length > 1 ? `${offer.files.length} fichiers` : 'un fichier'}
        </p>
        
        <div className="mb-4 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          {offer.files.map((file, index) => (
            <div key={index} className="flex items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 mr-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-800 dark:text-white text-sm">{file.fileName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.fileSize)}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex space-x-3 justify-end">
          <button
            onClick={onRefuse}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Refuser
          </button>
          <button
            onClick={onAccept}
            className="px-4 py-2 bg-[#34B7F1] text-white rounded-lg hover:bg-[#2da8e0]"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
};

const TransferringStepWs = ({
  selectedDevice,
  selectedFiles,
  onTransferComplete,
  offer
}) => {
  // Utiliser useRef au lieu de useState quand possible
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [renderTrigger, setRenderTrigger] = useState(0); // Pour forcer le rendu quand nécessaire
  
  // Refs pour stocker les données sans provoquer de re-renders
  const activeTransfersRef = useRef({});
  const transferProgressRef = useRef({});
  const hasErrorsRef = useRef(false);
  const transfersInProgressRef = useRef(0);
  const offerRef = useRef(null);
  const abortControllersRef = useRef({});
  
  const { sendMessage, subscribe } = useWebSocket();
  const chunkSize = 1024 * 200; // 200KB chunks
  
  // Fonction pour forcer un rendu quand nécessaire
  const forceUpdate = useCallback(() => {
    setRenderTrigger(prev => prev + 1);
  }, []);
  
  // Initialiser les transferts au montage du composant
  useEffect(() => {
    // Si on reçoit une offre, la stocker et afficher le modal
    if (offer) {
        // Gérer les offres de fichiers entrantes
        offerRef.current = {
            ...offer,
            files: offer.files || [],
            senderName: offer.senderName || 'Expéditeur inconnu',
            senderId: offer.senderId
        };
        setShowConfirmModal(true);
    }
    // Si on est en mode envoi, démarrer l'envoi
    else if (selectedFiles?.current?.length > 0 && selectedDevice?.current) {
      sendFileOffer();
    }

    const unsubFileAccept = subscribe('file-accept', handleFileAccept);
    const unsubFileRefuse = subscribe('file-refuse', handleFileRefuse);
    const unsubFileProgress = subscribe('file-progress', handleFileProgress);
    const unsubFileChunk = subscribe('file-chunk', handleFileChunk);
    const unsubFileComplete = subscribe('file-complete', handleFileComplete);
    const unsubFileError = subscribe('file-error', handleFileError);
    const unsubFileCancel = subscribe('file-cancel', handleFileCancel);
    
    return () => {
      // Nettoyer les souscriptions
      unsubFileAccept();
      unsubFileRefuse();
      unsubFileProgress();
      unsubFileChunk();
      unsubFileComplete();
      unsubFileError();
      unsubFileCancel();
      
      // Annuler les transferts en cours
      Object.values(abortControllersRef.current).forEach(controller => {
        if (controller) controller.abort();
      });
    };
  }, []);
  
  // Accepter une offre de fichier
  const handleAcceptOffer = () => {
    const offer = offerRef.current;
    if (!offer) return;
    
    setShowConfirmModal(false);
    
    // Envoyer l'acceptation
    sendMessage({
      type: 'file-accept',
      to: offer.senderId,
      offerId: offer.offerId
    });
    
    // Initialiser les transferts pour chaque fichier
    offer.files.forEach(file => {
      activeTransfersRef.current[file.fileId] = {
        fileId: file.fileId,
        fileName: file.fileName,
        fileSize: file.fileSize,
        fileType: file.fileType,
        status: 'receiving',
        sender: offer.senderName,
        chunks: {},
        totalChunks: file.totalChunks
      };
    });
    
    transfersInProgressRef.current = offer.files.length;
    forceUpdate();
  };
  
  // Refuser une offre de fichier
  const handleRefuseOffer = () => {
    const offer = offerRef.current;
    if (!offer) return;
    
    setShowConfirmModal(false);
    
    // Envoyer le refus
    sendMessage({
      type: 'file-refuse',
      to: offer.senderId,
      offerId: offer.offerId
    });
    
    offerRef.current = null;
  };
  
  // Gérer l'acceptation d'une offre
  const handleFileAccept = (msg) => {
    // Commencer à envoyer les fichiers
    handleSendFiles();
  };
  
  // Gérer le refus d'une offre
  const handleFileRefuse = (msg) => {
    // Marquer les fichiers comme refusés
    if (selectedFiles?.current) {
      selectedFiles.current.forEach((file, index) => {
        const fileId = `file-${Date.now()}-${index}`;
        activeTransfersRef.current[fileId] = {
          fileId,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          status: 'refused',
          recipient: selectedDevice?.current?.name || 'Destinataire inconnu'
        };
      });
      forceUpdate();
    }
  };
  
  // Envoyer une offre de fichier
  const sendFileOffer = () => {
    if (!selectedFiles?.current?.length || !selectedDevice?.current) return;
    
    const device = selectedDevice.current;
    const files = selectedFiles.current;
    
    // Préparer les métadonnées des fichiers
    const fileInfos = files.map((file, index) => ({
      fileId: `file-${Date.now()}-${index}`,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      totalChunks: Math.ceil(file.size / chunkSize)
    }));
    
    // Envoyer l'offre
    sendMessage({
      type: 'offer',
      to: device.id,
      offerId: `offer-${Date.now()}`,
      senderName: 'Mon appareil', // À remplacer par le nom configuré
      senderId: 'my-device-id', // À remplacer par l'ID de l'appareil
      files: fileInfos
    });
    
    // Initialiser les transferts pour chaque fichier
    fileInfos.forEach((fileInfo, index) => {
      activeTransfersRef.current[fileInfo.fileId] = {
        ...fileInfo,
        status: 'pending',
        recipient: device.name || 'Destinataire inconnu',
        file: files[index] // Stocker la référence au fichier
      };
    });
    
    forceUpdate();
  };
  
  // Gérer la progression des fichiers
  const handleFileProgress = (msg) => {
    const { fileId, progress } = msg;
    transferProgressRef.current[fileId] = progress;
    forceUpdate();
  };
  
  // Gérer les chunks de fichiers reçus
  const handleFileChunk = (msg) => {
    const { fileId, chunkIndex, totalChunks, chunk } = msg;
    
    if (!activeTransfersRef.current[fileId]) return;
    
    // Stocker le chunk
    if (!activeTransfersRef.current[fileId].chunks) {
      activeTransfersRef.current[fileId].chunks = {};
    }
    
    activeTransfersRef.current[fileId].chunks[chunkIndex] = chunk;
    
    // Calculer la progression
    const receivedChunks = Object.keys(activeTransfersRef.current[fileId].chunks).length;
    const progress = Math.floor((receivedChunks / totalChunks) * 100);
    transferProgressRef.current[fileId] = progress;
    
    // Si tous les chunks sont reçus, assembler le fichier
    if (receivedChunks === totalChunks) {
      assembleFile(fileId);
    }
    
    forceUpdate();
  };
  
  // Assembler un fichier à partir des chunks
  const assembleFile = (fileId) => {
    const fileTransfer = activeTransfersRef.current[fileId];
    if (!fileTransfer || !fileTransfer.chunks) return;
    
    // Mettre à jour le statut
    fileTransfer.status = 'completed';
    
    // Assembler les chunks
    const chunks = [];
    for (let i = 0; i < fileTransfer.totalChunks; i++) {
      if (fileTransfer.chunks[i]) {
        const binary = atob(fileTransfer.chunks[i]);
        const bytes = new Uint8Array(binary.length);
        for (let j = 0; j < binary.length; j++) {
          bytes[j] = binary.charCodeAt(j);
        }
        chunks.push(bytes.buffer);
      }
    }
    
    // Créer le blob et télécharger le fichier
    const blob = new Blob(chunks, { type: fileTransfer.fileType || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileTransfer.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Nettoyer les chunks pour libérer de la mémoire
    delete fileTransfer.chunks;
    
    transfersInProgressRef.current--;
    forceUpdate();
    
    // Vérifier si tous les transferts sont terminés
    checkAllTransfersComplete();
  };
  
  // Gérer la fin d'un transfert
  const handleFileComplete = (msg) => {
    const { fileId } = msg;
    
    if (activeTransfersRef.current[fileId]) {
      activeTransfersRef.current[fileId].status = 'completed';
      transfersInProgressRef.current--;
      forceUpdate();
      
      // Vérifier si tous les transferts sont terminés
      checkAllTransfersComplete();
    }
  };
  
  // Gérer les erreurs de transfert
  const handleFileError = (msg) => {
    const { fileId, error } = msg;
    
    if (activeTransfersRef.current[fileId]) {
      activeTransfersRef.current[fileId].status = 'error';
      activeTransfersRef.current[fileId].error = error;
      hasErrorsRef.current = true;
      transfersInProgressRef.current--;
      forceUpdate();
    }
  };
  
  // Gérer l'annulation d'un transfert
  const handleFileCancel = (msg) => {
    const { fileId } = msg;
    
    if (activeTransfersRef.current[fileId]) {
      activeTransfersRef.current[fileId].status = 'cancelled';
      transfersInProgressRef.current--;
      forceUpdate();
    }
  };
  
  // Envoyer les fichiers
  const handleSendFiles = async () => {
    if (!selectedFiles?.current?.length || !selectedDevice?.current) return;
    
    const device = selectedDevice.current;
    
    // Envoyer chaque fichier
    Object.values(activeTransfersRef.current).forEach(transfer => {
      if (transfer.status === 'pending' && transfer.file) {
        // Mettre à jour le statut
        transfer.status = 'sending';
        transfersInProgressRef.current++;
        
        // Créer un contrôleur d'annulation
        abortControllersRef.current[transfer.fileId] = new AbortController();
        
        // Envoyer le fichier en chunks
        sendFileInChunks(transfer.file, transfer.fileId, device.id);
      }
    });
    
    forceUpdate();
  };
  
  // Envoyer un fichier en chunks via WebSocket
  const sendFileInChunks = async (file, fileId, recipientId) => {
    try {
      const totalChunks = Math.ceil(file.size / chunkSize);
      let sentChunks = 0;
      
      for (let start = 0; start < file.size; start += chunkSize) {
        // Vérifier si le transfert a été annulé
        if (abortControllersRef.current[fileId]?.signal?.aborted) {
          throw new Error('Transfer cancelled');
        }
        
        const chunk = file.slice(start, start + chunkSize);
        const buffer = await chunk.arrayBuffer();
        const base64data = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        
        // Envoyer le chunk
        sendMessage({
          type: 'file-chunk',
          data: {
            fileId,
            chunkIndex: sentChunks,
            totalChunks,
            chunk: base64data
          },
          to: recipientId
        });
        
        sentChunks++;
        
        // Mettre à jour la progression
        const progress = Math.floor((sentChunks / totalChunks) * 100);
        transferProgressRef.current[fileId] = progress;
        forceUpdate();
        
        // Petit délai pour éviter de surcharger le WebSocket
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      // Envoyer le message de fin
      sendMessage({
        type: 'file-complete',
        data: { fileId },
        to: recipientId
      });
      
      // Mettre à jour le statut
      activeTransfersRef.current[fileId].status = 'completed';
      transfersInProgressRef.current--;
      forceUpdate();
      
      // Vérifier si tous les transferts sont terminés
      checkAllTransfersComplete();
      
    } catch (error) {
      console.error(`Erreur lors du transfert du fichier ${file.name}:`, error);
      
      // Mettre à jour le statut
      activeTransfersRef.current[fileId].status = 'error';
      activeTransfersRef.current[fileId].error = error?.message || 'Échec du transfert';
      hasErrorsRef.current = true;
      transfersInProgressRef.current--;
      forceUpdate();
      
      // Notifier le destinataire de l'annulation
      sendMessage({
        type: 'file-error',
        data: { fileId, error: error?.message },
        to: recipientId
      });
    } finally {
      // Nettoyer le contrôleur d'annulation
      delete abortControllersRef.current[fileId];
    }
  };
  
  // Annuler un transfert
  const onCancelTransfer = (fileId) => {
    // Annuler le transfert
    if (abortControllersRef.current[fileId]) {
      abortControllersRef.current[fileId].abort();
    }
    
    // Mettre à jour le statut
    activeTransfersRef.current[fileId].status = 'cancelled';
    transfersInProgressRef.current--;
    forceUpdate();
    
    // Notifier le destinataire
    if (selectedDevice?.current) {
      sendMessage({
        type: 'file-cancel',
        data: { fileId },
        to: selectedDevice.current.id
      });
    }
  };
  
  // Vérifier si tous les transferts sont terminés
  const checkAllTransfersComplete = () => {
    if (transfersInProgressRef.current <= 0 && onTransferComplete) {
      setTimeout(() => onTransferComplete(), 2000);
    }
  };
  
  // Calculer la progression globale
  const calculateOverallProgress = () => {
    const transfers = Object.values(activeTransfersRef.current);
    if (transfers.length === 0) return 0;
    
    const total = transfers.reduce((sum, t) => sum + (transferProgressRef.current[t.fileId] || 0), 0);
    return Math.floor(total / transfers.length);
  };
  
  return (
    <div className="flex-1 flex flex-col">
      {/* Modal de confirmation */}
      {showConfirmModal && offerRef.current && (
        <ConfirmationModal 
          offer={offerRef.current}
          onAccept={handleAcceptOffer}
          onRefuse={handleRefuseOffer}
        />
      )}
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
          Transfert WebSocket en cours
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {selectedDevice?.current && `Transfert vers ${selectedDevice.current.name}`}
          {offerRef.current && `Transfert depuis ${offerRef.current.senderName}`}
        </p>

        <div className="mt-2 flex items-center text-green-600">
          <span className="inline-block w-2 h-2 rounded-full mr-2 bg-green-600" />
          <span className="text-xs font-medium">
            Connexion WebSocket active
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {Object.keys(activeTransfersRef.current).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {showConfirmModal ? 'En attente de votre confirmation...' : 'Préparation des transferts...'}
            </p>
          </div>
        ) : (
          Object.values(activeTransfersRef.current).map(transfer => (
            <WSTransferItem
              key={transfer.fileId}
              item={{
                id: transfer.fileId,
                name: transfer.fileName,
                size: transfer.fileSize,
                status: transfer.status,
                recipient: transfer.recipient,
                sender: transfer.sender,
                error: transfer.error
              }}
              progress={transferProgressRef.current[transfer.fileId] || 0}
              onCancel={onCancelTransfer}
              onRetry={() => handleSendFiles()}
            />
          ))
        )}
      </div>

      {Object.keys(activeTransfersRef.current).length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progression totale</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {Object.values(activeTransfersRef.current).filter(t => t.status === 'completed').length} / {Object.values(activeTransfersRef.current).length} terminés
              {hasErrorsRef.current && ' (avec erreurs)'}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
            <div className={`h-2 rounded-full ${hasErrorsRef.current ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${calculateOverallProgress()}%` }} />
          </div>
        </div>
      )}
    </div>
  );
};

const Transfer = () => {
  // États locaux
  const deviceName = useRef(`${Math.random().toString(36).substring(2, 8)}`);
  const selectedFiles = useRef([]);
  const selectedDevice = useRef(null);
  const [transferStep, setTransferStep] = useState('select-files');
  const {isConnected, sendMessage , subscribe } = useWebSocket();
  const receivedOffer = useRef(null);

  useEffect(()=>{
    const unsubscribe = subscribe("peer-discovery" , (data)=>{
      if(data.name == deviceName.current) return;
      console.log(data);
      sendMessage({
        type: 'peer-discovery-response',
        to:data.sender,
        name: deviceName.current
      })
    })
    return unsubscribe;
  },[subscribe])

  useEffect(() => {
    console.log("register offer peer")
    const unsubscribe = subscribe('offer', async (data)=>{
      try {
          console.log("Réception d'une offre, état de signalisation:" , data);
          receivedOffer.current = data;
          if(data.offerId){
            setTransferStep('transferring-ws');
          }else{
            setTransferStep('transferring');
          }
        } catch (error) {
          console.error("Erreur lors du traitement de l'offre:", error);
        }
      }
    );
    return ()=>{
      unsubscribe();
    }
  }, []);

  const resetTransfer = () => {
    selectedFiles.current = [];
    selectedDevice.current = null;
    receivedOffer.current = null;
    setTransferStep('select-files');
  };
  
  // Rendu du contenu en fonction de l'étape actuelle
  const renderContent = () => {
    switch (transferStep) {
      case 'select-files':
        return (
          <SelectFilesStep
            onFileSelect={files => selectedFiles.current = files}
            onSelectEnd={() => 
              {
                sendMessage({
                  type: 'peer-discovery',
                  name: deviceName.current,
                });
                setTransferStep('select-device');
              }
            }
          />
        );
        
      case 'select-device':
        return (
          <SelectDeviceStep
            deviceName={deviceName.current}
            selectedFiles={selectedFiles.current}
            onDeviceSelect={(device)=>{
              selectedDevice.current = device;
              setTransferStep('transferring-ws');
            }}
            onCancel={resetTransfer}
          />
        );
        
      case 'transferring':
        return (
          <TransferringStep
            selectedDevice={selectedDevice}
            selectedFiles={selectedFiles}
            onTransferComplete={resetTransfer}
            offerSdp={receivedOffer.current}
          />
        );
        
      case 'transferring-ws':
        return (
          <TransferringStepWs
            selectedDevice={selectedDevice}
            selectedFiles={selectedFiles}
            onTransferComplete={resetTransfer}
            offer={receivedOffer.current}
          />
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      <StatusBanner status={isConnected ? 'connected' : 'disconnected'} />
      
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
};

export default Transfer;
