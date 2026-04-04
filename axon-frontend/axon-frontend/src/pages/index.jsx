import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify-icon/react';
import Logo from '../assets/logo.png';

export default function LandingPage() {
  const navigate = useNavigate();

  const goToApp = () => navigate('/selectrepo');

  return (
    <div className="min-h-screen text-white px-6 py-8 bg-[#1B2027]"
    style={{
    background: 'radial-gradient(circle at center, rgba(255,255,255,0.05), #15191D 70%)',
  }}
    
    >
      <div className="absolute top-6 left-8 z-10 ">
              <div className="flex items-center space-x-4">
              {/* Logo */}
              <img src={Logo} alt="Logo" className="w-8 h-8" />
      
              
            </div>
            </div>
      <div className="flex justify-between items-center mb-16">
        <div className="flex items-center gap-3">
        
        </div>
        <button
          onClick={goToApp}
          className="bg-[#2F89FF] hover:bg-blue-400 text-white px-4 py-2 rounded text-xs"
        >
          Enter App →
        </button>
      </div>

      {/* Main Hero Section */}
     <div className="flex flex-col items-center text-center max-w-3xl mx-auto relative mt-[120px]">
  <h1 className="text-xl sm:text-xl font-normal mb-6">Your Codebase, with AI Vision </h1>

  {/* ICONS + LINES AROUND THE MAIN HEADING */}
  <div className="flex items-center justify-center gap-4 mb-6 relative">
    {/* Left icons */}
    <div className="flex items-center gap-2 absolute left-[-500px] top-1/2 transform -translate-y-1/2">
     <div className="w-[150px] h-px bg-gray-600" />
      <div className="w-12 h-12 bg-gray-800 rounded-md flex items-center justify-center"><Icon icon="iconoir:git-solid" width="25" height="25"  style={{color:"rgb(171, 171, 171)"}} /></div>
      <div className="w-[80px] h-px bg-gray-600" />
      <div className="w-8 h-8 bg-gray-800 rounded-md flex items-center justify-center"><Icon icon="streamline-flex:user-collaborate-group" width="18" height="18"  style={{color:"rgb(171, 171, 171)"}} /></div>
       <div className="w-[90px] h-px bg-gray-600" />
    </div>

    {/* Right icons */}
    <div className="flex items-center gap-2 absolute right-[-500px] top-1/2 transform -translate-y-1/2">
    <div className="w-[90px] h-px bg-gray-600" />
      <div className="w-8 h-8 bg-gray-800 rounded-md flex items-center justify-center"><Icon icon="humbleicons:ai" width="18" height="18"  style={{color:"rgb(171, 171, 171)"}} /></div>
      <div className="w-[80px] h-px bg-gray-600" />
      <div className="w-12 h-12 bg-gray-800 rounded-md flex items-center justify-center"><Icon icon="solar:round-graph-line-duotone" width="25" height="25"  style={{color: "rgb(171, 171, 171)"}} /></div>
      <div className="w-[150px] h-px bg-gray-600" />
    </div>

    {/* Main heading */}
    <h2 className="text-5xl sm:text-6xl font-medium bg-gradient-to-r from-[#CAF5BB] to-[#2F89FF] bg-clip-text text-transparent">
      Axon
    </h2>
  </div>

  {/* Subheading */}

  {/* Description */}
  <p className="text-gray-200 text-md mb-10 px-4 max-w-xxl mt-4">
    Get AI-powered insights into your codebase. Understand structure, surface
    hidden issues, and boost productivity — all in one smart tool.
  </p>

   <div className="flex flex-col sm:flex-row gap-4">
    <button
      onClick={goToApp}
      className="bg-white text-black px-5 py-2 rounded-lg font-semibold hover:bg-gray-200 "
    >
      <div className='flex flex-column items-center gap-2'>
        <Icon icon="mdi:github" width="20" height="20"  style={{color: "#000"}} />
        <p className='text-sm'>Get started</p>
      </div>
    </button>
    <button
      onClick={goToApp}
      className="border border-white text-white px-5 py-2 rounded-lg font-semibold hover:bg-white hover:text-black text-sm"
    >
      Explore Features
    </button>
  </div>
  
</div>

     
    </div>
  );
}
