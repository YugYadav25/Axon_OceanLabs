import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import MainLayout from '../components/common/MainLayout';
import Collab1 from '../assets/collab1.png';
import Collab2 from '../assets/collab2.png';
import Collab3 from '../assets/collab3.png';
import Profile from '../assets/pfp.png'; // Adjust path

import { Icon } from '@iconify-icon/react';

export default function RecentChanges() {
  const [changeSummary, setChangeSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const { repoId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('New Features');

  useEffect(() => {
    const incomingUser = location.state?.user;
    if (!incomingUser || !repoId) {
      navigate('/selectrepo');
      return;
    }
    setUser(incomingUser);
  }, []);

  const fetchChanges = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/changes/${encodeURIComponent(repoId)}`
      );
      const { summary, commitCount } = res.data.summary;
      console.log(`[SmartUpdates] Classified ${commitCount} commits.`);
      setChangeSummary(summary || {});
    } catch (err) {
      console.error('Changes fetch error:', err);
      setChangeSummary({});
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const TABS = ['Refactors', 'Fixes & Performance', 'New Features', 'Testing', 'Documentation'];

  return (
    <MainLayout user={user} repoId={repoId}>
      <div className="relative h-screen overflow-auto text-black">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
            <div className="border-4 border-indigo-400 border-t-transparent rounded-full w-12 h-12 animate-spin"></div>
            <p className="ml-4 text-white text-lg">Generating Changes...</p>
          </div>
        )}

        <div className={`flex h-full text-white transition-all ${loading ? 'blur-sm pointer-events-none' : ''}`}>
          {/* Sidebar */}
          <div className="w-[30%] bg-[#21262D] p-20 pr-10 min-h-screen">
            <h3 className="text-[24px] font-semibold mb-2 mt-16">
              <span className="text-[#C2C2C2] font-medium">Recent</span> Code Updates
            </h3>
            <p className='text-[#C2C2C2] text-sm'>Timeline</p>

            <div className='flex flex-row gap-7 mb-10 mt-5'>
              <p className='text-sm'>Contributors</p>
              <div className="flex -space-x-1 overflow-hidden">
                <img src={Collab1} alt="Profile" className="w-5 h-5 rounded-full" />
                <img src={Collab2} alt="Profile" className="w-5 h-5 rounded-full" />
                <img src={Collab3} alt="Profile" className="w-5 h-5 rounded-full" />
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-col space-y-4">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-2 text-left capitalize text-sm rounded transition-all ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-[#CAF5BB] to-[#2F89FF] bg-clip-text text-transparent font-semibold'
                      : 'text-[#D3D3D3] hover:text-blue-300'
                  }`}
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      activeTab === tab
                        ? 'bg-[#CAF5BB] shadow-[0_0_6px_2px_rgba(202,245,187,0.5)]'
                        : 'bg-[#D3D3D3]'
                    }`}
                  />
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          {changeSummary && changeSummary[activeTab] && changeSummary[activeTab].length > 0 ? (
            <div className="flex-1 p-24 overflow-auto bg-[#1B2027] space-y-6">
              <h2 className="text-2xl font-semibold mb-10 text-[#61A4FD] ">
              {activeTab}
              </h2>
              {changeSummary[activeTab].map((item, index) => (
                <div
                  key={index}
                  className="p-6 border-l border-l-white  shadow-sm relative pt-0"
                >
                  <div className="w-5 h-5 bg-[#474747] rounded-full flex justify-center items-center absolute -left-[10px] top-0"> 
                    <Icon icon="charm:tick" width="13" height="13"  style={{color: "#FFFFFF"}} />
                  </div>

                  <div className='flex flex-row items-center gap-5 mb-9'>
                    <p className="text-sm text-[#B0B0B0] "><span className='font-semibold text-white'>@ {item.author}</span> made <span className='lowercase'>{activeTab} </span>changes</p>
                    <img src={Profile} alt="Profile" className="w-6 h-65 rounded-full" />
                    {item.sha && (
                      <span className="ml-auto font-mono text-xs text-[#8b949e] bg-[#21262D] px-2 py-1 rounded border border-[#30363d]">
                        {item.sha}
                      </span>
                    )}
                    {item.date && (
                      <span className="text-xs text-[#8b949e]">
                        {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                  
                  <div className="w-5 h-5 bg-[#2F89FF] rounded-full flex justify-center items-center absolute -left-[10px] top-17">

                    <Icon icon="material-symbols-light:files" width="13" height="13"  style={{color: "#FFFFFF"}} />
                  </div>
                 <div>
                    <p className="text-m text-white ">Key files modified:</p>
                    <ul className="mt-3 flex flex-col gap-2 mb-6">
                      {item.files.map((file, index) => (
                        <li
                          key={index}
                          className="w-fit text-[#CAF5BB] font-mono text-xs bg-[#2A2E35] p-2 rounded-lg border border-[#3F3F3F]"
                        >
                          {file}
                        </li>
                      ))}
                    </ul>


                  </div>

                   <div className="bg-[#21262D] p-4 rounded-lg">
                    <h3 className="text-white text-m font-semibold mb-1">Description</h3>
                    <p className="text-zinc-400 text-sm font-medium">{item.description}</p>
                  </div>

                </div>
                
              ))}
            </div>
          ) : (
            <div className="flex-1 p-10 bg-[#1B2027] flex flex-col items-center justify-center text-center">
              
              <div className="flex flex-col items-center justify-center p-16 bg-[#21262D] border border-[#2c2f31] rounded-2xl shadow-md text-center">
                {/* Icon (optional – use any icon you like) */}
                <div className="text-5xl mb-4 text-blue-400 animate-pulse">
                  <Icon icon="streamline:ai-redo-spark-solid" width="30" height="30"   />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-semibold bg-gradient-to-r from-[#CAF5BB] to-[#2F89FF] bg-clip-text text-transparent mb-2 tracking-wide">
                  Fetch Smart Updates
                </h3>

                {/* Subheading */}
                <p className="text-gray-400 max-w-xl mb-6 text-sm">
                  We couldn’t detect any updates for <strong className="text-blue-400">{activeTab}</strong>. Try syncing again to view the latest modifications in your repo.
                </p>

                {/* Action Button */}
                <button
                  onClick={fetchChanges}
                  className="bg-gradient-to-r from-[#CAF5BB]/50 to-[#2F89FF]/60 hover:opacity-90 text-[#CAF5BB] font-medium px-6 py-2 rounded-xl transition-all flex items-center gap-2 shadow-lg text-sm"
                >
                  <Icon icon="tabler:report" width="24" height="24"/>
                  Find Changes
                </button>

                {/* Footer note */}
                <p className="text-sm text-gray-500 mt-4 italic">
                  This ensures your view stays up-to-date.
                </p>
              </div>

            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
