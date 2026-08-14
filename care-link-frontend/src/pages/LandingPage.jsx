import React from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-green-50">
            {/* Navigation */}
            <nav className="bg-white shadow-soft sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <Logo size="lg" textClassName="text-2xl text-healthcare-dark" />
                        <div className="flex gap-4">
                            <button
                                onClick={() => navigate('/auth?mode=login')}
                                className="px-6 py-3 text-healthcare-primary font-semibold hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => navigate('/auth?mode=register')}
                                className="btn-primary"
                            >
                                Get Started
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
                <div className="text-center">
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-healthcare-dark mb-6 leading-tight">
                        Empowering Elder Care<br />
                        <span className="text-healthcare-primary">Through Intelligent Technology</span>
                    </h1>
                    <p className="text-2xl md:text-3xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
                        A comprehensive healthcare platform connecting elders, families, and healthcare providers
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
                        <button
                            onClick={() => navigate('/auth?mode=register')}
                            className="btn-primary w-full sm:w-auto text-xl px-12 py-5"
                        >
                            Create Free Account
                        </button>
                        <button
                            onClick={() => navigate('/auth?mode=login')}
                            className="btn-secondary w-full sm:w-auto text-xl px-12 py-5"
                        >
                            Learn More
                        </button>
                    </div>
                </div>
            </section>

            {/* What is Care Link AI */}
            <section className="bg-white py-20 md:py-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="section-title">What is Care Link AI?</h2>
                        <p className="section-subtitle">
                            A revolutionary platform designed to bridge the gap between elders and modern healthcare
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: "🤖",
                                title: "AI-Powered Monitoring",
                                description: "Advanced algorithms continuously monitor health metrics and provide real-time insights for better care decisions."
                            },
                            {
                                icon: "👴",
                                title: "Elder-Friendly Interface",
                                description: "Large text, simple navigation, and voice commands designed specifically for seniors' comfort and ease."
                            },
                            {
                                icon: "👨‍👩‍👧‍👦",
                                title: "Family Collaboration",
                                description: "Keep families connected with updates, medication reminders, and instant health notifications."
                            },
                            {
                                icon: "⚕️",
                                title: "Doctor Integration",
                                description: "Seamless connection with healthcare providers for virtual consultations and medical records."
                            },
                            {
                                icon: "📊",
                                title: "Health Analytics",
                                description: "Visual dashboards with health trends, predictive analytics, and personalized recommendations."
                            },
                            {
                                icon: "🔒",
                                title: "Secure & Private",
                                description: "Bank-level encryption and HIPAA-compliant protection to keep medical information safe."
                            }
                        ].map((feature, index) => (
                            <div
                                key={index}
                                className="card group hover:border-2 hover:border-healthcare-primary transition-all"
                            >
                                <div className="text-6xl mb-6">{feature.icon}</div>
                                <h3 className="text-2xl font-bold text-healthcare-dark mb-4">{feature.title}</h3>
                                <p className="text-lg text-gray-600 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Key Benefits */}
            <section className="py-20 md:py-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="section-title">Why Choose Care Link AI?</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        <div className="text-center">
                            <div className="bg-blue-100 rounded-3xl p-12 mb-6">
                                <div className="text-7xl mb-4">👴</div>
                                <h3 className="text-3xl font-bold text-healthcare-dark">Elder-Friendly</h3>
                            </div>
                            <p className="text-lg text-gray-700 leading-relaxed">
                                Large buttons, clear text, voice assistance, and simplified navigation make technology accessible for all ages.
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="bg-green-100 rounded-3xl p-12 mb-6">
                                <div className="text-7xl mb-4">🤖</div>
                                <h3 className="text-3xl font-bold text-healthcare-dark">AI-Powered</h3>
                            </div>
                            <p className="text-lg text-gray-700 leading-relaxed">
                                Intelligent monitoring, pattern recognition, and predictive analytics provide 24/7 health insights.
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="bg-purple-100 rounded-3xl p-12 mb-6">
                                <div className="text-7xl mb-4">👨‍👩‍👧‍👦</div>
                                <h3 className="text-3xl font-bold text-healthcare-dark">Family Mode</h3>
                            </div>
                            <p className="text-lg text-gray-700 leading-relaxed">
                                Keep everyone informed and connected throughout the entire care journey.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-healthcare-primary py-20 md:py-32">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Ready to Transform Elder Care?
                    </h2>
                    <p className="text-xl md:text-2xl text-blue-100 mb-10">
                        Join thousands of families who trust Care Link AI for compassionate healthcare management
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => navigate('/auth?mode=register')}
                            className="px-12 py-5 bg-white text-healthcare-primary text-xl font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg w-full sm:w-auto"
                        >
                            Create Account
                        </button>
                        <button
                            onClick={() => navigate('/auth?mode=login')}
                            className="px-12 py-5 bg-blue-700 text-white text-xl font-semibold rounded-lg border-2 border-white hover:bg-blue-800 transition-colors w-full sm:w-auto"
                        >
                            Sign In
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-healthcare-dark py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                        <div>
                            <div className="mb-4">
                                <Logo size="md" textClassName="text-xl text-white" />
                            </div>
                            <p className="text-gray-400 text-base leading-relaxed">
                                Empowering elder care through intelligent technology.
                                Connecting elders, families, and healthcare providers.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold text-lg mb-4">Platform</h4>
                            <ul className="space-y-2.5 text-gray-400">
                                <li>
                                    <button onClick={() => navigate('/auth?mode=register')} className="hover:text-white transition-colors text-left">
                                        Get Started
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => navigate('/auth?mode=login')} className="hover:text-white transition-colors text-left">
                                        Sign In
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white transition-colors text-left">
                                        Back to Top
                                    </button>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold text-lg mb-4">Features</h4>
                            <ul className="space-y-2.5 text-gray-400">
                                <li>
                                    <button onClick={() => navigate('/auth?mode=register')} className="hover:text-white transition-colors text-left">
                                        AI Health Assistant
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => navigate('/auth?mode=register')} className="hover:text-white transition-colors text-left">
                                        Medication Tracker
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => navigate('/auth?mode=register')} className="hover:text-white transition-colors text-left">
                                        SOS Emergency
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-700 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <p className="text-gray-400 text-sm">
                            © {new Date().getFullYear()} Care Link AI. All rights reserved.
                        </p>
                        <p className="text-gray-500 text-xs">
                            Built with ❤️ for better elder care
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
