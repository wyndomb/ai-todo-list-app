"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Chrome, Sparkles, CheckCircle2, Calendar, BarChart3, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Check if supabase client is available
    if (!supabase) {
      console.warn('Supabase client not initialized. Please check your environment variables.');
      return;
    }

    // Create a non-null reference for TypeScript
    const currentSupabase = supabase;

    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await currentSupabase.auth.getSession();
      if (session) {
        router.push('/');
      }
    };

    checkUser();

    // Listen for auth state changes
    const { data: authListener } = currentSupabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // User is logged in, redirect to dashboard
          router.push('/');
          toast({
            title: "Welcome back! 🎉",
            description: "You have successfully logged in.",
          });
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router, toast]);

  const handleGoogleSignIn = async () => {
    if (!supabase) {
      toast({
        title: "Configuration Error",
        description: "Supabase is not properly configured. Please check your environment variables.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error("Error signing in with Google:", error);
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Unexpected error during Google sign-in:", err);
      toast({
        title: "An unexpected error occurred",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  // Show configuration warning if Supabase is not available
  if (!supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="w-full max-w-md px-6">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Configuration Required
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Supabase environment variables are not configured. Please set up your environment variables to continue.
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Required environment variables:
              </p>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <li>• NEXT_PUBLIC_SUPABASE_URL</li>
                <li>• NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md px-6">
        {/* Main Login Card */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 p-8 text-center">
          {/* Logo and Title */}
          <div className="mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Welcome to AI Todo
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Your intelligent productivity companion
            </p>
          </div>

          {/* Features Preview */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Smart Tasks</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Calendar</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mx-auto mb-2">
                <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Analytics</p>
            </div>
          </div>

          {/* Sign In Button */}
          <Button
            onClick={handleGoogleSignIn}
            className="w-full py-4 text-lg flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
          >
            <Chrome className="h-6 w-6" />
            Continue with Google
          </Button>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            Secure authentication powered by Supabase
          </p>
        </div>

        {/* Features List */}
        <div className="mt-8 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 text-center">
            What you'll get:
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                AI-powered task suggestions and insights
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Smart calendar integration and scheduling
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Productivity analytics and progress tracking
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Cross-device sync and real-time updates
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}