import axios from 'axios';
import html2canvas from 'html2canvas';
import { useRef, useState, useEffect } from 'react';
import { Icon } from '@iconify-icon/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Profile from '../assets/pfp.png'; // Adjust path
import jsPDF from 'jspdf';

export default function ResumeSection({
  user,
  username,
  repoId,
  role,
  setRole,
  projectName,
  setProjectName,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  resumeSection,
  setResumeSection,
  loading,
  setLoading,
  setError,
}) {
  const cardRef = useRef();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (resumeSection) {
      console.log('📌 resumeSection ready:', resumeSection);
      setShowModal(true);
    }
  }, [resumeSection]);

  const generateResumeSection = async () => {
    if (!user || !repoId) return;
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/personal-branding/resume-section`,
        {
          repoUrl: `https://github.com/${repoId}`,
          repoId,
          userId: user.id,
          role,
          projectName,
          startDate,
          endDate,
        }
      );
      console.log('✅ API response:', response.data);
      setResumeSection(response.data.resumeSection);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to generate resume section');
    } finally {
      setLoading(false);
    }
  };

  const downloadCard = async () => {
    if (!cardRef.current) return;

    // Expand markdown content to show all before capture
    const markdownContainer = cardRef.current.querySelector('.scrollable-markdown');
    const originalHeight = markdownContainer.style.maxHeight;
    const originalOverflow = markdownContainer.style.overflow;

    // Temporarily expand
    markdownContainer.style.maxHeight = 'none';
    markdownContainer.style.overflow = 'visible';

    // Wait for layout
    await new Promise((resolve) => setTimeout(resolve, 100));

    const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        backgroundColor: null,
        scale: 2,
    });

    const imgData = canvas.toDataURL('image/png');

    // Restore scroll styles
    markdownContainer.style.maxHeight = originalHeight;
    markdownContainer.style.overflow = originalOverflow;

    // Option 1: Download as PNG
    const link = document.createElement('a');
    link.download = `${username || 'contribution'}-card.png`;
    link.href = imgData;
    link.click();

    // Option 2: Download as PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${username || 'contribution'}-card.pdf`);
};


  return (
    <div className="relative text-white rounded-lg mb-6">
      {/* Full-screen loader with blur */}
      {loading && (
        <div className="fixed inset-0 z-40 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <Icon icon="eos-icons:loading" className="text-white w-12 h-12 animate-spin" />
            <p className="text-white font-medium">Generating card…</p>
          </div>
        </div>
      )}

      {/* Header */}
      <h2 className="text-l text-[#C2C2C2] font-medium mb-6">
        Turn Your Work Into a <br />
        <span className="text-white font-semibold text-xl">Shareable Resume Snippet</span>
      </h2>

      {/* Input Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Role</label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-gray-800 text-white border border-gray-700"
            placeholder="e.g., Frontend Developer"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Project Name</label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-gray-800 text-white border border-gray-700"
            placeholder="e.g., E-commerce Platform"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-gray-800 text-white border border-gray-700"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-gray-800 text-white border border-gray-700"
          />
        </div>
      </div>

      <button
        onClick={generateResumeSection}
        disabled={loading}
        className="bg-[#2F89FF] hover:bg-[#2F89FF]/30 text-white px-6 py-2 rounded disabled:opacity-50"
      >
        Generate Contribution Card
      </button>

      {/* Modal */}
      {showModal && resumeSection && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center px-10">
        <div className="relative w-full max-w-4xl bg-[#1B2027] rounded-2xl shadow-lg p-6 border border-gray-700">
            <div
              ref={cardRef}
              className="text-white rounded-2xl p-6"
            >
              {/* Header */}
              <div className="flex items-center gap-4 mb-4">
                <img src={Profile} alt="Profile" className="w-14 h-14 rounded-full" />
                <div>
                  <h3 className="text-xl font-semibold">@{username}</h3>
                  <a
                    href={`https://github.com/${username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:underline"
                  >
                    github.com/{username}
                  </a>
                </div>
              </div>

              {/* Project Details */}
              <div className="mb-4">
                <h4 className="text-lg font-bold">Project: {projectName}</h4>
                <p className="text-sm text-gray-300 mb-1">Role: {role}</p>
                <p className="text-sm text-gray-400">{startDate} — {endDate}</p>
              </div>

              {/* Render Markdown Resume */}
              <div className="bg-[#21262D] rounded-lg p-4 text-sm whitespace-pre-wrap overflow-x-auto max-h-[300px] overflow-y-auto custom-scroll scrollable-markdown">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                    h1: ({ children }) => <h1 className="text-2xl font-bold mb-3">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-semibold mb-2">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-lg font-semibold mb-2">{children}</h3>,
                    p: ({ children }) => <p className="text-sm mb-2">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    ul: ({ children }) => <ul className="list-disc list-inside ml-4">{children}</ul>,
                    li: ({ children }) => <li className="mb-1">{children}</li>,
                    a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                        {children}
                        </a>
                    ),
                    }}
                >
                    {resumeSection}
                </ReactMarkdown>
                </div>


              {/* Footer */}
              <div className="mt-4 text-sm">
                🔗{' '}
                <a
                  href={`https://github.com/${repoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  View GitHub Repo
                </a>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-xs"
              >
                Close
              </button>
              <button
                onClick={downloadCard}
                className="bg-[#2F89FF] hover:bg-blue-700 text-white px-4 py-2 rounded text-xs"
              >
                Download Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
