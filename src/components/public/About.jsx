import React from 'react';
import { BsShieldCheck, BsLightning, BsPeople } from 'react-icons/bs';

const About = () => {
    const features = [
        {
            icon: <BsLightning className="text-4xl text-white" />,
            title: "Lightning Fast",
            description: "Experience real-time messaging with minimal latency and maximum reliability."
        },
        {
            icon: <BsShieldCheck className="text-4xl text-white" />,
            title: "Secure & Private",
            description: "Your conversations are protected with end-to-end encryption and robust security measures."
        },
        {
            icon: <BsPeople className="text-4xl text-white" />,
            title: "Community Focused",
            description: "Built for meaningful connections and collaborative communications."
        }
    ];

    return (
        <div id="about" className='max-w-[1240px] mx-auto px-4 py-24 border-x border-[#272727]'>
            <div className='flex flex-col items-center text-center mb-16 animate-fadeUp'>
                <h2 className='text-4xl sm:text-5xl font-bold mb-6'>
                    <span className='bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500'>
                        Why Choose YAERE?
                    </span>
                </h2>
                <p className='text-gray-400 text-lg sm:text-xl max-w-[800px]'>
                    We're building the next generation of messaging platforms, focusing on 
                    speed, security, and seamless user experience.
                </p>
            </div>

            <div className='grid md:grid-cols-3 gap-8 animate-fadeUp' style={{animationDelay: '200ms'}}>
                {features.map((feature, index) => (
                    <div 
                        key={index}
                        className='p-8 border border-[#272727] rounded-2xl hover:bg-[#272727]/50
                                 transition-all duration-300 group'
                    >
                        <div className='mb-6 transform transition-transform duration-300 group-hover:scale-110'>
                            {feature.icon}
                        </div>
                        <h3 className='text-2xl font-bold text-white mb-4'>
                            {feature.title}
                        </h3>
                        <p className='text-gray-400'>
                            {feature.description}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default About;
