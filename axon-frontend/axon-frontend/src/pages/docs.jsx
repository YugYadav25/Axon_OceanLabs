import { useParams } from 'react-router-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react'; // ✅ FIXED

import MainLayout from '../components/common/MainLayout';
import ArchitectureGraph from '../components/ArchitectureGraph';

export default function DocsArchitecture() {
  const { repoId } = useParams();
  const decodedRepoId = decodeURIComponent(repoId);
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const incomingUser = location.state?.user;

    if (!incomingUser || !repoId) {
      navigate('/selectrepo');
      return;
    }

    setUser(incomingUser);
    setUserId(incomingUser.id);
  }, []);

  return (
    <MainLayout user={user} repoId={repoId}>

          <section className="mb-8 p-20">
           <h3 className="text-3xl font-semibold text-white mb-2">
      <span className="text-[#C2C2C2] font-medium">Repository</span> Architecture
    </h3>
    <p className="text-l text-[#D6D6D6] mb-10">Structure and relationship between modules</p>
           
           <div className="w-full h-[500px] bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <ArchitectureGraph repoId={repoId} />
          </div>
           
          </section>
       
      </MainLayout>
  );
}
