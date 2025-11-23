
"use client";

import React, { useState, useRef, useEffect, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, User, Loader2, Smile } from "lucide-react"; // Changed MessageSquarePlus to Smile
import { generalFarmingChat, type Message as GenkitChatMessage } from "@/ai/flows/general-farming-chat-flow";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface DisplayMessage {
  id: string;
  role: "user" | "ai";
  content: string;
}

export function AiChatbotSheet() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
        // Auto-focus input when sheet opens
        setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e?: FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (inputValue.trim() === "" || isLoading) return;

    const userMessageContent = inputValue.trim();
    const newUserMessage: DisplayMessage = { id: Date.now().toString(), role: "user", content: userMessageContent };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInputValue("");
    setIsLoading(true);

    const genkitHistory: GenkitChatMessage[] = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    try {
      const response = await generalFarmingChat({
        userQuery: userMessageContent,
        chatHistory: genkitHistory,
      });
      const newAiMessage: DisplayMessage = { id: (Date.now() + 1).toString(), role: "ai", content: response.aiResponse };
      setMessages((prevMessages) => [...prevMessages, newAiMessage]);
    } catch (error) {
      console.error("Error calling AI chat flow:", error);
      const errorAiMessage: DisplayMessage = { id: (Date.now() + 1).toString(), role: "ai", content: "Sorry, I encountered an error processing your request. Please try again." };
      setMessages((prevMessages) => [...prevMessages, errorAiMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="fixed bottom-6 right-6 rounded-full shadow-lg h-14 px-4 bg-primary text-primary-foreground hover:bg-primary/90 z-50 flex items-center justify-center gap-2" // Adjusted className, removed size="icon"
        onClick={() => setIsOpen(true)}
        aria-label="Open AI Farming Advisor Chat"
      >
        <Smile className="w-6 h-6" /> 
        <span className="text-sm font-medium">Ask Me</span>
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="w-full sm:max-w-md flex flex-col p-0 bg-card text-card-foreground border-border shadow-xl" side="right">
          <SheetHeader className="p-4 border-b border-border">
            <SheetTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Bot className="text-primary h-6 w-6" /> AI Farming Advisor
            </SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              Ask any farming-related questions for Uganda.
            </SheetDescription>
          </SheetHeader>
          
          <ScrollArea className="flex-grow p-4 space-y-4" ref={scrollAreaRef}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start gap-3 w-full mb-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "ai" && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">AI</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-3.5 py-2.5 text-sm shadow-sm break-words",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-muted text-muted-foreground rounded-bl-none"
                  )}
                >
                  {message.content.split('\n').map((line, index, arr) => (
                      <React.Fragment key={index}>
                          {line}
                          {index < arr.length - 1 && <br />}
                      </React.Fragment>
                  ))}
                </div>
                {message.role === "user" && (
                  <Avatar className="h-8 w-8 shrink-0">
                     <AvatarFallback className="bg-accent text-accent-foreground"><User size={16}/></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3 justify-start w-full mb-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">AI</AvatarFallback>
                </Avatar>
                <div className="max-w-[80%] rounded-lg px-3.5 py-2.5 text-sm shadow-sm bg-muted text-muted-foreground rounded-bl-none">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              </div>
            )}
          </ScrollArea>
          
          <SheetFooter className="p-4 border-t border-border bg-card">
            <form
              onSubmit={handleSendMessage}
              className="flex w-full items-center space-x-2"
            >
              <Input
                ref={inputRef}
                type="text"
                placeholder="Type your farming question..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
                className="flex-1 h-10 text-base bg-background border-input ring-offset-background focus-visible:ring-ring"
                autoComplete="off"
              />
              <Button type="submit" size="icon" disabled={isLoading || inputValue.trim() === ""} className="h-10 w-10 bg-primary hover:bg-primary/90">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

