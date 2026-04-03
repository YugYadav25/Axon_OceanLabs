import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import MainLayout from '../components/common/MainLayout';
import ArchitectureGraph from '../components/ArchitectureGraph';

export default function DocsArchitecture() {
  const { repoId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const incomingUser = location.state?.user;
    if (!incomingUser || !repoId) { navigate('/selectrepo'); return; }
    setUser(incomingUser);
  }, []);

  return (
    <MainLayout user={user} repoId={repoId}>
      <section className="mb-8 p-20">

        {/* Header */}
        <h3 className="text-3xl font-semibold text-white mb-2">
          <span className="text-[#C2C2C2] font-medium">Repository</span> Architecture
        </h3>
        <p className="text-[#D6D6D6] mb-6">
          Structure and relationship between modules.{' '}
          <span className="text-[#9CA3AF] text-sm">
            C = Cyclomatic Complexity (number of independent code paths — higher means harder to maintain).
          </span>
        </p>

        {/* Minimal legend — two data points only, styled to match the site */}
        <div className="flex items-center gap-6 mb-6 text-xs font-semibold text-[#9CA3AF]">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm border border-[#2F89FF] bg-[#292E37] inline-block" />
            Module node
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm border border-[#E45454] bg-[#292E37] inline-block" />
            High complexity (C &gt; 30) — review recommended
          </span>
          <span className="ml-auto text-[11px] text-[#4B5563] tracking-wide">
            Scroll to zoom · Drag to pan · Click edge to reveal relationship
          </span>
        </div>

        {/* Graph container — dark, matches #21262D sidebar */}
        <div
          className="w-full rounded-lg shadow-lg overflow-hidden border border-[#3A3838]"
          style={{ height: 'calc(100vh - 300px)', minHeight: 480, background: '#1B2027' }}
        >
          <ArchitectureGraph repoId={repoId} />
        </div>

      </section>
    </MainLayout>
  );
}
