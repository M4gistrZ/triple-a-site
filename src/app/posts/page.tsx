"use client";

import { useEffect, useState } from "react";
import { Plus, Send, Trash2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

type Reaction = { emoji: string; userId: string };
type PostUser = {
  id: string;
  nickname: string;
  profile: { avatar: string } | null;
};
type Post = {
  id: string;
  content: string;
  createdAt: string;
  user: PostUser;
  _count: { comments: number; reactions: number };
  reactions: Reaction[];
};
type Comment = {
  id: string;
  content: string;
  createdAt: string;
  user: PostUser;
};

const defaultEmojis = ["❤️", "😂", "🔥", "👍", "👎", "😮", "🌿"];

export default function PostsPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState("");
  const [postLoading, setPostLoading] = useState(false);
  const [postError, setPostError] = useState("");
  const [commentsOpen, setCommentsOpen] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [emojiPicker, setEmojiPicker] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/posts")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

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
      setNewPost("");
      fetch("/api/posts")
        .then((r) => r.json())
        .then((data) => setPosts(Array.isArray(data) ? data : []));
    } else {
      const d = await res.json();
      setPostError(d.error || "Ошибка");
    }
    setPostLoading(false);
  };

  const toggleReaction = async (postId: string, emoji: string) => {
    const res = await fetch(`/api/posts/${postId}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    });
    if (res.ok) {
      const data = await res.json();
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          let reactions = [...p.reactions];
          if (data.removed) {
            reactions = reactions.filter((r) => r.emoji !== emoji);
          } else {
            reactions.push({ emoji, userId: "" });
          }
          return { ...p, reactions };
        })
      );
      setEmojiPicker(null);
    }
  };

  const loadComments = async (postId: string) => {
    setCommentsOpen((prev) => ({ ...prev, [postId]: !prev[postId] }));
    if (comments[postId]) return;
    const res = await fetch(`/api/posts/${postId}/comments`);
    if (res.ok) {
      const data = await res.json();
      setComments((prev) => ({ ...prev, [postId]: data }));
    }
  };

  const submitComment = async (postId: string) => {
    const text = commentText[postId];
    if (!text?.trim()) return;
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text.trim() }),
    });
    if (res.ok) {
      setCommentText((prev) => ({ ...prev, [postId]: "" }));
      const updated = await res.json();
      setComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), updated],
      }));
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm("Удалить этот пост?")) return;
    const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    }
  };

  const deleteComment = async (commentId: string, postId: string) => {
    const res = await fetch(`/api/comments/${commentId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setComments((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((pid) => {
          updated[pid] = updated[pid]?.filter((c) => c.id !== commentId) || [];
        });
        return updated;
      });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, _count: { ...p._count, comments: Math.max(0, p._count.comments - 1) } } : p
        )
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-text-muted">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6 text-text">Посты</h1>

      <div className="bg-bg-elevated border border-border rounded-lg p-6 mb-6">
        <textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          rows={4}
          maxLength={5000}
          className="w-full px-3 py-2 bg-bg border border-border rounded-md text-text resize-none focus:outline-none focus:border-green"
          placeholder="Напишите что-нибудь..."
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-text-muted">{newPost.length}/5000</span>
          <div className="flex items-center gap-2">
            {postError && (
              <span className="text-xs text-pink">{postError}</span>
            )}
            <button
              onClick={handlePost}
              disabled={postLoading || !newPost.trim()}
              className="flex items-center gap-1 px-4 py-1 bg-green hover:bg-green-hover text-white rounded text-sm transition-colors disabled:opacity-50"
            >
              <Plus className="w-3 h-3" />
              Опубликовать
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {posts.length === 0 ? (
          <p className="text-text-muted text-center py-8">Пока нет постов</p>
        ) : (
          posts.map((post) => {
            const reactionCounts: Record<string, number> = {};
            post.reactions.forEach((r) => {
              reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
            });

            return (
              <div
                key={post.id}
                className="bg-bg-elevated border border-border rounded-lg p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  {post.user.profile?.avatar ? (
                    <img
                      src={post.user.profile.avatar}
                      alt={post.user.nickname}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-pink-light flex items-center justify-center text-pink text-sm font-bold">
                      {post.user.nickname.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <a
                    href={`/profile/${post.user.id}`}
                    className="font-medium text-text hover:text-pink transition-colors text-sm"
                  >
                    {post.user.nickname}
                  </a>
                  <span className="text-xs text-text-muted">
                    {new Date(post.createdAt).toLocaleString("ru-RU")}
                  </span>
                </div>

                <p className="text-text whitespace-pre-wrap text-sm mb-4">
                  {post.content}
                </p>

                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {Object.entries(reactionCounts).map(([emoji, count]) => (
                    <button
                      key={emoji}
                      onClick={() => toggleReaction(post.id, emoji)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-bg border border-border rounded-full text-xs transition-colors cursor-pointer hover:border-pink"
                    >
                      {emoji} {count}
                    </button>
                  ))}
                  <div className="relative">
                    <button
                      onClick={() =>
                        setEmojiPicker(
                          emojiPicker === post.id ? null : post.id
                        )
                      }
                      className="px-2 py-0.5 bg-bg border border-border rounded-full text-xs text-text-muted hover:border-pink transition-colors"
                    >
                      +
                    </button>
                    {emojiPicker === post.id && (
                      <div className="absolute top-full left-0 mt-1 bg-bg-elevated border border-border rounded-lg p-2 flex gap-1 z-10 shadow-lg">
                        {defaultEmojis.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => toggleReaction(post.id, emoji)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-bg-hover rounded text-sm transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {(user?.id === post.user.id || user?.role === "admin") && (
                    <button
                      onClick={() => deletePost(post.id)}
                      className="text-xs text-text-muted hover:text-pink transition-colors"
                      title="Удалить пост"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={() => loadComments(post.id)}
                    className="text-xs text-text-muted hover:text-pink transition-colors"
                  >
                    Комментарии ({post._count.comments})
                  </button>
                </div>

                {commentsOpen[post.id] && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="space-y-3 mb-4">
                      {(comments[post.id] || []).map((comment) => (
                        <div key={comment.id} className="flex items-start gap-2">
                          {comment.user.profile?.avatar ? (
                            <img
                              src={comment.user.profile.avatar}
                              alt={comment.user.nickname}
                              className="w-6 h-6 rounded-full object-cover mt-0.5"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-pink-light flex items-center justify-center text-pink text-xs font-bold mt-0.5">
                              {comment.user.nickname.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 bg-bg border border-border rounded-md px-3 py-2">
                            <div className="flex items-center justify-between">
                              <a
                                href={`/profile/${comment.user.id}`}
                                className="text-xs font-medium text-text hover:text-pink"
                              >
                                {comment.user.nickname}
                              </a>
                              <span className="text-xs text-text-muted">
                                {new Date(comment.createdAt).toLocaleString("ru-RU")}
                              </span>
                            </div>
                            <p className="text-sm text-text mt-1">
                              {comment.content}
                            </p>
                          </div>
                           <button
                             onClick={() => deleteComment(comment.id, post.id)}
                             className="p-1 text-text-muted hover:text-pink transition-colors"
                           >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentText[post.id] || ""}
                        onChange={(e) =>
                          setCommentText((prev) => ({
                            ...prev,
                            [post.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") submitComment(post.id);
                        }}
                        className="flex-1 px-3 py-1.5 bg-bg border border-border rounded-md text-sm text-text focus:outline-none focus:border-green"
                        placeholder="Написать комментарий..."
                        maxLength={1000}
                      />
                      <button
                        onClick={() => submitComment(post.id)}
                        className="p-1.5 bg-green hover:bg-green-hover text-white rounded-md transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
