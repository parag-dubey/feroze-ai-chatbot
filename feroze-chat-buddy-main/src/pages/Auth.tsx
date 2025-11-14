import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
// import { supabase } from "@/integrations/supabase/client";
import avatarImage from "@/assets/feroze-avatar-new.jpg";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
  
    

    // Backend URL set karein
    const url = isLogin 
      ? "http://localhost:8000/login"
      : "http://localhost:8000/register";
    
    // Backend ko bheja jaane wala data
    const body = isLogin
      ? { Email: email, Password: password }
      // (Ensure karein ki aapka main.py 'Name' accept karta hai)
      : { Name: name, Email: email, Password: password }; 

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        // Backend se error message dikhayein (jaise "User already exists")
        throw new Error(data.detail || "Something went wrong");
      }

      // --- YEH HAI SABSE ZAROORI FIX ---
      if (isLogin && data.token) {
        // Login successful, TOKEN KO SAVE KAREIN
        localStorage.setItem("authToken", data.token);
        
        toast({
          title: "Success",
          description: "Logged in successfully!",
        });
        // Chat page par redirect karein
        navigate("/chat"); // (Aapka chat page ka route)

      } else {
        // Registration successful
        toast({
          title: "Success",
          description: "Account created! Please login.",
        });
        // User ko login tab par bhej dein
        setIsLogin(true);
      }

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };




  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Same Akinator-style background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(210,100%,65%)] via-[hsl(200,100%,75%)] to-[hsl(195,100%,85%)]">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/30 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "0s" }}></div>
        <div className="absolute top-20 right-10 w-80 h-80 bg-[hsl(50,100%,95%)]/40 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "1s" }}></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-white/40 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "2s" }}></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[hsl(200,100%,90%)]/30 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "0.5s" }}></div>
      </div>

      {/* Auth Form */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-elegant p-8 border-4 border-white/50">
          {/* Avatar */}
          <div className="mb-6 text-center">
            <img
              src={avatarImage}
              alt="Feroze Azeez"
              className="mx-auto h-24 w-24 rounded-full border-4 border-white/50 object-cover"
            />
            <h2 className="mt-4 text-3xl font-bold text-[hsl(200,95%,30%)]">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            
            {!isLogin && (
              <div>
                <Label htmlFor="name" className="text-[hsl(220,15%,15%)]">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-white/90 text-[hsl(220,15%,15%)]"
                  placeholder="Your Name"
                />
              </div>
            )}


            <div>
              <Label htmlFor="email" className="text-[hsl(220,15%,15%)]">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/90 text-[hsl(220,15%,15%)]"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-[hsl(220,15%,15%)]">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/90 text-[hsl(220,15%,15%)]"
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full text-lg py-6 h-auto rounded-full font-bold text-white border-4 border-white/30 transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, hsl(200 95% 45%) 0%, hsl(195 85% 55%) 100%)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
              }}
            >
              {loading ? "Please wait..." : isLogin ? "Login" : "Sign Up"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[hsl(200,95%,35%)] hover:underline font-medium"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
            </button>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => navigate("/")}
              className="text-[hsl(220,15%,45%)] hover:underline text-sm"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
