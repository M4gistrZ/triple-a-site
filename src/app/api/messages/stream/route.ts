import { getSession } from "@/lib/auth";
import { subscribe } from "@/lib/chatEvents";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let isClosed = false;

  const stream = new ReadableStream({
    start(controller) {
      const sendEvent = (data: unknown) => {
        if (isClosed) return;
        const event = `data: ${JSON.stringify(data)}\n\n`;
        try {
          controller.enqueue(encoder.encode(event));
        } catch {
          isClosed = true;
        }
      };

      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`));

      const unsub = subscribe("*", sendEvent);

      const timer = setInterval(() => {
        if (isClosed) {
          clearInterval(timer);
          return;
        }
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          isClosed = true;
          clearInterval(timer);
        }
      }, 25000);

      return () => {
        unsub();
        clearInterval(timer);
        isClosed = true;
      };
    },
    cancel() {
      isClosed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
