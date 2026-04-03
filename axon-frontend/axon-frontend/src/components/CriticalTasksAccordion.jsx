// components/onboarding/CriticalTasksAccordion.jsx
import { FileText, Hash, Flame, AlertTriangle, CheckCircle } from "lucide-react";
import { Icon } from '@iconify-icon/react';

const SEVERITY_STYLES = {
  1: {
    label: "Low",
    color: "bg-green-600 text-white",
    icon: <CheckCircle size={16} className="text-green-300" />,
  },
  2: {
    label: "Medium",
    color: "bg-[#FFBE32]/30 text-black",
    icon: <AlertTriangle size={16} className="text-yellow-300" />,
  },
  3: {
    label: "High",
    color: "bg-red-600 text-white",
    icon: <Flame size={16} className="text-red-400" />,
  },
};

const CriticalTasksAccordion = ({ tasks }) => {
  const grouped = tasks.reduce((acc, task) => {
    acc[task.file] = acc[task.file] || [];
    acc[task.file].push(task);
    return acc;
  }, {});

  const cleanPath = (fullPath) => {
    const parts = fullPath.split("axon");
    return parts.length > 1 ? parts[1].replaceAll("\\", "/") : fullPath;
  };

  return (
    <div className="space-y-6 mt-10 text-white mr-20">
      
      <div>
      <h3 className="text-2xl font-semibold text-white">
            <span className="text-[#C2C2C2] font-medium">Code Quality</span> Audits
        </h3>
        <p className="text-gray-400 text-sm mt-2">
          These tasks identify important code issues like <span className="text-[#E45454] font-medium">ESLint warnings</span>, 
          <span className="text-[#CAF5BB] font-medium"> complex logic</span>, or 
          <span className="text-[#3E8EF7] font-medium"> bad practices</span>. 
        </p>
      </div>
        
     

      {Object.entries(grouped).map(([file, taskList], idx) => (
        <details
          key={idx}
          className="border border-gray-700 rounded-xl bg-[#21262D] shadow-sm transition-all duration-300 overflow-hidden group"
        >
          <summary className="cursor-pointer select-none px-5 py-4 font-semibold text-white hover:bg-gray-800 flex items-center gap-3 justify-between">
            <div className="flex justify-center items-center gap-3">
            <FileText size={18} className="text-gray-400" />
            <span className="truncate text-sm text-[#C6C6C6]">{cleanPath(file)}</span>
            </div>
            

            <div className="flex justify-center items-center gap-2">
            <Icon icon="duo-icons:bug" width="20" height="20"  style={{color: "#E45454"}} />
            <span className="ml-auto text-sm text-gray-500">{taskList.length} issue(s)</span>
            </div>
            
          </summary>

          <ul className="px-6 py-4 space-y-4 bg-[#21262D]">
            {taskList.map((task, i) => {
              const style = SEVERITY_STYLES[task.severity] || SEVERITY_STYLES[1];

              return (
                <li key={i} className="bg-[#1B2027] p-4 rounded-lg shadow flex flex-col gap-2 border border-gray-700">
                  <div className="flex items-center gap-3 text-sm text-gray-300">
                    <span className="text-[#519CFF]">@ Line {task.line}</span>
                    <span className={`ml-auto flex items-center gap-1 text-xs font-medium px-2 py-2 rounded-full ${style.color}`}>
                      {style.icon}
                    
                    </span>
                  </div>


                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-gray-100 leading-snug">
                      {task.description !== "none" ? task.description : "No description provided."}
                    </p>

                    {task.fileContent && (
  <div className="bg-[#1c1c1c] rounded-md overflow-hidden border border-[#292929] mt-2">
    <div className="text-xs font-mono text-gray-300">
      {task.fileContent
        .slice(Math.max(0, task.line - 3), task.line + 2)
        .map((line, idx, arr) => {
          const displayLine = Math.max(0, task.line - 3) + idx + 1; // actual line number (1-based)
          const isErrorLine = displayLine === task.line;

          return (
            <div
              key={idx}
              className={`flex px-4 py-1 ${
                isErrorLine
                  ? 'bg-[#2f1f1f] border-l-4 border-[#FF6B6B]'
                  : 'bg-[#1c1c1c]'
              }`}
            >
              <span className="w-10 text-right pr-3 text-gray-500 select-none">
                {displayLine}
              </span>
              <code className="whitespace-pre-wrap text-sm text-gray-200">
                {line}
              </code>
            </div>
          );
        })}
    </div>
  </div>
)}


                  </div>

                </li>
              );
            })}
          </ul>
        </details>
      ))}
    </div>
  );
};

export default CriticalTasksAccordion;
