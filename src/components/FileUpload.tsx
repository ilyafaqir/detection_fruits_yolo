import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
}

const FileUpload = ({ onFileSelect, accept = 'image/*', maxSize = 5242880 }: FileUploadProps) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles?.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif'] },
    maxSize,
    multiple: false
  });

  return (
    <div
      {...getRootProps()}
      className={`relative group cursor-pointer transition-all duration-300 
        p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center
        ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 
          isDragReject ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 
          'border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500'}`}
    >
      <input {...getInputProps()} />
      
      <div className="relative">
        <div className={`absolute inset-0 bg-blue-500 rounded-full opacity-20 group-hover:animate-ping 
          ${isDragActive ? 'animate-ping' : ''}`} style={{ width: '48px', height: '48px' }} />
        
        {isDragReject ? (
          <div className="h-12 w-12 text-red-500 dark:text-red-400">
            <ImageIcon className="h-full w-full" />
          </div>
        ) : (
          <div className="h-12 w-12 text-blue-500 dark:text-blue-400">
            <Upload className="h-full w-full" />
          </div>
        )}
      </div>

      <div className="mt-4 text-center">
        {isDragActive ? (
          <p className="text-blue-600 dark:text-blue-400 font-medium">
            Déposez l'image ici...
          </p>
        ) : isDragReject ? (
          <p className="text-red-600 dark:text-red-400 font-medium">
            Ce type de fichier n'est pas supporté
          </p>
        ) : (
          <>
            <p className="text-gray-600 dark:text-gray-300 font-medium">
              Glissez-déposez une image ici
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              ou cliquez pour sélectionner
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              PNG, JPG ou GIF (max. {Math.round(maxSize / 1024 / 1024)}MB)
            </p>
          </>
        )}
      </div>

      <div className="absolute inset-0 pointer-events-none rounded-xl transition-opacity duration-300
        bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100" />
    </div>
  );
};

export default FileUpload; 