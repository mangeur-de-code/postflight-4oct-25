
import React, { useEffect, useState } from 'react';
import { User } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Plane, Upload, BarChart3, Settings, ArrowRight, CheckCircle, Users, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const FeatureCard = ({ icon: Icon, title, description, index }) =>
<motion.div
  initial={{ opacity: 0, y: 50 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.5, delay: index * 0.1 }}
  className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
  
    <div className="flex items-center gap-4 mb-4">
      <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center border border-blue-500/30">
        <Icon className="w-6 h-6 text-blue-400" />
      </div>
      <h3 className="text-xl font-bold text-white">{title}</h3>
    </div>
    <p className="text-slate-400">{description}</p>
  </motion.div>;


export default function HomePage() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        await User.me();
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const handleLogin = async () => {
    try {
      // Construct the full, absolute URL for the redirect after login.
      // This ensures the platform sends you back to your specific domain.
      const redirectUrl = `https://postflight.io/Dashboard`;
      await User.loginWithRedirect(redirectUrl);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleGoToDashboard = () => {
    // Try both approaches to see which works
    try {
      navigate('/Dashboard');
    } catch (error) {
      window.location.href = '/Dashboard';
    }
  };

  const features = [
  {
    icon: Upload,
    title: 'Effortless Logging',
    description: 'Log flights manually with an intuitive form or bulk import your entire history from a CSV file in seconds.'
  },
  {
    icon: Settings,
    title: 'Automated Tracking',
    description: 'Automatically track NG/NS currency, semi-annual requirements, and custom certifications. Never miss going out of currency again.'
  },
  {
    icon: BarChart3,
    title: 'Powerful Reporting',
    description: 'Visualize your flight data with interactive charts and generate detailed, exportable reports for any time period.'
  },
  {
    icon: Users,
    title: 'Organization Management',
    description: 'Manage squadron aircraft, track pilot hours across your organization, and streamline operational flight management.'
  }];


  if (isLoading) {
    return (
      <div className="bg-slate-900 text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>);

  }

  return (
    <div className="bg-slate-900 text-white min-h-screen">
      {/* Hero Section */}
      <div className="relative isolate overflow-hidden">
        <div
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1530563832499-467b2f82d7ad?q=80&w=2940&auto=format&fit=crop')" }}
          className="absolute inset-0 -z-10 h-full w-full object-cover bg-cover bg-center">
          
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
        </div>

        {/* Top Navigation Bar for Logged-in Users */}
        {isAuthenticated &&
        <div className="relative z-10 bg-black/20 backdrop-blur-sm border-b border-white/10">
            <div className="mx-auto max-w-7xl px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                    <Plane className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-white">PostFlight.io</span>
                </div>
                <Button
                onClick={handleGoToDashboard}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                
                  Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        }

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="mx-auto max-w-4xl px-6 py-24 sm:py-32 lg:px-8 text-center">
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex justify-center mb-6">
            
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30">
              <Plane className="w-8 h-8 text-white" />
            </div>
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            
            Intelligent Flight Logging for the Modern Pilot
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-6 text-lg leading-8 text-slate-300 max-w-2xl mx-auto">
            
            Track your hours, monitor your currency, and gain insights into your flying career with an effortless, automated logbook.
          </motion.p>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-10 flex items-center justify-center gap-x-6">
            
            {isAuthenticated ?
            <Button
              onClick={handleGoToDashboard}
              size="lg"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-6 text-lg shadow-lg hover:shadow-blue-500/40 transition-all duration-300">
              
                Go to Your Dashboard <ArrowRight className="w-5 h-5 ml-2" />
              </Button> :

            <Button
              onClick={handleLogin}
              size="lg"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-6 text-lg shadow-lg hover:shadow-blue-500/40 transition-all duration-300">
              
                <LogIn className="w-5 h-5 mr-2" />
                Login / Get Started
              </Button>
            }
          </motion.div>
        </motion.div>
      </div>

      {/* Features Section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-400">Everything You Need</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">in a comprehensive logbook for military and civilian professional aviators

            </p>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              From individual pilots to entire squadrons, our platform provides robust tools to handle every aspect of flight logging and compliance tracking.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              {features.map((feature, index) =>
              <FeatureCard key={feature.title} {...feature} index={index} />
              )}
            </dl>
          </div>
        </div>
      </div>
      
      {/* Final CTA */}
      <div className="pb-24 sm:pb-32">
        <div className="mx-auto max-w-2xl text-center px-6">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Ready to Take Control of Your Logbook?</h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-300">
            Join hundreds of pilots who trust PostFlight.io for accurate, automated, and stress-free log management.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            {isAuthenticated ?
            <Button
              onClick={handleGoToDashboard}
              size="lg"
              className="bg-white text-blue-600 font-semibold px-8 py-6 text-lg shadow-lg hover:bg-slate-200 transition-all duration-300">
              
                Back to Dashboard <ArrowRight className="w-5 h-5 ml-2" />
              </Button> :

            <Button
              onClick={handleLogin}
              size="lg"
              className="bg-white text-blue-600 font-semibold px-8 py-6 text-lg shadow-lg hover:bg-slate-200 transition-all duration-300">
              
                <LogIn className="w-5 h-5 mr-2" />
                Access Your Free Account
              </Button>
            }
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="flex justify-center space-x-6">
            <p className="text-slate-500">PostFLight.io - Your best aviation logbook</p>
          </div>
        </div>
      </footer>
    </div>);

}