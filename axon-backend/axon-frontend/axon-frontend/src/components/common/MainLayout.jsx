import React from 'react';
import DashboardSidebar from './DashboardSidebar'; // adjust path as needed
import Header from './Header';
import MentorChatWidget from '../MentorChatWidget';

const MainLayout = ({ children, user, repoId }) => {
  return (
    <div className="flex h-screen overflow-hidden relative">
      <DashboardSidebar user={user} repoId={repoId} />
      <main className="flex-grow overflow-y-auto bg-[#1B2027]">
        <Header user={user} />
        {children}
      </main>
      {repoId && <MentorChatWidget repoId={repoId} />}
    </div>
  );
};

export default MainLayout;
