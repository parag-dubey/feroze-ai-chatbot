import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// --- YEH LINE UPDATE KAREIN ---
import { Send, Mic, MicOff, ScreenShare, ScreenShareOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import avatarImage from "@/assets/feroze-avatar-new.jpg";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const ChatScreen = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const speakText = (text: string) => {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error("Error speaking text:", error);
      toast({
        title: "Voice Error",
        description: "Could not play AI voice.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        toast({
          title: "Error",
          description: "Failed to recognize speech. Please try again.",
          variant: "destructive",
        });
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [toast]);

  // --- YEH HAI SAHI AUR SINGLE handleSendMessage ---
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const token = localStorage.getItem("authToken");
    if (!token) {
      toast({
        title: "Authentication Error",
        description: "You are not logged in. Please login first.",
        variant: "destructive",
      });
      return;
    }

    const userMessage = inputValue.trim();
    setInputValue("");

    // Add user message immediately
    const newUserMessage: Message = { role: "user", content: userMessage };
    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    // --- YEH HAI NAYA LOGIC ---
    let screenshot: string | null = null;
    let endpoint = "http://localhost:8000/api/chat";
    let body: any = { question: userMessage };

    if (isScanning) {
      screenshot = captureScreenshot();
      if (screenshot) {
        // Agar scanning ON hai, toh endpoint aur body badal dein
        endpoint = "http://localhost:8000/api/consult"; // NAYA ENDPOINT
        body = { question: userMessage, screenshot: screenshot };
        
        toast({
          title: "Scanning...",
          description: "Sending question and screenshot to AI.",
        });
      } else {
        console.warn("Screenshot failed, sending text only.");
      }
    }
    // --- NAYA LOGIC YAHAN KHATM ---

    try {
      // API call ab dynamic endpoint aur body ka istemaal karega
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Authentication failed. Please login again.");
        }
        throw new Error("Failed to get response from AI");
      }

      const data = await response.json();
      const aiResponseText = data.answer || "I'm sorry, I couldn't process that request.";

      // Jawab ko bolkar sunayein
      speakText(aiResponseText);
      
      // Jawab ko chat mein add karein
      const aiMessage: Message = { 
        role: "assistant", 
        content: aiResponseText 
      };
      setMessages((prev) => [...prev, aiMessage]);

    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to get response.",
        variant: "destructive",
      });
      
      const errorMessage: Message = {
        role: "assistant",
        content: `I apologize, but I encountered an error: ${error.message}`
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      recognitionRef.current.start();
    }
   };

  const toggleScreenScan = async () => {
    if (isScanning) {
      // Scan Stop karein
      mediaStream?.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
      setIsScanning(false);
      if (videoRef.current) {
          videoRef.current.srcObject = null;
      }
      toast({
        title: "Screen Scan Stopped",
        description: "You have stopped sharing your screen.",
      });
    } else {
      // Scan Start karein
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        
        setMediaStream(stream);
        setIsScanning(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        stream.getVideoTracks()[0].onended = () => {
          toggleScreenScan();
        };

      } catch (err) {
        console.error("Error starting screen share:", err);
        toast({
          title: "Screen Share Error",
          description: "Permission denied or an error occurred.",
          variant: "destructive",
        });
      }
    }
  };

  // --- YEH NAYA FUNCTION HAI ---
   const captureScreenshot = (): string | null => {
    if (!videoRef.current || !isScanning) return null;

    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Chhoti file size ke liye JPEG, quality 0.7 use karein
      const base64Image = canvas.toDataURL("image/jpeg", 0.7);
      return base64Image;

    } catch (err) {
      console.error("Error capturing screenshot:", err);
      toast({
        title: "Screenshot Error",
        description: "Could not capture screen.",
        variant: "destructive",
      });
      return null;
    }
  };

  return (
    <div className="relative flex h-screen flex-col overflow-hidden animate-fade-in">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(210,100%,65%)] via-[hsl(200,100%,75%)] to-[hsl(195,100%,85%)]">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/30 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "0s" }}></div>
        <div className="absolute top-20 right-10 w-80 h-80 bg-[hsl(50,100%,95%)]/40 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "1s" }}></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-white/40 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "2s" }}></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[hsl(200,100%,90%)]/30 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "0.5s" }}></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-32 bg-white/20 rounded-full blur-2xl animate-pulse-slow" style={{ animationDelay: "1.5s" }}></div>
        <div className="absolute bottom-1/3 right-1/3 w-56 h-28 bg-white/25 rounded-full blur-2xl animate-pulse-slow" style={{ animationDelay: "2.5s" }}></div>
      </div>

      {/* Header */}
      <div className="relative border-b border-white/30 bg-white/80 backdrop-blur-md px-4 py-3 shadow-soft z-10">
        <div className="flex items-center gap-3">
          <img
            src={avatarImage}
            alt="Feroze Azeez"
            className="h-10 w-10 rounded-full border-2 border-primary/20 object-cover"
          />
          <div>
            <h2 className="font-semibold text-foreground">Feroze Azeez AI</h2>
            <p className="text-xs text-muted-foreground">Financial Advisor</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="relative flex-1 overflow-y-auto px-4 py-6 z-10">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center animate-fade-in">
              <p className="text-muted-foreground">
                Hello! I'm Feroze Azeez AI. How can I help you with your financial questions today?
              </p>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-4 flex animate-slide-up ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role === "assistant" && (
              <img
                src={avatarImage}
                alt="AI"
                className="mr-2 h-8 w-8 rounded-full object-cover"
              />
            )}
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-soft ${
                message.role === "user"
                  ? "bg-white text-[hsl(220,15%,15%)]"
                  : "bg-[hsl(220,13%,95%)] text-[hsl(220,15%,15%)] border border-white/50"
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="mb-4 flex justify-start animate-fade-in">
            <img
              src={avatarImage}
              alt="AI"
              className="mr-2 h-8 w-8 rounded-full object-cover"
            />
            <div className="max-w-[70%] rounded-2xl border border-white/50 bg-[hsl(220,13%,95%)] px-4 py-2 shadow-soft">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 animate-pulse-slow rounded-full bg-primary"></div>
                <div className="h-2 w-2 animate-pulse-slow rounded-full bg-primary" style={{ animationDelay: "0.2s" }}></div>
                <div className="h-2 w-2 animate-pulse-slow rounded-full bg-primary" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="relative border-t border-white/30 bg-white/80 backdrop-blur-md px-4 py-4 shadow-soft z-10">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type or speak your financial question..."
            disabled={isLoading || isRecording}
            className="bg-white/90 text-[hsl(220,15%,15%)] placeholder:text-[hsl(220,15%,45%)] transition-all focus:shadow-elegant"
          />
          <Button
            onClick={toggleRecording}
            disabled={isLoading}
            size="icon"
            className={`transition-all duration-300 ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : 'bg-white hover:bg-gray-100'
            }`}
          >
            {isRecording ? (
              <MicOff className="h-4 w-4 text-white" />
            ) : (
              <Mic className="h-4 w-4 text-gray-700" />
            )}
          </Button>


          {/* --- YEH NAYA "SCAN" BUTTON ADD KAREIN --- */}
          <Button
            onClick={toggleScreenScan}
            disabled={isLoading}
            size="icon"
            variant={isScanning ? "destructive" : "outline"}
            className="bg-white hover:bg-gray-100"
          >
            {isScanning ? (
              <ScreenShareOff className="h-4 w-4 text-red-500" />
             ) : (
              <ScreenShare className="h-4 w-4 text-gray-700" />
            )}
          </Button>




          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
            className="transition-all duration-300 hover:scale-105"
            style={{ 
              background: 'linear-gradient(135deg, hsl(200 95% 45%) 0%, hsl(195 85% 55%) 100%)',
              color: 'white'
            }}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <video ref={videoRef} autoPlay style={{ display: "none" }} />

      </div>
    </div>
  );
};

export default ChatScreen;