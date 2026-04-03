import { Icon } from '@iconify-icon/react';
import { format, parseISO } from 'date-fns';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function GitHubInsights({ githubUsername, githubInsights }) {
    const totalCommits = githubInsights.contributions.commits.length;
    const totalPRs = githubInsights.metrics.totalPRs;
    const mergedPRs = githubInsights.metrics.mergedPRs;
    const totalAdditions = githubInsights.metrics.totalAdded;
    const totalDeletions = githubInsights.metrics.totalDeleted;
    const commitsPerDay = githubInsights.metrics.commitsPerDay;
    const commits = githubInsights.contributions.commits;
    const techData = githubInsights.metrics.techDistribution;

    const COLORS = ['#2F89FF', '#B1E3FF', '#CAF5BB', '#F6F6F6', '#95A4FC']; // Or any colors you like

    const topTechArray = Object.entries(techData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tech, value], index) => ({
        name: tech,
        value: value,
        color: COLORS[index % COLORS.length],
    }));


    const commitSummaryArray = commits.map(commit => {
    const dateObj = new Date(commit.date);
    const datePart = dateObj.toISOString().split('T')[0]; // e.g. '2025-02-14'
    const timePart = dateObj.toISOString().split('T')[1].replace('Z', ''); // e.g. '15:25:03'

    return {
        message: commit.message,
        date: datePart,
        time: timePart,
        additions: commit.stats.additions,
        deletions: commit.stats.deletions
    };
    });


  const contributionsPerMonth = Object.entries(commitsPerDay)
  .sort(([a], [b]) => new Date(a) - new Date(b))
  .map(([date, value]) => ({
    month: format(parseISO(date), 'MMM d'), // e.g., "Feb 13"
    value,
  }));

  

const MAX_VALUE = Math.max(0, ...contributionsPerMonth.map(c => c.value));
const SCALE_FACTOR = 30;

  return (
    <div className=" space-y-6 text-white">
     
     <div className="flex flex-row gap-6">
  {/* Left - Stat Boxes (30%) */}
  <div className="w-2/5 grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div className="bg-[#4897FF] rounded-xl p-5 text-left py-6">
      <p className='text-sm'>Commits</p>
      <div className='flex lfex-row justify-between items-center'>
        <p className="text-2xl font-semibold">{totalCommits}</p>
        <Icon icon="material-symbols:commit-rounded" width="40" height="40"  style={{color: "#E6E6E6"}} />
      </div>
    </div>
    <div className="bg-[#F7F9FB]/10 rounded-xl p-5 text-left py-6">
      <p className='text-sm'>PRs Merged</p>
       <div className='flex lfex-row justify-between items-center'>
        <p className="text-2xl font-semibold">{mergedPRs}/{totalPRs}</p>
        <Icon icon="si:pull-request-duotone" width="40" height="40"  style={{color: "#E6E6E6"}} />
      </div>
    </div>

    <div className="bg-[#F7F9FB]/10 rounded-xl p-5 text-left py-6">
      <p  className='text-sm'>Additions</p>
      <div className='flex lfex-row justify-between items-center'>
        <p className="text-2xl font-semibold">+{totalAdditions}</p>
        <Icon icon="lets-icons:in" width="35" height="35"  style={{color: "#E6E6E6"}} />
      </div>
    </div>
    <div className="bg-[#4897FF] rounded-xl p-5 text-left py-6">
      <p className='text-sm'>Deletions</p>
      <div className='flex lfex-row justify-between items-center'>
        <p className="text-2xl font-semibold">-{totalDeletions}</p>
        <Icon icon="lets-icons:out" width="35" height="35"  style={{color: "#E6E6E6"}} />
      </div>
    </div>
  </div>

  {/* Right - Chart (70%) */}
 <div className="w-3/5 bg-gray-800 rounded-xl p-4">
  <h3 className="text-md mb-4 font-semibold text-white">Contributions per Day</h3>
  <div className="flex">
    {/* Y-Axis */}
    <div className="flex flex-col justify-between h-40 pr-2 text-xs text-gray-400">
      {[...Array(5)].map((_, i) => {
        const val = Math.round((MAX_VALUE / 4) * (4 - i));
        return <div key={i} className="h-8 flex items-start">{val}</div>;
      })}
    </div>

    {/* Graph Area */}
    <div className="relative flex-1">
      {/* Grid Lines */}
      <div className="absolute top-0 left-0 w-full h-full flex flex-col justify-between">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="w-full border-t border-gray-700"
          />
        ))}
      </div>

      {/* Bars */}
      <div className="relative flex items-end h-40 gap-3 px-2">
        {contributionsPerMonth.map((c) => (
          <div key={c.month} className="flex flex-col items-center flex-1">
            <span className="text-xs text-white mb-1">{c.value}</span>
              <div
              className="bg-blue-500 rounded-t w-10"
              style={{
                height: `${MAX_VALUE === 0 ? 0 : (c.value / MAX_VALUE) * SCALE_FACTOR * 4}px`, // adjust for visibility
              }}
            />
            <p className="mt-1 text-[10px] text-gray-300">{c.month}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
</div>

</div>

        <div className="flex flex-row gap-6 ">

      {/* Commit Timeline */}
      <div className="w-9/12 bg-[#21262D] rounded-xl p-5">
        <h3 className="text-sm mb-5 font-semibold">Commits Timeline</h3>
        <ul className="space-y-2">
            {commitSummaryArray.slice(0, 4).map((commit, idx) => (
            <li key={idx} className="bg-[#1B2027] p-4 rounded-xl">
                <div className='flex flex-row items-center gap-2'>
                    <Icon icon="mdi:tick-circle" width="16" height="16"  style={{color: "#E6E6E6"}} />
                    <p className="text-sm">{commit.message}</p>
                </div>
                <div className='flex flex-row gap-5 mt-3'>
                    <div className='flex flex-row items-center gap-2'>
                    <p className="text-sm text-gray-400">{commit.date}</p>
                    <p className="text-sm text-gray-400">{commit.time}</p>
                    </div>
                    <div className='flex flex-row items-center gap-2'>
                   
                    <p className="text-xs text-[#CAF5BB]">+{commit.additions} Additions</p>
                    <p className="text-xs text-[#E45454]">-{commit.deletions} Deletions</p>
                    </div>
                </div>
                
            </li>
            ))}
        </ul>
        </div>


      {/* Tech Stack Breakdown */}
    <div className="w-3/12 bg-[#21262D] rounded-xl p-6">
  <h3 className="text-sm mb-5 font-semibold text-center">Tech Stack Breakdown</h3>
  <ResponsiveContainer width="100%" height={280}>
    <PieChart>
      <Pie
        data={topTechArray}
        dataKey="value"
        nameKey="name"
        cx="50%"
        cy="45%"
        outerRadius={80}       // Thinner pie
        innerRadius={50}       // Increased inner radius for slim shape
        paddingAngle={4}
        cornerRadius={10}      // Rounded edges on each segment
        label={false}
        stroke="none"
      >
        {topTechArray.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
      </Pie>
      <Tooltip
        contentStyle={{ backgroundColor: '#2d3748', border: 'none', borderRadius: 8 }}
        labelStyle={{ color: '#fff' }}
        itemStyle={{ color: '#cbd5e0' }}
      />
      <Legend
        verticalAlign="bottom"
        iconType="circle"
        iconSize={8} 
        wrapperStyle={{ color: '#e2e8f0', fontSize: '0.8 rem' }}
      />
    </PieChart>
  </ResponsiveContainer>
</div>
   
    </div>

    </div>
  );
}
