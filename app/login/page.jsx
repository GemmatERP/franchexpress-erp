'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { KeyRound, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all credentials.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const loggedUser = await login(email, password);
      toast('Sign-in successful. Welcome back!', 'success');
      
      // Delay slightly to let AuthContext capture cookies before redirect
      setTimeout(async () => {
        // Query current role from cookie directly
        const match = document.cookie.match(new RegExp('(^| )fe_role=([^;]*Custom|[^;]*)'));
        const activeRole = match ? match[2] : 'employee';
        
        if (activeRole === 'delivery') {
          router.replace('/dashboard/delivery');
        } else {
          router.replace('/dashboard');
        }
      }, 350);
    } catch (err) {
      console.error(err);
      let errMsg = 'Invalid email or password.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errMsg = 'Incorrect email or password.';
      } else if (err.code === 'auth/invalid-email') {
        errMsg = 'Invalid email address format.';
      }
      setError(errMsg);
      toast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-fe-bg" id="main-content">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <Card hoverEffect={false} className="border border-fe-muted/40 shadow-xl bg-white p-8 rounded-xl flex flex-col items-center">
          {/* Logo */}
          <img 
            src="/Logo-GM-FE.png" 
            alt="FranchExpress Logo" 
            className="h-24 w-auto object-contain mb-4 shrink-0" 
          />
          <p className="text-xs text-fe-gray font-sans mt-1">
            Access your courier management workspace
          </p>



          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full mt-8 space-y-4">
            {error && (
              <div 
                className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-700 text-center font-sans animate-shake"
                role="alert"
              >
                {error}
              </div>
            )}

            <div className="relative">
              <Input
                label="Email Address"
                type="email"
                placeholder="consignee@fe.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
                inputClassName="pl-10"
              />
              <Mail className="absolute left-3.5 bottom-3.5 h-4 w-4 text-fe-gray" />
            </div>

            <div className="relative">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full"
                inputClassName="pl-10"
              />
              <KeyRound className="absolute left-3.5 bottom-3.5 h-4 w-4 text-fe-gray" />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                loading={loading}
                className="w-full flex items-center justify-center gap-1.5"
              >
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </main>
  );
}
