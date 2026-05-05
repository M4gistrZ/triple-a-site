type Listener = (data: unknown) => void;

const listeners = new Map<string, Set<Listener>>();

export function emit(conversationId: string, data: unknown) {
  const subs = listeners.get(conversationId);
  if (subs) {
    subs.forEach((fn) => fn(data));
  }
  const all = listeners.get("*");
  if (all) {
    all.forEach((fn) => fn(data));
  }
}

export function subscribe(conversationId: string, listener: Listener): () => void {
  if (!listeners.has(conversationId)) {
    listeners.set(conversationId, new Set());
  }
  listeners.get(conversationId)!.add(listener);
  return () => {
    listeners.get(conversationId)?.delete(listener);
  };
}

export function cleanup() {
  listeners.clear();
}
