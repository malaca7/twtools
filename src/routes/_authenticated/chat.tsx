import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/chat")({
  component: ChatPage,
});

export function ChatPage() {
  return <Navigate to="/dashboard" replace />;
}
