"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Send, Plus, Users, ArrowLeft, Image, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

type ConvUser = { id: string; nickname: string; avatar: string };
type LastMessage = {
  id: string;
  content: string;
  image: string;
  sender: { id: string; nickname: string };
  createdAt: string;
};
type ConversationListItem = {
  id: string;
  name: string;
  avatar: string;
  isGroup: boolean;
  lastMessage: LastMessage | null;
  updatedAt: string;
  unread: number;
};
type Message = {
  id: string;
  content: string;
  image: string;
  createdAt: string;
  conversationId: string;
  sender: { id: string; nickname: string; profile: { avatar: string } | null };
};
type ConvDetail = {
  id: string;
  name: string;
  isGroup: boolean;
  avatar: string;
  participants: ConvUser[];
  messages: Message[];
  lastReadId: string;
};
type UserForInvite = { id: string; nickname: string; profile: { avatar: string } | null };
type SSEEvent = { type: string; data: Message };

export default function MessengerPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [convDetail, setConvDetail] = useState<ConvDetail | null>(null);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [showNewConv, setShowNewConv] = useState(false);
  const [allUsers, setAllUsers] = useState<UserForInvite[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isGroup, setIsGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [sendError, setSendError] = useState("");
  const [chatListCollapsed, setChatListCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sseRef = useRef<EventSource | null>(null);
  const msgInputRef = useRef<HTMLInputElement>(null);
  const selectedIdRef = useRef<string | null>(null);
  const isSendingRef = useRef(false);
  const newMsgRef = useRef("");
  const imageUrlRef = useRef("");
  const sentMsgIdsRef = useRef<Set<string>>(new Set());

  selectedIdRef.current = selectedId;

  useEffect(() => {
    newMsgRef.current = newMsg;
  }, [newMsg]);

  useEffect(() => {
    imageUrlRef.current = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    if (sendError) setSendError("");
  }, [newMsg, imageUrl]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    fetch("/api/conversations")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setConversations(Array.isArray(data) ? data : []))
      .catch(() => setConversations([]));
  }, []);

  useEffect(() => {
    if (showNewConv) {
      fetchUsers();
    }
  }, [showNewConv]);

  useEffect(() => {
    if (typeof window === "undefined" || !user) return;

    let es = new EventSource("/api/messages/stream");
    sseRef.current = es;

    const handleEvent = (raw: string) => {
      try {
        const evt = JSON.parse(raw) as SSEEvent;
        if (evt.type === "connected" || !evt.data) return;
        if (evt.type === "message") {
          const msg = evt.data;

          if (selectedIdRef.current && msg.conversationId === selectedIdRef.current) {
            const isOwnMsg = msg.sender?.id === user?.id;
            setConvDetail((prev) => {
              if (!prev || prev.id !== msg.conversationId) return prev;
              if (isOwnMsg) return prev;
              if (prev.messages.some((m) => m.id === msg.id)) return prev;
              return { ...prev, messages: [...prev.messages, msg] };
            });
          }

          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === msg.conversationId) {
                const isUnread = msg.sender?.id !== user?.id && selectedIdRef.current !== msg.conversationId;
                return {
                  ...c,
                  lastMessage: {
                    id: msg.id,
                    content: msg.content,
                    image: msg.image,
                    sender: { id: msg.sender?.id || "", nickname: msg.sender?.nickname || "" },
                    createdAt: msg.createdAt,
                  },
                  unread: isUnread ? c.unread + 1 : 0,
                };
              }
              return c;
            })
          );
        }
        if (evt.type === "messageDeleted") {
          const deletedMsgId = (evt.data as { id: string }).id;
          setConvDetail((prev) => prev ? { ...prev, messages: prev.messages.filter((m) => m.id !== deletedMsgId) } : null);
        }
      } catch {
        /* keepalive or parse error */
      }
    };

    es.onmessage = (e) => handleEvent(e.data);

    es.onerror = () => {
      es.close();
      setTimeout(() => {
        const newEs = new EventSource("/api/messages/stream");
        sseRef.current = newEs;
        newEs.onmessage = (e) => handleEvent(e.data);
        newEs.onerror = () => {
          newEs.close();
        };
      }, 3000);
    };

    return () => {
      es.close();
    };
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [convDetail?.messages?.length, scrollToBottom]);

  const refreshConversations = () => {
    fetch("/api/conversations")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setConversations(Array.isArray(data) ? data : []));
  };

  const selectConversation = async (id: string) => {
    setSelectedId(id);
    setShowImagePicker(false);
    setImageUrl("");
    const res = await fetch(`/api/conversations/${id}`);
    if (res.ok) {
      const data = await res.json();
      setConvDetail(data);
      await fetch(`/api/conversations/${id}/read`, { method: "POST" });
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c))
      );
    }
  };

  const sendMessage = async () => {
    const content = newMsgRef.current.trim();
    const img = imageUrlRef.current;
    if ((!content && !img) || isSendingRef.current || !selectedId) return;

    isSendingRef.current = true;
    setSending(true);
    setSendError("");

    try {
      const res = await fetch(`/api/conversations/${selectedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, image: img }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        const msg = err?.error || `Ошибка отправки (${res.status})`;
        setSendError(msg);
        return;
      }

      const msg = await res.json();

      setConvDetail((prev) => {
        if (!prev) return prev;
        if (prev.messages.some((m) => m.id === msg.id)) return prev;
        return { ...prev, messages: [...prev.messages, msg] };
      });

      sentMsgIdsRef.current.add(msg.id);
      setTimeout(() => sentMsgIdsRef.current.delete(msg.id), 15000);
      setNewMsg("");
      setImageUrl("");
      setShowImagePicker(false);
      msgInputRef.current?.focus();
    } catch (err) {
      setSendError("Не удалось отправить сообщение");
    } finally {
      isSendingRef.current = false;
      setSending(false);
      setTimeout(() => setSendError(""), 5000);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setAllUsers(Array.isArray(data) ? data.filter((u: UserForInvite) => u.id !== user?.id) : []);
      } else {
        console.error("Failed to fetch users:", res.status);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const createConversation = async () => {
    if (selectedUsers.length === 0) return;
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userIds: selectedUsers,
        name: isGroup ? groupName : undefined,
        isGroup,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setShowNewConv(false);
      setSelectedUsers([]);
      setGroupName("");
      setIsGroup(false);
      setAllUsers([]);
      setLoadingUsers(false);
      refreshConversations();
      selectConversation(data.id);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000 && d.getDate() === now.getDate()) {
      return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  };

  const getInitials = (name: string) => name.charAt(0).toUpperCase();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-text-muted">Войдите для доступа к мессенджеру</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {showNewConv ? (
        <div className="w-80 border-r border-border flex flex-col bg-bg-secondary">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <button
              onClick={() => {
                setShowNewConv(false);
                setAllUsers([]);
                setLoadingUsers(false);
              }}
              className="p-1 hover:bg-bg-hover rounded"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="font-semibold text-sm text-text">Новый чат</h2>
          </div>
          <div className="p-3 space-y-3">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer text-text">
                <input
                  type="radio"
                  checked={!isGroup}
                  onChange={() => setIsGroup(false)}
                  className="accent-green"
                />
                Личный
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer text-text">
                <input
                  type="radio"
                  checked={isGroup}
                  onChange={() => setIsGroup(true)}
                  className="accent-green"
                />
                Группа
              </label>
            </div>
            {isGroup && (
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Название группы"
                className="w-full px-3 py-1.5 bg-bg border border-border rounded-md text-sm text-text focus:outline-none focus:border-green"
                maxLength={50}
              />
            )}
            <div>
              <p className="text-xs text-text-muted mb-2">Выберите участников:</p>
              {loadingUsers && (
                <p className="text-xs text-text-muted">Загрузка...</p>
              )}
              {allUsers.length === 0 && !loadingUsers && (
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={fetchUsers}
                    className="text-xs text-pink hover:underline"
                  >
                    Загрузить список
                  </button>
                </div>
              )}
              <div className="max-h-64 overflow-y-auto space-y-1">
                {allUsers.length === 0 && !loadingUsers && (
                  <p className="text-xs text-text-muted py-2">Нет доступных участников</p>
                )}
                {allUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setSelectedUsers((prev) =>
                        prev.includes(u.id)
                          ? prev.filter((x) => x !== u.id)
                          : isGroup
                          ? [...prev, u.id]
                          : [u.id]
                      );
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedUsers.includes(u.id)
                        ? "bg-pink-light text-pink"
                        : "hover:bg-bg-hover text-text"
                    }`}
                  >
                    {u.profile?.avatar ? (
                      <img src={u.profile.avatar} className="w-6 h-6 rounded-full object-cover" alt="" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-pink-light flex items-center justify-center text-pink text-xs font-bold">
                        {getInitials(u.nickname)}
                      </div>
                    )}
                    {u.nickname}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={createConversation}
              disabled={selectedUsers.length === 0}
              className="w-full py-2 bg-green hover:bg-green-hover text-white rounded-md text-sm transition-colors disabled:opacity-50"
            >
              Создать
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`border-r border-border flex flex-col bg-bg-secondary transition-all duration-200 ${
            chatListCollapsed ? "w-16" : "w-80"
          }`}
        >
          <div className="p-3 border-b border-border flex items-center justify-between">
            {!chatListCollapsed && <h2 className="font-semibold text-sm text-text">Сообщения</h2>}
            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={() => {
                  setShowNewConv(true);
                  setAllUsers([]);
                  setLoadingUsers(false);
                }}
                className="p-1.5 hover:bg-bg-hover rounded-md transition-colors"
              >
                <Plus className="w-4 h-4 text-text-muted" />
              </button>
              <button
                onClick={() => setChatListCollapsed(!chatListCollapsed)}
                className="p-1.5 hover:bg-bg-hover rounded-md transition-colors"
                title={chatListCollapsed ? "Развернуть" : "Свернуть"}
              >
                {chatListCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-text-muted" />
                ) : (
                  <ChevronLeft className="w-4 h-4 text-text-muted" />
                )}
              </button>
            </div>
          </div>
          {!chatListCollapsed && (
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-8">Нет чатов</p>
              ) : (
                conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-border ${
                    selectedId === conv.id
                      ? "bg-pink-light"
                      : "hover:bg-bg-hover"
                  }`}
                >
                  {conv.avatar ? (
                    <img src={conv.avatar} className="w-10 h-10 rounded-full object-cover shrink-0" alt="" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-pink-light flex items-center justify-center text-pink font-bold shrink-0">
                      {getInitials(conv.name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-text truncate">{conv.name}</span>
                      {conv.lastMessage && (
                        <span className="text-xs text-text-muted shrink-0 ml-2">
                          {formatTime(conv.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs text-text-muted truncate">
                        {conv.lastMessage
                          ? conv.lastMessage.image
                            ? "Изображение"
                            : `${conv.lastMessage.sender.nickname}: ${conv.lastMessage.content}`
                          : "Нет сообщений"}
                      </span>
                      {conv.unread > 0 && (
                        <span className="ml-2 bg-green text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
              )}
            </div>
          )}
          {chatListCollapsed && (
            <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  className={`w-full flex items-center justify-center p-2 rounded-md transition-colors relative ${
                    selectedId === conv.id
                      ? "bg-pink-light"
                      : "hover:bg-bg-hover"
                  }`}
                  title={conv.name}
                >
                  {conv.avatar ? (
                    <img src={conv.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-pink-light flex items-center justify-center text-pink text-sm font-bold">
                      {getInitials(conv.name)}
                    </div>
                  )}
                  {conv.unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-green text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {conv.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {convDetail ? (
        <div className="flex-1 flex flex-col">
          <div className="px-6 py-3 border-b border-border flex items-center gap-3 bg-bg-elevated">
            <button
              onClick={() => setChatListCollapsed(!chatListCollapsed)}
              className="p-1.5 hover:bg-bg-hover rounded-md transition-colors mr-2"
              title={chatListCollapsed ? "Развернуть" : "Свернуть"}
            >
              {chatListCollapsed ? (
                <ChevronRight className="w-4 h-4 text-text-muted" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-text-muted" />
              )}
            </button>
            {convDetail.avatar ? (
              <img src={convDetail.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-pink-light flex items-center justify-center text-pink text-sm font-bold">
                {getInitials(convDetail.name)}
              </div>
            )}
            <div>
              <h3 className="font-medium text-sm text-text">{convDetail.name}</h3>
              {convDetail.isGroup && (
                <span className="text-xs text-text-muted">
                  {convDetail.participants.length} участников
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-bg-elevated">
            {convDetail.messages.map((msg) => {
              const isOwn = msg.sender.id === user.id;
              return (
                   <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"} group`}>
                     {!isOwn && (
                       <div className="flex items-center gap-2 mr-2">
                         {msg.sender.profile?.avatar ? (
                           <img src={msg.sender.profile.avatar} className="w-5 h-5 rounded-full object-cover" alt="" />
                         ) : (
                           <div className="w-5 h-5 rounded-full bg-pink-light flex items-center justify-center text-pink text-xs font-bold">
                             {getInitials(msg.sender.nickname)}
                           </div>
                         )}
                         <span className="text-xs text-text-muted">{msg.sender.nickname}</span>
                       </div>
                     )}
                     <div className={`max-w-md ${isOwn ? "order-1" : ""}`}>
                       <div
                         className={`px-4 py-2 rounded-lg text-sm ${
                           isOwn
                             ? "bg-green text-white rounded-br-sm"
                             : "bg-bg-hover text-text rounded-bl-sm"
                         }`}
                       >
                         {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                         {msg.image && (
                           <img
                             src={msg.image}
                             alt=""
                             className="mt-2 max-w-full rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                             style={{ maxHeight: "300px", objectFit: "contain" }}
                             onClick={() => window.open(msg.image, "_blank")}
                           />
                         )}
                         <p className={`text-xs mt-1 ${isOwn ? "text-green-100" : "text-text-muted"}`}>
                           {formatTime(msg.createdAt)}
                         </p>
                       </div>
                     </div>
                     {(isOwn || user?.role === "admin") && (
                       <button
                         onClick={async () => {
                           if (!confirm("Удалить сообщение?")) return;
                           const res = await fetch(`/api/messages/${msg.id}`, { method: "DELETE" });
                           if (res.ok) {
                             setConvDetail((prev) => prev ? { ...prev, messages: prev.messages.filter((m) => m.id !== msg.id) } : null);
                           }
                         }}
                         className={`p-1 text-text-muted hover:text-pink transition-colors ${isOwn ? "order-0 mr-1" : "ml-1"} opacity-0 group-hover:opacity-100`}
                         title="Удалить"
                       >
                         ✕
                       </button>
                     )}
                   </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {showImagePicker ? (
            <div className="px-6 py-3 border-t border-border bg-bg-secondary">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Вставьте URL изображения..."
                  className="flex-1 px-3 py-2 bg-bg border border-border rounded-md text-sm text-text focus:outline-none focus:border-green"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setShowImagePicker(false);
                      msgInputRef.current?.focus();
                    }
                  }}
                />
                <button
                  onClick={() => {
                    setShowImagePicker(false);
                    msgInputRef.current?.focus();
                  }}
                  className="px-3 py-2 text-sm text-text-muted hover:text-text"
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : null}

          <div className="px-6 py-4 border-t border-border bg-bg-elevated">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowImagePicker(!showImagePicker)}
                className={`p-2 rounded-md transition-colors ${
                  showImagePicker
                    ? "bg-pink-light text-pink"
                    : "text-text-muted hover:bg-bg-hover"
                }`}
                title="Прикрепить изображение"
              >
                <Image className="w-5 h-5" />
              </button>
              <input
                ref={msgInputRef}
                type="text"
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Написать сообщение..."
                maxLength={5000}
                className="flex-1 px-4 py-2 bg-bg-secondary border border-border rounded-full text-sm text-text focus:outline-none focus:border-green"
              />
              <button
                onClick={sendMessage}
                disabled={sending || (!newMsg.trim() && !imageUrl)}
                className="p-2 bg-green hover:bg-green-hover text-white rounded-full transition-colors disabled:opacity-50 relative"
              >
                {sending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            {sendError && (
              <p className="text-xs text-pink mt-2">{sendError}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-bg-secondary">
          <div className="text-center">
            <Users className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <p className="text-text-muted">Выберите чат или создайте новый</p>
          </div>
        </div>
      )}
    </div>
  );
}
