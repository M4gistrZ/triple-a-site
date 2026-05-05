"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit2, Save, X, Plus } from "lucide-react";
import { FileUpload } from "@/components/FileUpload";
import { ImageViewer } from "@/components/ImageViewer";

type Post = {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; nickname: string };
};

type ProfileData = {
  id: string;
  nickname: string;
  role: string;
  createdAt: string;
  profile: { bio: string; avatar: string; skin: string } | null;
  posts: Post[];
};

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [skin, setSkin] = useState("");
  const [saving, setSaving] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [postLoading, setPostLoading] = useState(false);
  const [postError, setPostError] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const loadProfile = async () => {
    if (!params.id) return;
    const r = await fetch(`/api/profile/${params.id}`);
    if (r.ok) {
      const data = await r.json();
      setUser(data);
      setBio(data.profile?.bio || "");
      setAvatar(data.profile?.avatar || "");
      setSkin(data.profile?.skin || "");
    } else {
      router.push("/members");
    }
  };

  useEffect(() => {
    if (params.id) {
      loadProfile().finally(() => setLoading(false));
    }
  }, [params.id]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const res = await fetch(`/api/profile/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bio: bio.slice(0, 1000), avatar, skin }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUser((prev) => (prev ? { ...prev, profile: updated } : null));
      setEditing(false);
    }
    setSaving(false);
  };

  const handlePost = async () => {
    if (!newPost.trim()) return;
    if (newPost.length > 5000) {
      setPostError("Слишком длинный пост (макс. 5000 символов)");
      return;
    }
    setPostLoading(true);
    setPostError("");
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newPost.trim() }),
    });
    if (res.ok) {
      const created = await res.json();
      setUser((prev) =>
        prev
          ? { ...prev, posts: [created, ...prev.posts] }
          : null
      );
      setNewPost("");
    } else {
      const d = await res.json();
      setPostError(d.error || "Ошибка");
    }
    setPostLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-stone-400">Загрузка...</p>
      </div>
    );
  }

  if (!user) return null;

  const avatarUrl = avatar || user.profile?.avatar || "";
  const skinUrl = skin || user.profile?.skin || "";

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link
          href="/members"
          className="flex items-center gap-2 text-sm text-stone-400 hover:text-pink-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад к участникам
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Профиль</h2>
              <button
                onClick={() => setEditing(!editing)}
                className="p-1 hover:bg-stone-200 rounded transition-colors"
              >
                <Edit2 className="w-4 h-4 text-stone-400" />
              </button>
            </div>

            <div className="flex justify-center mb-4">
              {avatarUrl ? (
                <button
                  onClick={() => setSelectedImage(avatarUrl)}
                  className="cursor-pointer hover:opacity-90 transition-opacity"
                >
                  <img
                    src={avatarUrl}
                    alt={user.nickname}
                    className="w-24 h-24 rounded-full object-cover border-2 border-stone-200"
                  />
                </button>
              ) : (
                <div className="w-24 h-24 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 text-2xl font-bold">
                  {user.nickname.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <h3 className="text-center text-lg font-bold text-stone-800">
              {user.nickname}
            </h3>
            <p className="text-center text-sm text-stone-400 mb-4">
              {new Date(user.createdAt).toLocaleDateString("ru-RU")}
            </p>

            {editing ? (
              <div className="space-y-3 mt-4">
                <div>
                  <label className="block text-xs text-stone-400 mb-1">
                    О себе
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    className="w-full px-2 py-1 bg-white border border-stone-200 rounded text-sm text-stone-700 resize-none focus:outline-none focus:border-pink-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-400 mb-1">
                    Аватарка
                  </label>
                  <FileUpload
                    onUpload={(url) => setAvatar(url)}
                    type="avatar"
                    label="Загрузить"
                    preview={avatar}
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-400 mb-1">
                    Скин
                  </label>
                  <FileUpload
                    onUpload={(url) => setSkin(url)}
                    type="skin"
                    label="Загрузить"
                    preview={skin}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors disabled:opacity-50"
                  >
                    <Save className="w-3 h-3" />
                    Сохранить
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="p-1 hover:bg-stone-200 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-stone-400" />
                  </button>
                </div>
              </div>
            ) : (
              user.profile?.bio && (
                <p className="text-sm text-stone-500 text-center mt-2">
                  {user.profile.bio}
                </p>
              )
            )}

            {skinUrl && (
              <div className="mt-4">
                <p className="text-xs text-stone-400 mb-2">Скин:</p>
                <button
                  onClick={() => setSelectedImage(skinUrl)}
                  className="w-full bg-white border border-stone-200 rounded overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                >
                  <img
                    src={skinUrl}
                    alt="Skin"
                    className="w-full h-auto object-contain"
                  />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Новый пост</h2>
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              rows={4}
              maxLength={5000}
              className="w-full px-3 py-2 bg-white border border-stone-200 rounded-md text-stone-700 resize-none focus:outline-none focus:border-green-400"
              placeholder="Напишите что-нибудь..."
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-stone-400">
                {newPost.length}/5000
              </span>
              <div className="flex items-center gap-2">
                {postError && (
                  <span className="text-xs text-pink-600">{postError}</span>
                )}
                <button
                  onClick={handlePost}
                  disabled={postLoading || !newPost.trim()}
                  className="flex items-center gap-1 px-4 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors disabled:opacity-50"
                >
                  <Plus className="w-3 h-3" />
                  Опубликовать
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Посты</h2>
            {user.posts.length === 0 ? (
              <p className="text-stone-400 text-sm">Пока нет постов</p>
            ) : (
              user.posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-stone-50 border border-stone-200 rounded-lg p-5"
                >
                  <p className="text-stone-700 whitespace-pre-wrap text-sm">
                    {post.content}
                  </p>
                  <p className="text-xs text-stone-400 mt-3">
                    {new Date(post.createdAt).toLocaleString("ru-RU")}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {selectedImage && (
        <ImageViewer
          src={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
}
