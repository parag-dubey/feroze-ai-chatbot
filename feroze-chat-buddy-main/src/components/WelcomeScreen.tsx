import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import avatarImage from "@/assets/feroze-avatar-new.jpg";

interface WelcomeScreenProps {
  onStartChat: () => void;
}

const WelcomeScreen = ({ onStartChat }: WelcomeScreenProps) => {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden animate-fade-in">
      {/* Login/Register Link */}
      <Link
        to="/auth"
        className="absolute top-6 right-6 z-20 text-white font-semibold text-lg px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 hover:bg-white/30 transition-all duration-300 hover:scale-105"
      >
        Login / Register
      </Link>

      {/* Akinator-style swirling background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(210,100%,65%)] via-[hsl(200,100%,75%)] to-[hsl(195,100%,85%)]">
        {/* Swirling abstract shapes */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/30 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "0s" }}></div>
        <div className="absolute top-20 right-10 w-80 h-80 bg-[hsl(50,100%,95%)]/40 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "1s" }}></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-white/40 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "2s" }}></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[hsl(200,100%,90%)]/30 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "0.5s" }}></div>
        
        {/* Cloud-like flowing shapes */}
        <div className="absolute top-1/4 left-1/4 w-64 h-32 bg-white/20 rounded-full blur-2xl animate-pulse-slow" style={{ animationDelay: "1.5s" }}></div>
        <div className="absolute bottom-1/3 right-1/3 w-56 h-28 bg-white/25 rounded-full blur-2xl animate-pulse-slow" style={{ animationDelay: "2.5s" }}></div>
      </div>

      {/* Main content */}
      <div className="relative w-full max-w-2xl px-6 text-center z-10">
        {/* Avatar with 3D floating effect */}
        <div className="mb-12 inline-block animate-scale-in">
          <div className="relative">
            {/* Shadow underneath for 3D lift effect */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-48 h-8 bg-black/20 rounded-full blur-xl"></div>
            
            {/* Glow effect behind avatar */}
            <div className="absolute inset-0 animate-pulse-slow rounded-full bg-white/40 blur-3xl scale-110"></div>
            
            {/* Avatar */}
            <img
              src={avatarImage}
              alt="Feroze Azeez AI Avatar"
              className="relative mx-auto h-56 w-56 rounded-full border-8 border-white/50 object-cover transition-transform hover:scale-105 duration-300"
              style={{ 
                filter: 'drop-shadow(0 30px 60px rgba(0, 0, 0, 0.3))',
              }}
            />
          </div>
        </div>

        {/* Title with Akinator-style text effects */}
        <h1 
          className="mb-4 text-6xl font-extrabold animate-slide-up"
          style={{ 
            background: 'linear-gradient(180deg, hsl(200 95% 25%) 0%, hsl(195 85% 35%) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            animationDelay: "0.1s"
          }}
        >
          Feroze Azeez
        </h1>
        
        <p 
          className="mb-3 text-2xl font-bold animate-slide-up"
          style={{ 
            background: 'linear-gradient(180deg, hsl(200 95% 30%) 0%, hsl(195 85% 40%) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animationDelay: "0.2s"
          }}
        >
          AI Financial Avatar
        </p>
        
        <p 
          className="mb-10 text-lg text-[hsl(220,50%,30%)] font-medium animate-slide-up" 
          style={{ animationDelay: "0.3s" }}
        >
          Your intelligent financial advisor, available 24/7
        </p>

        {/* Prominent button with gradient and texture */}
        <Button
          onClick={onStartChat}
          size="lg"
          className="animate-slide-up text-lg px-12 py-6 h-auto rounded-full font-bold text-white border-4 border-white/30 transition-all duration-300 hover:scale-110 hover:border-white/50"
          style={{ 
            background: 'linear-gradient(135deg, hsl(200 95% 45%) 0%, hsl(195 85% 55%) 100%)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
            animationDelay: "0.4s"
          }}
        >
          Start Chat
        </Button>
      </div>
    </div>
  );
};

export default WelcomeScreen;
