"use client";

import { useEffect, useState } from "react";

export default function RoleHintTypewriter({
  messages,
  typingSpeedMs = 22,
  deletingSpeedMs = 14,
  holdMs = 1800,
  switchDelayMs = 260,
}: {
  messages: string[];
  typingSpeedMs?: number;
  deletingSpeedMs?: number;
  holdMs?: number;
  switchDelayMs?: number;
}) {
  const safeMessages = messages.filter((message) => message.trim().length > 0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentMessage =
    safeMessages.length > 0
      ? safeMessages[messageIndex % safeMessages.length]
      : "";

  useEffect(() => {
    setMessageIndex(0);
    setVisibleCount(0);
    setIsDeleting(false);
  }, [messages]);

  useEffect(() => {
    if (!currentMessage) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisibleCount(currentMessage.length);
      return;
    }

    const timeoutId = window.setTimeout(
      () => {
        if (!isDeleting && visibleCount < currentMessage.length) {
          setVisibleCount((current) => current + 1);
          return;
        }

        if (!isDeleting && visibleCount >= currentMessage.length) {
          setIsDeleting(true);
          return;
        }

        if (isDeleting && visibleCount > 0) {
          setVisibleCount((current) => current - 1);
          return;
        }

        if (safeMessages.length > 1) {
          setMessageIndex((current) => (current + 1) % safeMessages.length);
        }
        setIsDeleting(false);
      },
      !isDeleting && visibleCount < currentMessage.length
        ? typingSpeedMs
        : !isDeleting && visibleCount >= currentMessage.length
          ? holdMs
          : isDeleting && visibleCount > 0
            ? deletingSpeedMs
            : switchDelayMs,
    );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    currentMessage,
    deletingSpeedMs,
    holdMs,
    isDeleting,
    safeMessages.length,
    switchDelayMs,
    typingSpeedMs,
    visibleCount,
  ]);

  const isTyping =
    !currentMessage ||
    visibleCount < currentMessage.length ||
    (isDeleting && visibleCount > 0);

  return (
    <span aria-label={currentMessage}>
      {currentMessage.slice(0, visibleCount)}
      {isTyping ? (
        <span aria-hidden="true" className="ml-0.5 inline-block animate-pulse">
          |
        </span>
      ) : null}
    </span>
  );
}
