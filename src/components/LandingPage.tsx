// src/pages/LandingPage.jsx
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, Users, Calendar, ChevronLeft, ChevronRight, 
  Stethoscope, Brain, Eye, Bone, Heart as HeartIcon, 
  Settings as Lungs, Plus, Phone, Mail 
} from 'lucide-react';
import sampleDoctors from '../data/sampleDoctors';

const LandingPage = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction) => {
    if (!scrollContainerRef.current) return;
    
    const scrollAmount = 300;
    const currentScroll = scrollContainerRef.current.scrollLeft;
    const targetScroll = direction === 'left' 
      ? currentScroll - scrollAmount 
      : currentScroll + scrollAmount;

    scrollContainerRef.current.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    sceneRef.current = new THREE.Scene();
    cameraRef.current = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    rendererRef.current = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);

    // Create floating spheres
    const spheres = [];
    const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const colors = [0x4f46e5, 0x06b6d4, 0x8b5cf6];

    for (let i = 0; i < 5; i++) {
      const material = new THREE.MeshPhongMaterial({
        color: colors[i % colors.length],
        shininess: 100,
      });
      const sphere = new THREE.Mesh(sphereGeometry, material);
      sphere.position.set(
        Math.random() * 10 - 5,
        Math.random() * 10 - 5,
        Math.random() * 10 - 15
      );
      scene.add(sphere);
      spheres.push(sphere);

      gsap.to(sphere.position, {
        y: `+=${Math.random() * 2 - 1}`,
        duration: 2 + Math.random() * 2,
        yoyo: true,
        repeat: -1,
        ease: "power1.inOut"
      });
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    camera.position.z = 5;

    const animate = () => {
      requestAnimationFrame(animate);
      spheres.forEach((sphere) => {
        sphere.rotation.x += 0.005;
        sphere.rotation.y += 0.005;
      });
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      scene.clear();
      renderer.dispose();
    };
  }, []);

  const getSpecialtyIcon = (specialty) => {
    switch (specialty.toLowerCase()) {
      case 'cardiology':
        return <HeartIcon className="w-6 h-6" />;
      case 'neurology':
        return <Brain className="w-6 h-6" />;
      case 'ophthalmology':
        return <Eye className="w-6 h-6" />;
      case 'orthopedics':
        return <Bone className="w-6 h-6" />;
      case 'pulmonology':
        return <Lungs className="w-6 h-6" />;
      default:
        return <Stethoscope className="w-6 h-6" />;
    }
  };

  return (
    <div className="relative min-h-screen">
      <div ref={containerRef} className="absolute inset-0 -z-10" />
      
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 
              className="text-5xl md:text-6xl font-bold text-white mb-8 opacity-0 transform translate-y-10"
              ref={(el) => {
                if (el) {
                  gsap.to(el, {
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    delay: 0.5,
                    ease: "power3.out"
                  });
                }
              }}
            >
              Healthcare Management System
            </h1>
            
            <p 
              className="text-xl text-white/80 mb-12 opacity-0"
              ref={(el) => {
                if (el) {
                  gsap.to(el, {
                    opacity: 1,
                    duration: 1,
                    delay: 0.8,
                    ease: "power3.out"
                  });
                }
              }}
            >
              Streamline your healthcare experience with our modern appointment system
            </p>

            <div className="flex justify-center gap-4 mb-16">
              <button
                onClick={() => navigate('/login')}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold transform hover:scale-105 transition-all duration-300 opacity-0"
                ref={(el) => {
                  if (el) {
                    gsap.to(el, {
                      opacity: 1,
                      duration: 1,
                      delay: 1,
                      ease: "power3.out"
                    });
                  }
                }}
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/register')}
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold border-2 border-blue-600 transform hover:scale-105 transition-all duration-300 opacity-0"
                ref={(el) => {
                  if (el) {
                    gsap.to(el, {
                      opacity: 1,
                      duration: 1,
                      delay: 1.2,
                      ease: "power3.out"
                    });
                  }
                }}
              >
                Register
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-24">
              {[
                {
                  icon: <Heart className="h-12 w-12 text-blue-600" />,
                  title: "Quality Care",
                  description: "Get access to the best healthcare professionals"
                },
                {
                  icon: <Calendar className="h-12 w-12 text-blue-600" />,
                  title: "Easy Scheduling",
                  description: "Book appointments with just a few clicks"
                },
                {
                  icon: <Users className="h-12 w-12 text-blue-600" />,
                  title: "Expert Doctors",
                  description: "Connect with specialized healthcare providers"
                }
              ].map((feature, index) => (
                <div
                  key={index}
                  className="bg-glass p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 opacity-0"
                  ref={(el) => {
                    if (el) {
                      gsap.to(el, {
                        opacity: 1,
                        duration: 1,
                        delay: 1.4 + index * 0.2,
                        ease: "power3.out"
                      });
                    }
                  }}
                >
                  <div className="flex justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
                  <p className="text-white/70">{feature.description}</p>
                </div>
              ))}
            </div>

            {/* Doctors Section */}
            <div className="relative max-w-7xl mx-auto px-4 mb-16">
              <h2 className="text-3xl font-bold text-white mb-8">Available Medical Professionals</h2>
              
              {/* Scroll Arrows */}
              {showLeftArrow && (
                <button
                  onClick={() => scroll('left')}
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/10 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white/20 transition-all duration-300"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
              )}
              {showRightArrow && (
                <button
                  onClick={() => scroll('right')}
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/10 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white/20 transition-all duration-300"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              )}

              {/* Doctors Cards Container */}
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex overflow-x-auto hide-scrollbar gap-6 pb-4 px-4 -mx-4"
                style={{
                  scrollSnapType: 'x mandatory',
                  scrollBehavior: 'smooth'
                }}
              >
                {sampleDoctors.map((doctor, index) => (
                  <div
                    key={index}
                    className="flex-none w-[300px] bg-glass rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-all duration-300"
                    style={{ scrollSnapAlign: 'start' }}
                  >
                    <div className="relative group">
                      <div className="w-[300px] h-[300px] overflow-hidden">
                        <img
                          src={doctor.profilePhotoUrl}
                          alt={doctor.name}
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <div className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-lg transform rotate-0 group-hover:rotate-180 transition-all duration-300">
                        {getSpecialtyIcon(doctor.specialization)}
                      </div>
                      <div className="absolute bottom-4 right-4 bg-green-500 px-3 py-1 rounded-full text-white text-sm">
                        Available
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-white mb-2">{doctor.name}</h3>
                      <p className="text-blue-300 font-medium mb-3">{doctor.specialization}</p>
                      <div className="space-y-2 text-white/70">
                        <p className="flex items-center">
                          <Phone className="w-4 h-4 mr-2" />
                          {doctor.phone}
                        </p>
                        <p className="flex items-center">
                          <Mail className="w-4 h-4 mr-2" />
                          {doctor.email}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* View All Doctors Button */}
                <div className="flex-none w-[300px] bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden flex items-center justify-center transform hover:scale-105 transition-all duration-300 cursor-pointer">
                  <div className="text-center p-6">
                    <div className="bg-white/10 p-4 rounded-full inline-block mb-4">
                      <Plus className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">View All Doctors</h3>
                    <p className="text-white/70">Explore our complete medical team</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
