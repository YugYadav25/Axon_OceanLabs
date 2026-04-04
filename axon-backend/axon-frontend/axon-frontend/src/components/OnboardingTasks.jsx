import { useState } from 'react';
import { CheckCircle2, Brain, Wrench, Pin } from 'lucide-react';
import { Icon } from '@iconify-icon/react';
import clsx from 'clsx';
import Collab1 from '../assets/collab1.png';
import Collab2 from '../assets/collab2.png';
import Collab3 from '../assets/collab3.png';



const shuffle = (arr) => {
  const array = [...arr];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};


const OnboardingTasks = ({ tasks, loading, generating, onGenerate, onComplete }) => {
  const [showReadme, setShowReadme] = useState(false);

  const isArchitectureOverview = (task) =>
    task.title.toLowerCase() === 'architecture overview';

  const overviewTask = tasks.find(isArchitectureOverview);
  const archTasks = tasks.filter((task) => task.title.toLowerCase().startsWith('arch') && !isArchitectureOverview(task));
  const fixTasks = tasks.filter((task) => task.title.toLowerCase().startsWith('fix') && !isArchitectureOverview(task));
  const otherTasks = tasks.filter((task) => !archTasks.includes(task) && !fixTasks.includes(task) && !isArchitectureOverview(task));

  const renderTaskCards = (taskList, variant) => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
    {taskList.map((task, index) => (
      <TaskCard
        key={task._id}
        task={task}
        onComplete={onComplete}
        variant={variant}
        tall={variant === 'tall' && index % 2 === 0}
      />
    ))}
  </div>
);


  return (
    <div className="relative mr-10">
      {/* Header with toggle */}
      <div className="flex justify-between items-center ">
        <div className='flex flex-col gap-2'>
          <div className='flex flex-row gap-4'>
            <h3 className="text-2xl font-semibold text-white">
            <span className="text-[#C2C2C2] font-medium">Priority</span> Tasks
          </h3>
           <button
              onClick={onGenerate}
              disabled={generating}
              className="px-2 py-2 rounded-full bg-[#CAF5BB]/10 hover:bg-[#CAF5BB]/30 text-[#CAF5BB] flex items-center"
            >
              {generating ? <Icon icon="eos-icons:loading" width="26" height="26" /> : <Icon icon="mingcute:refresh-2-line" width="26" height="26" />}
            </button>
          </div>
          
          <div>
          <p className="text-[#C2C2C2] text-sm">Get started with key tasks to set up your workspace and workflow.</p>

          </div>
          
        </div>

        <div className="flex items-center gap-4">
          
          <div className="flex gap-2 bg-[#30363E] px-1 py-1 rounded-[50px]">
            <button
              onClick={() => setShowReadme(false)}
              className={clsx("px-5 py-2 text-xs ", !showReadme ? "bg-[#21262D] text-white rounded-[50px]" : "text-white border border-gray-600 ")}
            >
              Tasks
            </button>
            <button
              onClick={() => setShowReadme(true)}
              className={clsx("px-5 py-2 text-xs", showReadme ? "bg-[#21262D] text-white rounded-[50px]" : "bg-transparent text-white")}
            >
              READ.ME
            </button>
          </div>
        </div>

        
      </div>


       <div className="flex gap-4 mt-8">
        <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-[#21262D] text-white text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2F89FF]"></span>
          Architecture Tasks <span className='bg-[#313843] px-2 py-1 rounded-full'>{archTasks.length}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#21262D] text-white text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-[#CAF5BB]"></span>
          Fixes and Maintenance <span className='bg-[#313843] px-2 py-1 rounded-full'>{fixTasks.length}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#21262D] text-white text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E45454]"></span>
          Other Tasks <span className='bg-[#313843] px-2 py-1 rounded-full'>{otherTasks.length}</span>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400 px-4">Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <p className="text-gray-400 px-4">No tasks found. Click "Generate Tasks".</p>
      ) : (
        <>
          {/* Tasks View */}
          {!showReadme && (
  <div className="mt-6">
    {/* Architecture Overview Box */}
   {overviewTask && (
  <div className="bg-[#1B2027] p-8 rounded-xl mb-8 border-l-4 border-blue-400 shadow-md">
    <h4 className="text-white text-xl font-semibold mb-4">Architecture Overview</h4>
    <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
      {(() => {
        const desc = overviewTask.description || '';
        const sentences = desc.match(/[^.!?]+[.!?]+[\])'"`’”]*\s*/g) || [desc];
        const splitIndex = Math.ceil(sentences.length / 2);
        const firstHalf = sentences.slice(0, splitIndex).join('').trim();
        const secondHalf = sentences.slice(splitIndex).join('').trim();

        return (
          <>
            <p>{firstHalf}</p>
            <p>{secondHalf}</p>
          </>
        );
      })()}
    </div>
  </div>
)}

    {/* Task Cards */}
    {renderTaskCards(
      shuffle([...tasks.filter((task) => task._id !== overviewTask?._id)]),
      'uniform'
    )}
  </div>
)}


          {/* README Side Panel */}
          {showReadme && (
            <div className="fixed inset-0 z-50 flex">
              <div className="flex-1 backdrop-blur-sm bg-black/30" onClick={() => setShowReadme(false)} />
              <div className="w-[800px] bg-[#21262D] p-16 overflow-y-auto border-l border-[#E4E4E4]/25">
                <button onClick={() => setShowReadme(false)} className="text-white hover:text-red-400"><Icon icon="mynaui:panel-left-close-solid" width="24" height="24" /></button>

                <div className="flex justify-between items-center mb-4 mt-10">
                  <h2 className="text-2xl font-bold text-white flex gap-2 items-center">
                    <span className="text-[#C2C2C2] font-medium">READ.ME</span> Overview
                  </h2>
                </div>
                <div className="relative">
              <div className="bg-[#1B2027] p-14 rounded-[15px] relative">
                {/* Left Blue Border - partial */}
                <div className="absolute left-0 top-12 bottom-12 w-1 bg-blue-400 rounded-full"></div>

                <p className="text-gray-300 text-sm whitespace-pre-wrap">
                  {overviewTask?.description}
                </p>
              </div>
            </div>

              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const TaskCard = ({ task, onComplete }) => {
  const tagColors = {
  Arch: 'bg-[#E45454]/20 text-[#E45454]',
  Setup: 'bg-[#2F89FF]/20 text-[#B1CFF5]',
  Fix: 'bg-[rgba(81,174,195,0.4)] text-[#1ADDB9]',
  Maintain: 'bg-[rgba(202,245,187,0.42)] text-[#CAF5BB]',
  Miscellaneous: 'bg-gray-600 text-white',
};

  // Determine tags based on title
  const title = task.title.toLowerCase();
  const tags = [];

  if (title.includes("arch")) {
    tags.push("Arch", "Setup");
  } else if (title.includes("fix")) {
    tags.push("Fix", "Maintain");
  } else if (title.includes("maintain")) {
    tags.push("Maintain");
  } else if (title.includes("setup")) {
    tags.push("Setup");
  } else {
    tags.push("Miscellaneous");
  }

  // Extract file name (e.g., "in src/index.js")
  const extractFilePath = (title) => {
  const match = title.match(/in (.+)$/);
  return match ? match[1] : null;
};

  const cleanTitle = task.title.replace(/ in .+$/, '').trim();
  const fileName = extractFilePath(task.title);

  const isFixOrMaintain = tags.includes("Fix") || tags.includes("Maintain");

  return (
    <div className="bg-[#2A2E35] p-7 rounded-xl shadow-md flex flex-col justify-between h-[310px] space-y-3">
      <div className="flex justify-between flex-wrap">
        <div className="flex gap-2 flex-wrap">
        {tags.map((tag) => (
          <span
            key={tag}
            className={`text-xs px-3 py-1 rounded-full font-medium ${tagColors[tag] || 'bg-gray-500 text-white'}`}
          >
            {tag}
          </span>
        ))}
        </div>
        
        <Icon icon="mdi:tick-circle" width="24" height="24"  style={{color: "#adadad"}} />

      </div>

      <h4 className="text-white text-xl font-medium">{cleanTitle}</h4>
      {fileName && isFixOrMaintain && (
        <p className="text-xs text-[#A6A6A6]">{fileName}</p>
      )}

        <div className='flex flex-row items-start gap-2'>
          {isFixOrMaintain && (
          <Icon icon="ic:outline-auto-fix-high" width="20" height="20"  style={{color: "#adadad"}} />
        )}
          
        <p className="text-sm text-[#D1D1D1]"> {task.description.replace(/at .*$/, '').trim()}</p>
        </div>
      

      <textarea
        placeholder="Notes: Type here..."
        className="w-full rounded bg-transparent text-white text-sm"
        rows={2}
      />

      {isFixOrMaintain && (
        <div className="flex flex-row justify-between items-start pt-2">
          <div>
                <p className='text-xs mb-3'>Shared Task</p>
                <div className="flex -space-x-1 overflow-hidden">
                  <img src={Collab1} alt="Profile" className="w-6 h-6 rounded-full" />
                  <img src={Collab2} alt="Profile" className="w-6 h-6 rounded-full" />
                  <img src={Collab3} alt="Profile" className="w-6 h-6 rounded-full" />
                </div>
          </div>
          <div className="flex flex-col justify-between items-start gap-1">
       
            <button onClick={() => onComplete(task._id)} className="text-white text-xs bg-[#21262D] py-2 px-3 rounded">Start fixing  →</button>
       
          </div>
          
        </div>
      )}
    </div>
  );
};


export default OnboardingTasks;
