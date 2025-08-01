        // Space Background Animation
        class SpaceBackground {
            constructor() {
                this.canvas = document.getElementById('space-canvas');
                this.ctx = this.canvas.getContext('2d');
                this.stars = [];
                this.numStars = 150;
                this.animationId = null;
                
                this.init();
                this.createStars();
                this.animate();
                
                window.addEventListener('resize', () => this.handleResize());
            }
            
            init() {
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight;
            }
            
            createStars() {
                this.stars = [];
                for (let i = 0; i < this.numStars; i++) {
                    this.stars.push({
                        x: Math.random() * this.canvas.width,
                        y: Math.random() * this.canvas.height,
                        z: Math.random() * 1000,
                        opacity: Math.random(),
                        twinkleSpeed: 0.01 + Math.random() * 0.02
                    });
                }
            }
            
            animate() {
                this.ctx.fillStyle = 'rgba(10, 10, 10, 0.1)';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                
                this.stars.forEach(star => {
                    // Update star properties
                    star.z -= 2;
                    if (star.z <= 0) {
                        star.z = 1000;
                        star.x = Math.random() * this.canvas.width;
                        star.y = Math.random() * this.canvas.height;
                    }
                    
                    // Update twinkle
                    star.opacity += Math.sin(Date.now() * star.twinkleSpeed) * 0.02;
                    star.opacity = Math.max(0.1, Math.min(1, star.opacity));
                    
                    // Calculate position
                    const x = (star.x - this.canvas.width / 2) * (1000 / star.z) + this.canvas.width / 2;
                    const y = (star.y - this.canvas.height / 2) * (1000 / star.z) + this.canvas.height / 2;
                    
                    // Calculate size based on distance
                    const size = (1 - star.z / 1000) * 2;
                    
                    // Draw star
                    this.ctx.fillStyle = `rgba(52, 135, 220, ${star.opacity})`;
                    this.ctx.shadowColor = 'rgba(100, 255, 218, 0.5)';
                    this.ctx.shadowBlur = size * 2;
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, size, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.shadowBlur = 0;
                    
                    // Draw trail for moving stars
                    if (star.z < 500) {
                        const trailLength = (500 - star.z) / 50;
                        this.ctx.strokeStyle = `rgba(52, 135, 220, ${star.opacity * 0.3})`;
                        this.ctx.lineWidth = size / 2;
                        this.ctx.beginPath();
                        this.ctx.moveTo(x, y);
                        this.ctx.lineTo(x - trailLength, y);
                        this.ctx.stroke();
                    }
                });
                
                this.animationId = requestAnimationFrame(() => this.animate());
            }
            
            handleResize() {
                this.init();
                this.createStars();
            }
        }
        
        // Typing Effect
        class TypingEffect {
            constructor(element, text, speed = 100) {
                this.element = document.getElementById(element);
                this.text = text;
                this.speed = speed;
                this.currentIndex = 0;
                
                this.type();
            }
            
            type() {
                if (this.currentIndex < this.text.length) {
                    this.element.textContent = this.text.slice(0, this.currentIndex + 1);
                    this.currentIndex++;
                    setTimeout(() => this.type(), this.speed);
                }
            }
        }
        
        // Smooth Scroll
        function scrollToSection(sectionId) {
            const element = document.getElementById(sectionId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
        
        
        // Intersection Observer for Animations
        function setupIntersectionObserver() {
            const options = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-fadeInUp');
                    }
                });
            }, options);
            
            // Observe all sections
            document.querySelectorAll('.section').forEach(section => {
                section.classList.add('hidden');
                observer.observe(section);
            });
            
            // Observe individual cards
            document.querySelectorAll('.card').forEach(card => {
                observer.observe(card);
            });
        }
        
        // Initialize everything when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            // Initialize space background
            new SpaceBackground();
            
            // Initialize typing effect
            new TypingEffect('typing-text', 'Powering Digital Possibilities.', 100);
            
            
            // Set up intersection observer
            setupIntersectionObserver();
            
            // Add hover effects to cards
            document.querySelectorAll('.card').forEach(card => {
                card.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-10px) scale(1.02)';
                });
                
                card.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0) scale(1)';
                });
            }); 
            
            // Add click effects to buttons
            document.querySelectorAll('.btn').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    // Create ripple effect
                    const ripple = document.createElement('span');
                    const rect = this.getBoundingClientRect();
                    const size = Math.max(rect.width, rect.height);
                    const x = e.clientX - rect.left - size / 2;
                    const y = e.clientY - rect.top - size / 2;
                    
                    ripple.style.cssText = `
                        position: absolute;
                        border-radius: 50%;
                        background: rgba(255, 255, 255, 0.3);
                        width: ${size}px;
                        height: ${size}px;
                        left: ${x}px;
                        top: ${y}px;
                        animation: ripple 0.6s ease-out;
                        pointer-events: none;
                    `;
                    
                    this.appendChild(ripple);
                    
                    setTimeout(() => {
                        ripple.remove();
                    }, 600);
                });
            });
        });
        
        // Add ripple keyframes
        const style = document.createElement('style');
        style.textContent = `
            @keyframes ripple {
                0% {
                    transform: scale(0);
                    opacity: 1;
                }
                100% {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);

        // Hamburger menu toggle for mobile nav
        function toggleNavMenu() {
            const navLinks = document.querySelector('.nav-links');
            navLinks.classList.toggle('active');
        }
        // Close hamburger menu when clicking outside
        document.addEventListener('click', function(event) {
            const navLinks = document.querySelector('.nav-links');
            const hamburger = document.getElementById('nav-hamburger');
            // Only proceed if menu is open
            if (navLinks.classList.contains('active')) {
                // If click is NOT inside menu or hamburger, close menu
                if (!navLinks.contains(event.target) && !hamburger.contains(event.target)) {
                    navLinks.classList.remove('active');
                }
            }
        });
        // Close hamburger menu when a nav link is clicked (for better UX)
        document.addEventListener('DOMContentLoaded', function() {
            document.querySelectorAll('.nav-links a').forEach(link => {
                link.addEventListener('click', () => {
                    document.querySelector('.nav-links').classList.remove('active');
                });
            });
        });