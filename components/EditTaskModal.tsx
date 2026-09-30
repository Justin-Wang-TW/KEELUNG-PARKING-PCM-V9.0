import React, { useState, useEffect } from 'react';
import { Task, TaskStatus } from '../types';
import { X, Upload, FileText, Trash2, Link as LinkIcon, Loader2, Paperclip } from 'lucide-react';

interface EditTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  // Updated signature to support multiple files up to 15
  onSave: (
    taskId: string, 
    newStatus: TaskStatus, 
    currentAttachmentUrl?: string, 
    newFile?: { name: string, type: string, content: string },
    newFiles?: { name: string, type: string, content: string }[]
  ) => Promise<void>;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, isOpen, onClose, onSave }) => {
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.PENDING);
  const [currentAttachment, setCurrentAttachment] = useState(''); // Stores the existing URL string
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); // Stores up to 15 selected files
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (task) {
      setStatus(task.status);
      setCurrentAttachment(task.attachmentUrl || '');
      setSelectedFiles([]);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const incoming = Array.from(e.target.files);
      setSelectedFiles(prev => {
        const combined = [...prev, ...incoming];
        if (combined.length > 15) {
          alert('每次最多可上傳 15 個檔案，已為您保留前 15 個。');
          return combined.slice(0, 15);
        }
        return combined;
      });
      e.target.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let filesData: { name: string, type: string, content: string }[] | undefined = undefined;

      // Prepare files data if selected
      if (selectedFiles.length > 0) {
        filesData = await Promise.all(
          selectedFiles.map(async (file) => {
            const base64Content = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = (error) => reject(error);
            });

            return {
              name: file.name,
              type: file.type,
              content: base64Content
            };
          })
        );
      }

      const primaryFile = filesData && filesData.length > 0 ? filesData[0] : undefined;
      await onSave(task.uid, status, currentAttachment, primaryFile, filesData);
      onClose();
    } catch (error) {
      console.error("Error saving task:", error);
      alert("更新失敗，請重試");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md animate-fade-in">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-bold text-gray-800">更新進度</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">任務序號 (UID)</label>
            <p className="text-sm font-mono bg-gray-50 p-2 rounded">{task.uid}</p>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">工項名稱</label>
            <p className="text-sm font-medium text-gray-900">{task.itemName}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">執行狀態</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {Object.values(TaskStatus).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-gray-700 uppercase">
                佐證資料上傳
              </label>
              <span className="text-xs text-gray-500 font-medium">
                {selectedFiles.length > 0 ? `已選取 ${selectedFiles.length}/15 個` : '最多可上傳 15 個檔案'}
              </span>
            </div>
            
            {selectedFiles.length < 15 && (
              <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-5 hover:bg-gray-50 transition-colors text-center cursor-pointer group mb-3">
                <input 
                  type="file" 
                  multiple
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                  accept="image/*,.pdf,.doc,.docx"
                />
                <div className="flex flex-col items-center justify-center space-y-1.5">
                  <div className="p-2.5 bg-blue-50 rounded-full group-hover:bg-blue-100 transition-colors">
                    <Upload className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">
                    {selectedFiles.length > 0 ? '點擊或拖曳檔案以繼續加入' : '點擊或拖曳檔案至此'}
                  </p>
                  <p className="text-xs text-gray-400">支援圖片、PDF 或 Word 文件 (單次最多 15 個)</p>
                </div>
              </div>
            )}

            {selectedFiles.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-blue-50 border border-blue-100 rounded-lg text-sm">
                    <div className="flex items-center space-x-2.5 overflow-hidden">
                      <div className="p-1.5 bg-white rounded shadow-xs shrink-0">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate text-xs">{file.name}</p>
                        <p className="text-[11px] text-gray-500">
                          {file.size > 1024 * 1024 
                            ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` 
                            : `${(file.size / 1024).toFixed(1)} KB`}
                        </p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors shrink-0"
                      title="移除此檔案"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {currentAttachment && (
              <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center">
                    <LinkIcon className="w-3.5 h-3.5 text-blue-600 mr-1.5" />
                    <p className="text-xs text-gray-700 font-bold">目前已儲存的佐證資料：</p>
                  </div>
                  <span className="text-[11px] text-gray-400">
                    共 {currentAttachment.split(/[\n,]+/).map(u => u.trim()).filter(Boolean).length} 個檔案
                  </span>
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {currentAttachment.split(/[\n,]+/).map(u => u.trim()).filter(Boolean).map((url, uIdx) => (
                    <a 
                      key={uIdx}
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline break-all flex items-center p-1 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Paperclip className="w-3 h-3 mr-1 text-blue-500 shrink-0" />
                      <span className="truncate">{url.startsWith('data:') ? `檢視佐證檔案 (${uIdx + 1})` : `開啟佐證檔案 (${uIdx + 1}) - ${url}`}</span>
                    </a>
                  ))}
                </div>
                {selectedFiles.length > 0 && (
                  <p className="text-[11px] text-amber-600 font-medium mt-1.5 pt-1.5 border-t border-gray-200">
                    💡 提示：本次新選取的 {selectedFiles.length} 個檔案儲存後將自動接續加入。
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              確認更新
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTaskModal;