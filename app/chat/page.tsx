"use client";

import { useState } from "react";
import Image from "next/image";

export default function ChatPage() {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant", content: string }>>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    try {
      setIsLoading(true);
      // ユーザーメッセージを追加
      const userMessage = { role: "user", content: input };
      setMessages(prev => [...prev, userMessage]);
      setInput("");

      // APIリクエスト
      const response = await fetch('/api/prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      
      // AIの応答を追加
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.message
      }]);

    } catch (error) {
      console.error('Error:', error);
      // エラーメッセージを表示する処理を追加することもできます
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto pt-8 pb-24">
        {/* メッセージ表示エリア */}
        <div className="space-y-6 mb-8 px-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-100 shadow"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
        </div>

        {/* 入力フォーム */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4">
            <div className="flex gap-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="メッセージを入力..."
                className="flex-1 rounded-lg border border-gray-600 bg-gray-700 text-white p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
              />
            <button
              type="submit"
              disabled={isLoading}
              className={`${
                isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              } text-white px-6 py-2 rounded-lg transition-colors`}
            >
              {isLoading ? '送信中...' : '送信'}
            </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}