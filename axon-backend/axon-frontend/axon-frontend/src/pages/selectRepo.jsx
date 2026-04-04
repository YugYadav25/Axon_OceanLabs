import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { SiNodedotjs, SiJavascript, SiReact, SiTailwindcss } from "react-icons/si";
import Logo from '../assets/logo.png';
import Header from '../components/common/Header';

import { Icon } from '@iconify-icon/react';

const SelectRepo = () => {
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [selectedRepoId, setSelectedRepoId] = useState(null);
  const [showRepoModal, setShowRepoModal] = useState(false);
  const [newRepoUrl, setNewRepoUrl] = useState('');
  const [loadingRepo, setLoadingRepo] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (userStr && token) {
      try {
        setUser(JSON.parse(userStr));
        return;
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }

    // No login required — use a guest user for exploring
    setUser({ githubId: 'guest', id: 'guest', username: 'Guest' });
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchRepos();
  }, [user]);

  const fetchRepos = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/repo/list`, {
        params: { userId: user.githubId || user.id }
      });
      if (Array.isArray(res.data?.repos)) {
        setRepos(res.data.repos);
      }
    } catch (error) {
      console.error('Error fetching repos:', error);
    }
  };

  const connectRepo = async () => {
    setShowRepoModal(false);
    setLoadingRepo(true);
    const repoId = newRepoUrl.replace('https://github.com/', '').replace('https://gitlab.com/', '');
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/repo/scan`, {
        repoUrl: newRepoUrl,
        repoId,
        userId: user.githubId || user.id
      });
      setNewRepoUrl('');
      await fetchRepos();
    } catch (err) {
      console.error(err);
      alert('Failed to connect repository.');
    }
    setLoadingRepo(false);
  };

  const handleContinue = () => {
    if (selectedRepoId) {
      navigate(`/personal-branding/${encodeURIComponent(selectedRepoId)}`, {
        state: { user }
      });
    } else {
      alert("Please select a repository.");
    }
  };

  if (!user) return null;

  return (
     <div className="relative bg-[#1B2027]">
      <Header user={user} />
   
    <div className="min-h-screen bg-[#1B2027] text-white flex flex-col items-center relative overflow-hidden">
        <div className="absolute top-6 left-8 z-10 ">
        <div className="flex items-center space-x-4">
        {/* Logo */}
        <img src={Logo} alt="Logo" className="w-8 h-8" />

        <div>
          <p className="text-xl font-semibold">
            <span className="bg-gradient-to-r from-[#CAF5BB] to-[#2F89FF] bg-clip-text text-transparent">
            Axon
          </span>
          </p>
          <p className="text-xs text-[#C9C9C9]">Your repo with AI clarity</p>
        </div>
      </div>
      </div>
      

      <div className="flex flex-row items-center justify-center h-screen w-full gap-40">

      <h1 className="font-medium text-left z-10 flex flex-col gap-2 flex-wrap">
        <span className="text-4xl sm:text-4xl text-[#E5E5E5]">Get Started with a</span>
        <span className="text-5xl sm:text-5xl bg-gradient-to-r from-[#CAF5BB] to-[#2F89FF] bg-clip-text text-transparent">
          Codebase
        </span>
      </h1>


      <div>

      {/* Repo List */}
      <div className="bg-[#21262D] rounded-lg mt-10 w-full max-w-6xl p-6 z-10 shadow-md">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4">
      <h2 className="text-white/70 font-medium ">Your Repositories</h2>
      <button
          onClick={() => setShowRepoModal(true)}
          className="bg-[#30363E] text-white px-5 py-1 rounded text-sm"
        >
          New Project + 
        </button>
        </div>
        

        {repos.map((repo) => (
          <div
            key={repo.repoId}
            className={`mb-4 bg-[#1B2027] border ${
              selectedRepoId === repo.repoId ? 'border-[#2F89FF]' : 'border-gray-700'
            } text-sm rounded-lg p-5 cursor-pointer hover:border-[#2F89FF] transition-all duration-150`}
            onClick={() => setSelectedRepoId(repo.repoId)}
          >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <p className="font-mono text-white break-all text-[18px]">{repo.repoId}</p>
                <p className="text-[12px] text-white/50">
                  Last Scanned: {new Date(repo.lastScanned).toLocaleString()}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-white text-lg ml-20">
                <SiNodedotjs className="text-green-500" title="Node.js" />
                <SiJavascript className="text-yellow-400" title="JavaScript" />
                <SiReact className="text-cyan-400" title="React" />
                <SiTailwindcss className="text-blue-400" title="Tailwind CSS" />
              </div>
            </div>
          </div>
        ))}
      </div>


      {/* Continue Button */}
      <button
        onClick={handleContinue}
        className="mt-5 bg-white text-black px-10 py-2 text-sm rounded z-10"
      >
        Continue
      </button>

      </div>


      
    </div>  
      {/* Modal */}
      {showRepoModal && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
          <div className="fixed top-1/2 left-1/2 w-full max-w-xl p-8 bg-white rounded-2xl shadow-xl z-50 transform -translate-x-1/2 -translate-y-1/2 text-gray-900">
            <button
              onClick={() => setShowRepoModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-xl"
              aria-label="Close modal"
            >
              ✕
            </button>
            <h3 className="text-2xl font-bold mb-6 pr-8 text-center">Connect a Repository</h3>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <input
                type="text"
                value={newRepoUrl}
                onChange={(e) => setNewRepoUrl(e.target.value)}
                placeholder="https://github.com/org/repo"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-900 placeholder-gray-500 w-full"
              />
              <button
                onClick={connectRepo}
                disabled={!newRepoUrl.trim()}
                className="px-6 py-3 bg-[#2F89FF] text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                Connect Repository
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Supported: GitHub, GitLab
            </p>
          </div>
        </>
      )}

      {/* Loader Overlay */}
      {loadingRepo && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-blue-400 w-10 h-10" />
            <p className="text-white text-lg">Connecting Repository...</p>
          </div>
        </div>
      )}
    </div>
     </div>
  );
};

export default SelectRepo;
