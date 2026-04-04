import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import MainLayout from '../components/common/MainLayout';
import GitHubInsights from '../components/GitHubInsights';
import ResumeSection from '../components/ResumeSection';

export default function PersonalBranding() {
  const { repoId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('insights');
  
  // Leaderboard states
  const [contributors, setContributors] = useState([]);
  const [targetUsername, setTargetUsername] = useState('');

  const [githubUsername, setGithubUsername] = useState('');
  const [githubInsights, setGithubInsights] = useState(null);
  const [resumeSection, setResumeSection] = useState(null);
  const [error, setError] = useState(null);

  const [loadingInsights, setLoadingInsights] = useState(false);
  const [loadingResume, setLoadingResume] = useState(false);
  const [loadingContributors, setLoadingContributors] = useState(false);

  const [role, setRole] = useState('Developer');
  const [projectName, setProjectName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const incomingUser = location.state?.user;

    if (!incomingUser || !repoId) {
      navigate('/selectrepo');
      return;
    }

    setUser(incomingUser);
    setProjectName(repoId.split('/')[1] || 'Project');

    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    setStartDate(oneYearAgo.toISOString().split('T')[0]);
    setEndDate(now.toISOString().split('T')[0]);

    fetchContributorsAndInsights(incomingUser.id, repoId, oneYearAgo, now, incomingUser.githubId || incomingUser.username);
  }, []);

  const fetchContributorsAndInsights = async (userId, repoId, start, end, localGithubUsername) => {
    setLoadingContributors(true);
    let selectedUser = localGithubUsername;
    
    try {
      // 1. Fetch contributors leaderboard
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/personal-branding/contributors`,
        { repoUrl: `https://github.com/${repoId}` }
      );
      
      const contributorsList = res.data.contributors || [];
      // Sort by contributions (commits)
      contributorsList.sort((a, b) => b.contributions - a.contributions);
      setContributors(contributorsList);
      
      // If we have contributors, default to the local user if they are in the list, otherwise first person
      if (contributorsList.length > 0) {
        const foundLocalUser = contributorsList.find(c => c.login.toLowerCase() === localGithubUsername?.toLowerCase());
        selectedUser = foundLocalUser ? foundLocalUser.login : contributorsList[0].login;
        setTargetUsername(selectedUser);
      }
    } catch (err) {
      console.error('Failed to fetch contributors:', err);
    } finally {
      setLoadingContributors(false);
    }

    // 2. Fetch insights for the chosen/selectedUser
    fetchGithubInsights(userId, repoId, start, end, selectedUser);
  };

  const fetchGithubInsights = async (userId, repoId, start, end, targetUsr) => {
    if (!targetUsr) return;
    setLoadingInsights(true);
    setTab('insights');
    
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/personal-branding/github-insights`,
        {
          repoUrl: `https://github.com/${repoId}`,
          userId,
          targetUsername: targetUsr,
          startDate: (start instanceof Date ? start : new Date(start)).toISOString().split('T')[0],
          endDate: (end instanceof Date ? end : new Date(end)).toISOString().split('T')[0],
        }
      );
      setGithubInsights(res.data);
      setGithubUsername(targetUsr);
    } catch (err) {
      setGithubInsights(null);
      setError('Failed to fetch GitHub insights');
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleSelectContributor = (username) => {
    setTargetUsername(username);
    setResumeSection(null); // Clear previous card when switching users
    const now = new Date(endDate);
    const start = new Date(startDate);
    fetchGithubInsights(user.id, repoId, start, now, username);
  };

  if (!user) return null;

  return (
    <MainLayout user={user} repoId={repoId}>
      <div className="max-w-full mx-auto p-16 pl-[150px] pr-[150px]">
        <p className="text-[#BFBFBF] mb-2 text-sm uppercase tracking-widest">{repoId}</p>
        <h3 className="text-3xl font-bold text-white mb-8">
          Repository <span className="bg-gradient-to-r from-[#CAF5BB] to-[#2F89FF] bg-clip-text text-transparent">Hall of Fame</span>
        </h3>

        {/* Contributors Leaderboard Horizontal View */}
        <div className="mb-10 w-full overflow-x-auto pb-4 custom-scroll">
          {loadingContributors ? (
            <div className="text-[#BFBFBF] animate-pulse flex gap-4">
              {[1,2,3].map(i => <div key={i} className="w-48 h-16 bg-[#21262D] rounded-xl"></div>)}
            </div>
          ) : (
            <div className="flex gap-4 min-w-max">
              {contributors.map((contributor, idx) => (
                <div 
                  key={contributor.id} 
                  onClick={() => handleSelectContributor(contributor.login)}
                  className={`flex items-center gap-3 p-3 w-56 rounded-xl cursor-pointer border transition-all duration-200 ${
                    targetUsername === contributor.login 
                      ? 'bg-[#2F89FF]/10 border-[#2F89FF] shadow-[0_0_15px_rgba(47,137,255,0.2)]' 
                      : 'bg-[#1C2128] border-[#30363D] hover:border-[#6B7280] hover:bg-[#21262D]'
                  }`}
                >
                  <div className="relative">
                    <img src={contributor.avatar_url} alt={contributor.login} className="w-12 h-12 rounded-full border border-[#30363D]" />
                    <div className="absolute -top-1 -left-1 w-5 h-5 bg-[#CAF5BB] rounded-full flex items-center justify-center text-[#1C2128] text-[10px] font-bold shadow-sm">
                      #{idx + 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{contributor.login}</p>
                    <p className="text-[#6B7280] text-xs font-semibold">{contributor.contributions} commits</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-[#BFBFBF] font-medium mb-1">
              Currently viewing detailed insights for
            </p>
            <h3 className="text-2xl font-semibold text-white mb-2">
              <span className="text-[#5DA3FF]">{githubUsername || 'Contributor'}</span>'s Profile
            </h3>
          </div>

          <div className="flex space-x-4 mb-4">
            <button
              className={`flex items-center gap-2 text-left capitalize text-sm py-1 px-2 rounded transition-all ${
                tab === 'insights'
                  ? 'bg-gradient-to-r from-[#CAF5BB] to-[#2F89FF] bg-clip-text text-transparent font-semibold'
                  : 'text-[#D3D3D3] hover:text-blue-300'
              }`}
              onClick={() => setTab('insights')}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  tab === 'insights'
                    ? 'bg-[#CAF5BB] shadow-[0_0_6px_2px_rgba(202,245,187,0.5)]'
                    : 'bg-[#D3D3D3]'
                }`}
              />
              GitHub Insights
            </button>

            <button
              className={`flex items-center gap-2 text-left capitalize text-sm py-1 px-2 rounded transition-all ${
                tab === 'resume'
                  ? 'bg-gradient-to-r from-[#CAF5BB] to-[#2F89FF] bg-clip-text text-transparent font-semibold'
                  : 'text-[#D3D3D3] hover:text-blue-300'
              }`}
              onClick={() => setTab('resume')}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  tab === 'resume'
                    ? 'bg-[#CAF5BB] shadow-[0_0_6px_2px_rgba(202,245,187,0.5)]'
                    : 'bg-[#D3D3D3]'
                }`}
              />
              Impact Statement
            </button>
          </div>
        </div>

        <div className="border-b border-[#363636] mb-6"></div>

        {tab === 'insights' && (
          loadingInsights ? (
            <div className="text-white text-center mt-10">Loading GitHub Insights...</div>
          ) : githubInsights ? (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <GitHubInsights
                githubUsername={githubUsername}
                githubInsights={githubInsights}
              />
            </div>
          ) : (
            <div className="text-red-400 text-center mt-10">{error || 'No insights available.'}</div>
          )
        )}

        {tab === 'resume' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <ResumeSection
              user={user}
              repoId={repoId}
              role={role}
              setRole={setRole}
              projectName={projectName}
              setProjectName={setProjectName}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              resumeSection={resumeSection}
              setResumeSection={setResumeSection}
              loading={loadingResume}
              setLoading={setLoadingResume}
              setError={setError}
              username={githubUsername}
              targetUsername={targetUsername}
            />
          </div>
        )}
      </div>
    </MainLayout>
  );
}
