import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import MainLayout from '../components/common/MainLayout';

export default function Dashboard() {
  const { repoId } = useParams(); // Get from route param
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  useEffect(() => {
    const user = location.state?.user;

    if (!user || !repoId) {
      navigate('/selectrepo');
      return;
    }

    setUser(user);
  }, [location.state, repoId, navigate]);

  if (!user) return null; // avoid rendering until user is confirmed

  return (
    <MainLayout user={user} repoId={repoId}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-black">
          Dashboard for <span className="text-[#2F89FF] break-all">{repoId}</span>
        </h2>


      </div>

      {/* Body Section */}
      <section className="bg-white border border-gray-200 rounded-xl shadow p-4 sm:p-6">
        <p className="text-gray-700 text-sm sm:text-base">
          Use the sidebar to navigate to <strong>Docs</strong> or <strong>Onboard</strong> tools
          for this repository.
        </p>
      </section>
    </MainLayout>
  );
}
