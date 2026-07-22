'use client';

import React, { useRef, useState } from 'react';
import { Paperclip, UploadCloud, X, Loader2, File, Image as ImageIcon, Download, Trash2 } from 'lucide-react';
import { useAttachments, useUploadAttachment, useDeleteAttachment, Attachment } from '@/hooks/useAttachments';
import { motion, AnimatePresence } from 'framer-motion';

export function AttachmentSection({ taskId }: { taskId: string }) {
  const { data: attachments, isLoading } = useAttachments(taskId);
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadAttachment(taskId);
  const { mutateAsync: deleteAttachment, isPending: isDeleting } = useDeleteAttachment(taskId);
  
  const [isDragOver, setIsDragOver] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = async (file: File) => {
    try {
      await uploadFile(file);
    } catch (error) {
      console.error('Failed to upload file', error);
      alert('Failed to upload file');
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteId(id);
    try {
      await deleteAttachment(id);
    } finally {
      setDeleteId(null);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-blue-500" />;
    return <File className="w-8 h-8 text-primary" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 mt-8 border-t border-border pt-8">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
          <Paperclip className="w-5 h-5 text-primary" /> Attachments
        </h3>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-sm font-semibold rounded-lg transition-colors"
        >
          <UploadCloud className="w-4 h-4" /> Upload
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
        />
      </div>

      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-colors ${
          isDragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-secondary/20'
        }`}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="font-semibold">Uploading...</p>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground mb-1">Drag & Drop files here</p>
            <p className="text-sm text-muted-foreground">or click the Upload button</p>
          </>
        )}
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[1, 2, 3].map((i) => <div key={i} className="w-32 h-32 shrink-0 bg-secondary/50 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        attachments && attachments.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <AnimatePresence>
              {attachments.map((file) => {
                const isImage = file.mimeType.startsWith('image/');
                const url = file.url.startsWith('http') ? file.url : `http://localhost:5000${file.url}`;
                
                return (
                  <motion.div 
                    key={file.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="group relative bg-card border border-border rounded-xl overflow-hidden shadow-sm"
                  >
                    <div className="aspect-square bg-secondary/30 flex items-center justify-center overflow-hidden">
                      {isImage ? (
                        <img src={url} alt={file.originalName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        getFileIcon(file.mimeType)
                      )}
                    </div>
                    
                    <div className="p-3 border-t border-border">
                      <p className="text-sm font-semibold truncate" title={file.originalName}>{file.originalName}</p>
                      <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                    </div>

                    <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                      <a 
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                        title="Download / View"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button 
                        onClick={() => handleDelete(file.id)}
                        disabled={deleteId === file.id}
                        className="p-2 bg-destructive/10 text-destructive rounded-full hover:bg-destructive/20 transition-colors shadow-lg"
                        title="Delete"
                      >
                        {deleteId === file.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )
      )}
    </div>
  );
}
