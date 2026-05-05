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

  const deleteComment = async (commentId: string) => {
    const res = await fetch(`/api/comments/${commentId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setComments((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((postId) => {
          updated[postId] = updated[postId]?.filter((c) => c.id !== commentId) || [];
        });
        return updated;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-stone-400">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Посты</h1>

      <div className="bg-stone-50 border border-stone-200 rounded-lg p-6 mb-6">
        <textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          rows={4}
          maxLength={5000}
          className="w-full px-3 py-2 bg-white border border-stone-200 rounded-md text-stone-700 resize-none focus:outline-none focus:border-green-400"
          placeholder="Напишите что-нибудь..."
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-stone-400">{newPost.length}/5000</span>
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
        {posts.length === 0 ? (
          <p className="text-stone-400 text-center py-8">Пока нет постов</p>
        ) : (
          posts.map((post) => {
            const reactionCounts: Record<string, number> = {};
            post.reactions.forEach((r) => {
              reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
            });

            return (
              <div
                key={post.id}
                className="bg-stone-50 border border-stone-200 rounded-lg p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  {post.user.profile?.avatar ? (
                    <img
                      src={post.user.profile.avatar}
                      alt={post.user.nickname}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 text-sm font-bold">
                      {post.user.nickname.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <a
                    href={`/profile/${post.user.id}`}
                    className="font-medium text-stone-700 hover:text-pink-600 transition-colors text-sm"
                  >
                    {post.user.nickname}
                  </a>
                  <span className="text-xs text-stone-400">
                    {new Date(post.createdAt).toLocaleString("ru-RU")}
                  </span>
                </div>

                <p className="text-stone-700 whitespace-pre-wrap text-sm mb-4">
                  {post.content}
                </p>

                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {Object.entries(reactionCounts).map(([emoji, count]) => (
                    <button
                      key={emoji}
                      onClick={() => toggleReaction(post.id, emoji)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border rounded-full text-xs transition-colors cursor-pointer hover:border-pink-300"
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
                      className="px-2 py-0.5 bg-white border border-stone-200 rounded-full text-xs text-stone-400 hover:border-pink-300 transition-colors"
                    >
                      +
                    </button>
                    {emojiPicker === post.id && (
                      <div className="absolute top-full left-0 mt-1 bg-white border border-stone-200 rounded-lg p-2 flex gap-1 z-10 shadow-lg">
                        {defaultEmojis.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => toggleReaction(post.id, emoji)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-stone-100 rounded text-sm transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => loadComments(post.id)}
                    className="text-xs text-stone-400 hover:text-pink-600 transition-colors"
                  >
                    Комментарии ({post._count.comments})
                  </button>
                </div>

                {commentsOpen[post.id] && (
                  <div className="mt-4 pt-4 border-t border-stone-200">
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
                            <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 text-xs font-bold mt-0.5">
                              {comment.user.nickname.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 bg-white border border-stone-200 rounded-md px-3 py-2">
                            <div className="flex items-center justify-between">
                              <a
                                href={`/profile/${comment.user.id}`}
                                className="text-xs font-medium text-stone-600 hover:text-pink-600"
                              >
                                {comment.user.nickname}
                              </a>
                              <span className="text-xs text-stone-300">
                                {new Date(comment.createdAt).toLocaleString("ru-RU")}
                              </span>
                            </div>
                            <p className="text-sm text-stone-700 mt-1">
                              {comment.content}
                            </p>
                          </div>
                          <button
                            onClick={() => deleteComment(comment.id)}
                            className="p-1 text-stone-300 hover:text-pink-600 transition-colors"
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
                        className="flex-1 px-3 py-1.5 bg-white border border-stone-200 rounded-md text-sm text-stone-700 focus:outline-none focus:border-green-400"
                        placeholder="Написать комментарий..."
                        maxLength={1000}
                      />
                      <button
                        onClick={() => submitComment(post.id)}
                        className="p-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
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
