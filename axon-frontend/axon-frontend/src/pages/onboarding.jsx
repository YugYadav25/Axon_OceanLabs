import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Loader2, Paintbrush, Code, Sparkles  } from 'lucide-react';
import DetailedOverview from '../components/DetailedOverview';
import OnboardingTasks from '../components/OnboardingTasks';
import CriticalTasksAccordion from '../components/CriticalTasksAccordion';
import MainLayout from '../components/common/MainLayout';

import {
  SiReact,
  SiTailwindcss,
  SiJavascript,
  SiNodedotjs,
  SiMongodb,
  SiExpress,
} from 'react-icons/si';

import axios from 'axios';

function Onboarding() {
   const { repoId } = useParams(); 

  const [step, setStep] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overviewHtml, setOverviewHtml] = useState('');
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'onboarding' | 'critical'


  const [generating, setGenerating] = useState(false);
  const [generatingCritical, setGeneratingCritical] = useState(false);

  const BACKEND = import.meta.env.VITE_BACKEND_URL;

  const location = useLocation();
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const incomingUser = location.state?.user;
    console.log('[onboarding] incomingUser:', incomingUser, 'repoId:', repoId);

    if (!incomingUser || !repoId) {
      navigate('/selectrepo');
      return;
    }

    setUser(incomingUser);
    setUserId(incomingUser.id); 
  }, []);

  
  const fetchTasks = async () => {
    setLoading(true);
    try {
      console.log('[onboarding] Fetching tasks for', repoId);
      const res = await axios.get(`${BACKEND}/api/tasks/${encodeURIComponent(repoId)}`);
      setTasks(res.data.tasks || []);
      console.log('[onboarding] Tasks response:', res.data);
    } catch (err) {
      console.error('[onboarding] Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
      console.log('[onboarding] fetchTasks done, loading set to false');
    }
  };

  const generateTasks = async () => {
    setGenerating(true);
    try {
      await axios.post(`${BACKEND}/api/tasks/generate`, { repoId });
      await fetchTasks();
    } catch (err) {
      console.error('Failed to generate tasks:', err);
    } finally {
      setGenerating(false);
    }
  };

  const markComplete = async (taskId) => {
    try {
      await axios.put(`${BACKEND}/api/tasks/${taskId}/complete`);
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, isCompleted: true } : t))
      );
    } catch (err) {
      console.error('Failed to complete task:', err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [repoId]);

  useEffect(() => {
    if (!userId || !repoId) {
      console.log('[onboarding] Not starting onboarding, missing userId or repoId', userId, repoId);
      return;
    }

    const startOnboarding = async () => {
      try {
        console.log('[onboarding] Starting onboarding for', userId, repoId);
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/onboarding/start`,
          { userId, repoId },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        setStep(response.data.step);
        console.log('[onboarding] Onboarding start response:', response.data);
      } catch (err) {
        setError('Failed to start onboarding');
        console.error('[onboarding] Failed to start onboarding:', err);
      } finally {
        setLoading(false);
        console.log('[onboarding] startOnboarding done, loading set to false');
      }
    };

    startOnboarding();
  }, [userId, repoId]);


  const handleNext = async (input) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/onboarding/next`,
        { userId, repoId, input },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      const newStep = response.data.step;
      setStep(newStep);
      console.log(newStep.overviewId); // ✅ This will work


    } catch (err) {
      setError('Failed to proceed to the next step');
    } finally {
      setLoading(false);
    }
  };

const fetchOverview = async () => {
  if (!userId || !repoId) {
    setOverviewHtml('<p style="color:red;">Missing user or repo context.</p>');
    return;
  }

  setGenerating(true);
  try {
    // First, POST to generate the overview
    const generateRes = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/api/onboarding/overview/generate`,
      { userId, repoId },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    const overviewId = generateRes.data.overviewId;

    if (!overviewId) {
      setOverviewHtml('<p style="color:red;">Failed to generate overview.</p>');
      return;
    }

    // Then GET the HTML for that overview
    const response = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL}/api/onboarding/overview/${overviewId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        responseType: 'text',
      }
    );

    setOverviewHtml(response.data);
  } catch (error) {
    console.error('Overview generation error:', error);
    setOverviewHtml('<p style="color:red;">Failed to generate overview.</p>');
  } finally {
    setGenerating(false);
  }
};
const fetchCriticalTasks = async () => {
  if (!userId || !repoId) return;

  setGeneratingCritical(true);
  try {
    const response = await axios.post(
      `${BACKEND}/api/onboarding/critical-tasks/generate`,
      { userId, repoId },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    console.log(response);
    if (response.data.step) {
      setStep(response.data.step);
    } 
    else {
      console.warn('No updated step returned from critical-tasks/generate');
    }

  } catch (err) {
    console.error('Failed to generate critical tasks:', err);
  } finally {
    setGeneratingCritical(false);
  }
};


  const icons = {
    frontend: <Paintbrush className="w-8 h-8 text-cyan-300" />,
    backend: <Code className="w-8 h-8 text-cyan-300" />,
  };

  if (loading) return <div className="text-center py-10 text-blue-400">Loading...</div>;
  if (error) return <div className="text-center text-red-500 py-10">{error}</div>;
  if (!step || !step.stepId) return <div className="text-center text-gray-400 py-10">Unknown step</div>;

  return (
    <MainLayout user={user} repoId={repoId}>
  

  <div className="h-screen overflow-auto text-black ">
    {/* Step: Choose Role */}
    {step.stepId === 'choose-role' && (
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="text-4xl sm:text-4xl font-normal  text-center z-10 text-white mt-40">
          How do you want to explore this <span className="bg-gradient-to-r from-[#CAF5BB] to-[#2F89FF] bg-clip-text text-transparent">Codebase</span> ?
        </h1>
        <p className="text-xl text-[#d3d3d3] text-500 mb-12 mt-5">
          {step.prompt || "Choose how you'd like to explore this project."}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {step.options.map((option) => {
    const isFrontend = option.toLowerCase() === 'frontend';

    const frontendIcons = (
      <div className="flex gap-3 text-cyan-300 text-2xl">
        <SiReact />
        <SiTailwindcss />
        <SiJavascript />
      </div>
    );

    const backendIcons = (
      <div className="flex gap-3 text-green-300 text-2xl">
        <SiNodedotjs />
        <SiExpress />
        <SiMongodb />
      </div>
    );

    return (
      <button
        key={option}
        onClick={() => handleNext(option)}
        className="bg-[#21262D] hover:bg-[#1a1d1f] border border-[#2c2f31] p-6 rounded-2xl shadow-lg text-left group transition-all"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="text-2xl font-600 text-white capitalize">{option}</div>
          {isFrontend ? frontendIcons : backendIcons}
        </div>
        <p className="text-gray-400 text-m">
          {isFrontend
            ? 'Explore components, design systems, and UI logic.'
            : 'Dive into API routes, services, and backend architecture.'}
        </p>
      </button>
    );
  })}
        </div>
      </div>
    )}

    {step.stepId === 'show-overview-and-tasks' && (
  <div className="flex h-full text-white ">
    {/* Sidebar */}
    <div className="w-64 bg-[#21262D] p-10 min-h-screen">
      <h2 className="text-m font-normal mb-4 leading-snug text-[#E6E6E6]">
        Context-Aware<br />
        <span className="text-white text-xl">Onboarding</span>
      </h2>

      <div className="border-b border-white-700 mb-6"></div>

      <div className="flex flex-col space-y-4">
  {['overview', 'onboarding', 'critical'].map((tab) => {
    const isActive = activeTab === tab;

    return (
      <button
        key={tab}
        onClick={() => setActiveTab(tab)}
        className={`flex items-center gap-2 text-left capitalize text-sm py-1 px-2 rounded transition-all
          ${isActive ? 'bg-gradient-to-r from-[#CAF5BB] to-[#2F89FF] bg-clip-text text-transparent font-semibold' : 'text-[#D3D3D3] hover:text-blue-300'}`}
      >
        {/* Dot Icon */}
        <div
          className={`w-2.5 h-2.5 rounded-full transition-all ${
            isActive
              ? 'bg-[#CAF5BB] shadow-[0_0_6px_2px_rgba(202,245,187,0.5)]'
              : 'bg-[#D3D3D3]'
          }`}
        />

        {/* Label */}
        {tab === 'overview'
          ? 'Overview'
          : tab === 'onboarding'
          ? 'Onboarding Tasks'
          : 'Quality Audit'}
      </button>
    );
  })}
</div>

    </div>


 <div className="flex-1 p-10 overflow-auto bg-[#1B2027]">
  <div className='ml-20'>
  <p className='mb-20'>onboard / <span className='text-[#A3A2A2]'>{activeTab}</span></p>
    {activeTab === 'overview' && (
  <>
    {generating && !overviewHtml && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#21262D] bg-opacity-60 backdrop-blur-sm">
        <div className="bg-[#1B2027] border border-[#2c2f31] rounded-2xl p-10 text-center shadow-2xl w-full max-w-xl">
          <h3 className="text-2xl font-bold text-white mb-4 tracking-wide">
            Generating Smart Overview...
          </h3>
          <p className="text-gray-400 mb-6">
            Our AI Agent is scanning your codebase and building a structured breakdown tailored to your selected path.
          </p>

          {/* Timeline loader */}
          <div className="flex justify-center items-center gap-3 mb-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-full bg-blue-400 animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>

          <p className="text-sm text-gray-500 italic">Sit tight... This usually takes a minute.</p>
        </div>
      </div>
    )}

    {!overviewHtml && !generating && (
      <div className="text-center">
        <div className="flex flex-col items-center justify-center p-10 bg-[#21262D] border border-[#2c2f31] rounded-2xl shadow-md">
          <div className="text-5xl mb-4 animate-pulse text-blue-400">
            <Code className="w-10 h-10" />
          </div>

          <h3 className="text-2xl bg-gradient-to-r from-[#CAF5BB] to-[#2F89FF] bg-clip-text text-transparent font-bold mb-2 tracking-wide ">
            Smart Overview Generator
          </h3>

          <p className="text-gray-400 text-center max-w-xl mb-6">
            Let our <span className="text-blue-400 font-medium">AI Agent</span> scan your codebase and deliver a structured, component-wise breakdown tailored for your role.
          </p>

          <button
            onClick={fetchOverview}
            disabled={generating}
            className="bg-gradient-to-r from-[#CAF5BB]/50 to-[#2F89FF]/60 hover:opacity-90 text-[#CAF5BB] font-medium px-6 py-2 rounded-xl transition-all flex items-center gap-2 shadow-lg text-sm"
          >
            <Paintbrush className="w-5 h-5" />
            Generate with AI
          </button>

          <p className="text-sm text-gray-500 mt-4 italic">
            * One-time process to tailor your onboarding.
          </p>
        </div>
      </div>
    )}

    {overviewHtml && <DetailedOverview html={overviewHtml} />}
  </>
)}


    {activeTab === 'onboarding' && (
      <OnboardingTasks
        tasks={tasks}
        loading={loading}
        generating={generating}
        onGenerate={generateTasks}
        onComplete={markComplete}
      />
    )}

    {activeTab === 'critical' && (
  <>
    {generatingCritical && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#21262D] bg-opacity-60 backdrop-blur-sm">
        <div className="bg-[#1B2027] border border-[#2c2f31] rounded-2xl p-10 text-center shadow-2xl w-full max-w-xl">
          <h3 className="text-2xl font-bold text-white mb-4 tracking-wide">
            Auditing Code Quality...
          </h3>
          <p className="text-gray-400 mb-6">
            Scanning your codebase to surface maintainability improvements and fix suggestions.
          </p>
          <div className="flex justify-center items-center gap-3 mb-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-full bg-blue-400 animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
          <p className="text-sm text-gray-500 italic">This won't take long.</p>
        </div>
      </div>
    )}

    {!generatingCritical && (!step.tasks || step.tasks.length === 0) && (
      <div className="text-center">
        <div className="flex flex-col items-center justify-center p-10 bg-[#21262D] border border-[#2c2f31] rounded-2xl shadow-md">
          <div className="text-5xl mb-4 animate-pulse text-sky-400">
            <Sparkles className="w-10 h-10" />
          </div>

          <h3 className="text-2xl bg-gradient-to-r from-[#CAF5BB] to-[#2F89FF] bg-clip-text text-transparent font-bold mb-2 tracking-wide ">
            Code Quality Fixes
          </h3>

          <p className="text-gray-400 text-center max-w-xl mb-6">
            Run a quality scan to identify small but impactful <span className="text-blue-400 font-medium">improvements</span> in your code — lint issues, complexity alerts, and more.
          </p>

          <button
            onClick={fetchCriticalTasks}
            disabled={generatingCritical}
            className="bg-gradient-to-r from-[#CAF5BB]/50 to-[#2F89FF]/60 hover:opacity-90 text-[#CAF5BB] font-medium px-6 py-2 rounded-xl transition-all flex items-center gap-2 shadow-lg text-sm"
          >
            <Sparkles className="w-5 h-5" />
            Run Quality Audit
          </button>

          <p className="text-sm text-gray-500 mt-4 italic">
            * Ideal for identifying pain points in your role's area of the codebase.
          </p>
        </div>
      </div>
    )}

    {!generatingCritical && step.tasks && step.tasks.length > 0 && (
      <CriticalTasksAccordion tasks={step.tasks} />
    )}
  </>
)}
</div>
</div>
  </div>
)}


  </div>

</MainLayout>
);

}

export default Onboarding;
