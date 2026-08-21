'use client';

import { useState, useRef } from 'react';
import { useAuthStore } from '../../store/useAuthStore.js';
import { updateProfileApi, uploadAvatarApi } from '../../api/user.api.js';
import { useToast } from '../common/ToastContext.jsx';
import { X, Camera, Loader2, Check, AlertCircle } from 'lucide-react';

export default function UserProfileModal({ isOpen, onClose }) {
  const { user, setAuth, accessToken } = useAuthStore();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [statusMessage, setStatusMessage] = useState(user?.statusMessage || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      const errMsg = 'Image file size must be less than 5MB';
      setError(errMsg);
      toast.error(errMsg);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await uploadAvatarApi(formData);
      const updatedUser = res.data.user;
      setAvatarPreview(updatedUser.avatarUrl);
      setAuth(updatedUser, accessToken);
      toast.success('Avatar updated successfully!');
    } catch (err) {
      const errMsg = err.response?.data?.error?.message || 'Failed to upload avatar image';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await updateProfileApi({ statusMessage });
      const updatedUser = res.data;
      setAuth(updatedUser, accessToken);
      toast.success('Profile saved successfully!');
      onClose();
    } catch (err) {
      const errMsg = err.response?.data?.error?.message || 'Failed to update profile';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close edit profile modal"
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-slate-100">Edit Profile</h2>
          <p className="text-xs text-slate-400">Update your avatar and status bio</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Avatar Upload Container */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <div
            onClick={handleAvatarClick}
            className="relative group cursor-pointer w-24 h-24 rounded-full overflow-hidden border-2 border-indigo-500/40 hover:border-indigo-500 transition-all shadow-xl shadow-indigo-950/50"
          >
            <img
              src={avatarPreview || user?.avatarUrl}
              alt={`${user?.username}'s avatar preview`}
              className="w-full h-full object-cover"
            />

            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-slate-100 text-xs gap-1">
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
              ) : (
                <>
                  <Camera className="w-5 h-5 text-indigo-400" />
                  <span className="font-semibold text-[10px]">Change</span>
                </>
              )}
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
          />

          <span className="text-xs font-semibold text-slate-200">@{user?.username}</span>
        </div>

        {/* Profile Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Status Message
            </label>
            <input
              type="text"
              maxLength={100}
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
              placeholder="e.g. In a meeting / Available"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
            />
            <span className="text-[10px] text-slate-500 float-right mt-1">
              {statusMessage.length}/100
            </span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-lg shadow-indigo-600/25 flex items-center gap-2 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
