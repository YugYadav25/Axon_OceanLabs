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
  const [githubUsername, setGithubUsername] = useState(null);
  const [githubInsights, setGithubInsights] = useState(null);
  const [resumeSection, setResumeSection] = useState(null);
  const [error, setError] = useState(null);

  const [loadingInsights, setLoadingInsights] = useState(false);
  const [loadingResume, setLoadingResume] = useState(false); // for ResumeSection

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

    fetchGithubInsights(incomingUser.id, repoId, oneYearAgo, now);
  }, []);

  const fetchGithubInsights = async (userId, repoId, start, end) => {
    setLoadingInsights(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/personal-branding/github-insights`,
        {
          repoUrl: `https://github.com/${repoId}`,
          userId,
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
        }
      );
      setGithubInsights(res.data);
      setGithubUsername(res.data?.contributions?.commits?.[0]?.author || '');
    } catch (err) {
      setGithubInsights(null);
      setError('Failed to fetch GitHub insights');
    } finally {
      setLoadingInsights(false);
    }
  };

  if (!user) return null;

  return (
    <MainLayout user={user} repoId={repoId}>
      <div className="max-w-full mx-auto p-16 pl-[150px] pr-[150px]">
        <p className="text-[#BFBFBF] mb-8 text-sm">{repoId}</p>

        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-white font-medium mb-2">
              Welcome{' '}
              <span className="text-[#5DA3FF]">
                {githubUsername || 'Contributor'}
              </span>
            </p>
            <h3 className="text-2xl font-semibold text-white mb-2">
              <span className="text-[#C2C2C2] font-medium">Your</span> Contribution Canvas
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
          ) : (
            <GitHubInsights
              githubUsername={githubUsername}
              githubInsights={githubInsights}
            />
          )
        )}

        {tab === 'resume' && (
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
          />
        )}
      </div>
    </MainLayout>
  );
}
