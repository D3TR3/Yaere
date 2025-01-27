import React from 'react';
import { BiSupport, BiEnvelope, BiTime, BiGlobe } from 'react-icons/bi';

const Contact = () => {
    const contactInfo = [
        {
            icon: <BiEnvelope className="text-2xl" />,
            title: 'Email',
            content: 'yaer@gmail.com'
        },
        {
            icon: <BiTime className="text-2xl" />,
            title: 'Response Time',
            content: '24-48 hours'
        },
        {
            icon: <BiGlobe className="text-2xl" />,
            title: 'Location',
            content: 'Global'
        }
    ];

    return (
        <div id="contact" className='max-w-[1240px] mx-auto px-4 py-24 border-x border-[#272727]'>
            <div className='flex flex-col items-center text-center mb-16 animate-fadeUp'>
                <div className='inline-flex items-center gap-3 mb-6'>
                    <BiSupport className='text-4xl text-white' />
                    <h2 className='text-4xl sm:text-5xl font-bold'>
                        <span className='bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500'>
                            Contact Info
                        </span>
                    </h2>
                </div>
                <p className='text-gray-400 text-lg sm:text-xl max-w-[600px]'>
                    Have questions or need assistance? Our support team is here to help you.
                </p>
            </div>

            <div className='max-w-[500px] mx-auto animate-fadeUp' style={{animationDelay: '200ms'}}>
                <div className='space-y-6'>
                    {contactInfo.map((item, index) => (
                        <div 
                            key={index}
                            className='flex items-center gap-6 group'
                        >
                            <div className='w-12 h-12 flex items-center justify-center bg-[#272727] 
                                        rounded-xl text-white group-hover:scale-110 transition-transform duration-300'>
                                {item.icon}
                            </div>
                            <div className='flex-1'>
                                <h3 className='text-gray-400 text-sm mb-1'>
                                    {item.title}
                                </h3>
                                <p className='text-white text-lg font-medium group-hover:translate-x-1 transition-transform duration-200'>
                                    {item.content}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className='mt-12 pt-12 border-t border-[#272727] text-center'>
                    <p className='text-gray-400 text-sm mb-2'>Connect with us on social media</p>
                    <div className='flex justify-center gap-4'>
                        {['Twitter', 'LinkedIn', 'GitHub'].map((platform, index) => (
                            <button 
                                key={index}
                                className='px-6 py-2 text-sm text-gray-400 hover:text-white border border-[#272727] 
                                         rounded-xl hover:bg-[#272727] transition-all duration-300'
                            >
                                {platform}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
