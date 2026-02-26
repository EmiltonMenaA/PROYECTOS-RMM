import { useState, useRef } from 'react';
import ProgressBar from './ProgressBar';

export default function FileUploadWithProgress({
  onFilesSelected,
  maxFiles = 5,
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  maxFileSize = 10 * 1024 * 1024, // 10MB
  uploadProgress = 0,
  isUploading = false
}) {
  const fileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState(null);

  const handleFileChange = e => {
    const files = Array.from(e.target.files || []);
    setError(null);

    // Validar número de archivos
    if (files.length > maxFiles) {
      setError(`Máximo ${maxFiles} archivos permitidos`);
      return;
    }

    // Validar cada archivo
    const validFiles = [];
    for (const file of files) {
      // Validar tipo
      if (!allowedTypes.includes(file.type)) {
        setError(`Tipo de archivo no permitido: ${file.name}`);
        return;
      }

      // Validar tamaño
      if (file.size > maxFileSize) {
        setError(
          `Archivo muy grande: ${file.name} (máx ${(maxFileSize / 1024 / 1024).toFixed(0)}MB)`
        );
        return;
      }

      validFiles.push(file);
    }

    setSelectedFiles(validFiles);
    if (onFilesSelected) {
      onFilesSelected(validFiles);
    }
  };

  const removeFile = index => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    if (onFilesSelected) {
      onFilesSelected(newFiles);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Upload Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center cursor-pointer hover:bg-blue-50 transition"
      >
        <div className="text-4xl mb-2">📁</div>
        <p className="text-sm font-medium text-gray-700">
          Arrastra archivos aquí o haz clic para seleccionar
        </p>
        <p className="text-xs text-gray-500 mt-1">
          PNG, JPG, WebP o PDF (máx {(maxFileSize / 1024 / 1024).toFixed(0)}MB)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.join(',')}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <ProgressBar
          percentage={uploadProgress}
          label="Subiendo archivos..."
          showPercentage={true}
          animate={true}
          color="blue"
        />
      )}

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Archivos seleccionados ({selectedFiles.length}/{maxFiles})
          </p>
          <div className="space-y-2">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-lg">{file.type.includes('image') ? '🖼️' : '📄'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)}MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(idx)}
                  disabled={isUploading}
                  className="ml-2 text-red-500 hover:text-red-700 disabled:text-gray-300 transition"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Count */}
      {selectedFiles.length === 0 && !isUploading && (
        <p className="text-xs text-gray-500 text-center">
          {maxFiles === 1 ? 'Un archivo' : `Hasta ${maxFiles} archivos`}
        </p>
      )}
    </div>
  );
}
