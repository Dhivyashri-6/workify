import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiCheck, FiUsers, FiBarChart2, FiClock, FiAward, FiGlobe, FiTarget, FiShield } from 'react-icons/fi';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    { 
      icon: <FiClock size={32} />,
      title: 'Leave Management', 
      description: 'Streamlined leave application with multi-level approval workflow and real-time status tracking' 
    },
    { 
      icon: <FiAward size={32} />,
      title: 'Holiday Calendar', 
      description: 'Centralized company-wide holiday and event management system' 
    },
    { 
      icon: <FiUsers size={32} />,
      title: 'Employee Profiles', 
      description: 'Comprehensive personnel information, team management, and organizational hierarchy' 
    },
    { 
      icon: <FiBarChart2 size={32} />,
      title: 'Analytics & Reports', 
      description: 'Detailed insights, leave analytics, and HR reporting for strategic decision making' 
    },
  ];

  const benefits = [
    { icon: <FiShield size={24} />, title: 'Secure & Reliable', desc: 'Enterprise-grade security for your data' },
    { icon: <FiGlobe size={24} />, title: 'Global Standard', desc: 'International best practices' },
    { icon: <FiTarget size={24} />, title: 'Mission Driven', desc: 'Focused on protecting your business' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary">WORKIFY</h1>
            <p className="text-xs text-gray-600">Enterprise HRMS Solution</p>
          </div>
          <button
            onClick={() => navigate('/signin')}
            className="px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-blue-700 transition-all"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-white to-blue-50 py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block bg-blue-100 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
                By Qantler Technologies
              </div>
              <h2 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Enterprise HRMS<br/>
                <span className="text-primary">You Dream. We Deliver.</span>
              </h2>
              <p className="text-lg text-gray-700 mb-4 font-medium">
                WORKIFY is a comprehensive Human Resource Management System that streamlines your entire HR operations.
              </p>
              <p className="text-gray-600 mb-8">
                Trusted by leading organizations, WORKIFY simplifies leave management, enhances employee engagement, and provides actionable insights for strategic HR decisions. Built with enterprise-grade security and international best practices.
              </p>
              <button
                onClick={() => navigate('/signin')}
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl text-lg"
              >
                Access WORKIFY <FiArrowRight size={22} />
              </button>
            </div>
            <div className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-12 h-96 flex items-center justify-center">
              <div className="text-center">
                <img 
                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%2300d4ff;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%230088ff;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='120' font-weight='bold' fill='url(%23grad)' opacity='0.9'%3EQ%3C/text%3E%3Ccircle cx='100' cy='100' r='95' fill='none' stroke='url(%23grad)' stroke-width='2' opacity='0.3'/%3E%3C/svg%3E" 
                  alt="Qantler Logo"
                  className="w-48 h-48 mb-4 opacity-90"
                />
                <p className="text-2xl font-bold text-white mt-4">Qantler Technologies</p>
                <p className="text-sm text-gray-300 mt-2">Strategic IT Solutions</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-20 bg-gradient-to-r from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-4xl font-bold text-gray-900 mb-6">Our Mission</h3>
              <p className="text-xl text-gray-700 mb-6 font-semibold text-primary">
                "To protect your businesses & much more"
              </p>
              <p className="text-gray-600 mb-4">
                At Qantler Technologies, we focus on doing it right even in the smallest details. This commitment makes our relationships successful and our solutions trustworthy.
              </p>
              <p className="text-gray-600 mb-6">
                WORKIFY embodies this philosophy by providing a refreshingly unique HR platform that combines well-known development methods with a customized approach for each organization.
              </p>
              <div className="space-y-3">
                {benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="text-primary mt-1">{benefit.icon}</div>
                    <div>
                      <h4 className="font-bold text-gray-900">{benefit.title}</h4>
                      <p className="text-gray-600 text-sm">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-blue-50 rounded-2xl p-8 border-l-4 border-primary">
              <h4 className="text-2xl font-bold text-gray-900 mb-6">Why Choose WORKIFY?</h4>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <FiCheck className="text-primary mt-1 flex-shrink-0 font-bold" size={24} />
                  <div>
                    <p className="font-semibold text-gray-900">Complete Leave Management</p>
                    <p className="text-sm text-gray-600">Multi-level approvals, balance tracking, and workflow automation</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FiCheck className="text-primary mt-1 flex-shrink-0 font-bold" size={24} />
                  <div>
                    <p className="font-semibold text-gray-900">Real-time Analytics</p>
                    <p className="text-sm text-gray-600">Comprehensive reports and insights for better decision making</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FiCheck className="text-primary mt-1 flex-shrink-0 font-bold" size={24} />
                  <div>
                    <p className="font-semibold text-gray-900">Enterprise Security</p>
                    <p className="text-sm text-gray-600">Bank-grade encryption and compliance standards</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FiCheck className="text-primary mt-1 flex-shrink-0 font-bold" size={24} />
                  <div>
                    <p className="font-semibold text-gray-900">Easy Integration</p>
                    <p className="text-sm text-gray-600">Seamless integration with existing HR systems</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">Powerful Features</h3>
            <p className="text-xl text-gray-600">Everything you need to manage your workforce efficiently and effectively</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-all border border-gray-100 hover:border-primary">
                <div className="text-primary mb-4">
                  {feature.icon}
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h4>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* About Qantler Section */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">About Qantler Technologies</h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Strategic consulting tailored to every business</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 border-t-4 border-primary">
              <h4 className="text-2xl font-bold text-gray-900 mb-4">🌍 Global Presence</h4>
              <p className="text-gray-700">With offices in India (Chennai, Tiruchirappalli, Namakkal, Tirunelveli), Singapore, and USA, we serve clients worldwide with international expertise.</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 border-t-4 border-primary">
              <h4 className="text-2xl font-bold text-gray-900 mb-4">💡 Specialized Services</h4>
              <p className="text-gray-700">Expert in Low Code/No Code platforms, strategic consulting, and custom application development since 2010.</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 border-t-4 border-primary">
              <h4 className="text-2xl font-bold text-gray-900 mb-4">🎯 Proven Track Record</h4>
              <p className="text-gray-700">Trusted by leading organizations for delivering customized solutions that drive digital transformation and business growth.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-primary to-blue-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-4xl font-bold mb-4">Ready to Transform Your HR Operations?</h3>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">Join organizations worldwide that trust WORKIFY for comprehensive, secure, and reliable HR management.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/signin')}
              className="px-8 py-3 bg-white text-primary font-bold rounded-lg hover:bg-blue-50 transition-all"
            >
              Access WORKIFY
            </button>
            <a
              href="https://qantler.com/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-primary transition-all"
            >
              Contact Qantler
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4 text-lg">WORKIFY</h4>
              <p className="text-gray-400 text-sm">Enterprise HRMS by Qantler Technologies</p>
              <p className="text-gray-500 text-xs mt-2">© 2024 Qantler Technologies. All rights reserved.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Features</h4>
              <ul className="text-gray-400 space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Leave Management</a></li>
                <li><a href="#" className="hover:text-white transition">Employee Profiles</a></li>
                <li><a href="#" className="hover:text-white transition">Reports</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="text-gray-400 space-y-2 text-sm">
                <li><a href="https://qantler.com/about-us" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">About Qantler</a></li>
                <li><a href="https://qantler.com/contact" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">Contact</a></li>
                <li><a href="https://qantler.com/careers" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <p className="text-gray-400 text-sm">sales@qantler.com</p>
              <p className="text-gray-500 text-xs mt-4">Global offices in India, Singapore & USA</p>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
            <p>Crafted with precision by Qantler Technologies | Enterprise HRMS Solution</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
