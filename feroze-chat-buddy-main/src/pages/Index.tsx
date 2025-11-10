import { useState } from "react";
import WelcomeScreen from "@/components/WelcomeScreen";
import ChatScreen from "@/components/ChatScreen";

const Index = () => {
  const [chatStarted, setChatStarted] = useState(false);

  const handleStartChat = () => {
    setChatStarted(true);
  };

  return (
    <div className="h-screen overflow-hidden">
      {!chatStarted ? (
        <WelcomeScreen onStartChat={handleStartChat} />
      ) : (
        <ChatScreen />
      )}
    </div>
  );
};

export default Index;
