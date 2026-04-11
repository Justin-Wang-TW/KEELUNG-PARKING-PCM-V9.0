import React, { useState, useEffect } from 'react';
import { X, Send, User as UserIcon, Bell, CheckCircle, MessageSquare, Filter } from 'lucide-react';
import { Message, MessageType, User } from '../types';

interface MessageCenterProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  users: User[];
  currentUser: User;
  onMarkAsRead: (messageId: string) => void;
  onSendMessage: (receiverEmail: string, content: string) => Promise<boolean>;
}

const MessageCenter: React.FC<MessageCenterProps> = ({
  isOpen, onClose, messages, users, currentUser, onMarkAsRead, onSendMessage
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'private' | 'system'>('all');
  const [isComposing, setIsComposing] = useState(false);
  const [newMsgReceiver, setNewMsgReceiver] = useState('');
  const [newMsgContent, setNewMsgContent] = useState('');
  const [sending, setSending] = useState(false);

  // Filter messages based on active tab
  const filteredMessages = messages.filter(msg => {
    if (activeTab === 'unread') return !msg.isRead;
    if (activeTab === 'private') return msg.type === MessageType.PRIVATE;
    if (activeTab === 'system') return msg.type === MessageType.SYSTEM || msg.type === MessageType.BROADCAST || msg.type === MessageType.MENTION;
    return true;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleSend = async () => {
    if (!newMsgReceiver || !newMsgContent.trim()) return;
    setSending(true);
    const success = await onSendMessage(newMsgReceiver, newMsgContent);
    setSending(false);
    if (success) {
      setIsComposing(false);
      setNewMsgContent('');
      setNewMsgReceiver('');
      setActiveTab('private'); // Switch to private tab to see sent message (if we were displaying sent messages, but here we display received. User might want to know it's sent.)
      alert('訊息已發送');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-25 transition-opacity" onClick={onClose}></div>
      <div className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
        <div className="w-screen max-w-md transform transition ease-in-out duration-500 sm:duration-700 bg-white shadow-xl flex flex-col">
          
          {/* Header */}
          <div className="px-4 py-6 bg-blue-600 sm:px-6 flex justify-between items-center">
            <div className="flex items-center space-x-2 text-white">
              <Bell className="h-6 w-6" />
              <h2 className="text-lg font-medium">訊息中心</h2>
            </div>
            <button onClick={onClose} className="text-blue-200 hover:text-white">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Tabs & Actions */}
          <div className="border-b border-gray-200 px-4 py-2 bg-gray-50 flex justify-between items-center">
            <div className="flex space-x-2 overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: '全部' },
                { id: 'unread', label: '未讀' },
                { id: 'private', label: '私訊' },
                { id: 'system', label: '系統' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setIsComposing(!isComposing)}
              className="ml-2 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-sm"
              title="撰寫新訊息"
            >
              <MessageSquare className="h-4 w-4" />
            </button>
          </div>

          {/* Compose Area */}
          {isComposing && (
            <div className="p-4 bg-blue-50 border-b border-blue-100 animate-in slide-in-from-top-2">
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">收件者</label>
                <select 
                  className="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={newMsgReceiver}
                  onChange={(e) => setNewMsgReceiver(e.target.value)}
                >
                  <option value="">選擇使用者...</option>
                  {users.filter(u => u.email !== currentUser.email).map(u => (
                    <option key={u.email} value={u.email}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">內容</label>
                <textarea
                  rows={3}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="輸入訊息內容..."
                  value={newMsgContent}
                  onChange={(e) => setNewMsgContent(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button 
                  onClick={() => setIsComposing(false)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 rounded-md"
                >
                  取消
                </button>
                <button 
                  onClick={handleSend}
                  disabled={sending || !newMsgReceiver || !newMsgContent.trim()}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
                >
                  {sending ? '發送中...' : <><Send className="h-3 w-3 mr-1" /> 發送</>}
                </button>
              </div>
            </div>
          )}

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Bell className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>沒有訊息</p>
              </div>
            ) : (
              filteredMessages.map(msg => (
                <div 
                  key={msg.id} 
                  onClick={() => !msg.isRead && onMarkAsRead(msg.id)}
                  className={`relative p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                    msg.isRead ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center space-x-2">
                      {msg.type === MessageType.PRIVATE ? (
                        <UserIcon className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Bell className="h-4 w-4 text-orange-500" />
                      )}
                      <span className="font-semibold text-sm text-gray-900">
                        {msg.type === MessageType.SYSTEM ? '系統通知' : msg.senderName}
                      </span>
                      {msg.type === MessageType.MENTION && (
                        <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-[10px] rounded-full">@提及</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(msg.timestamp).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <p className={`text-sm ${msg.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                    {msg.content}
                  </p>

                  {!msg.isRead && (
                    <div className="absolute top-4 right-4 h-2 w-2 bg-red-500 rounded-full"></div>
                  )}
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default MessageCenter;
