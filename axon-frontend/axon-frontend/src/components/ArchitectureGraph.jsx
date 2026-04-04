import { useEffect, useState, useRef } from 'react';
import Cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import CytoscapeComponent from 'react-cytoscapejs';
import axios from 'axios';
import { ShieldAlert, Activity, GitCommit, Search, Maximize, Minimize, HelpCircle } from 'lucide-react';

Cytoscape.use(fcose);

export default function ArchitectureGraph({ repoId }) {
  const [elements, setElements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [focusMode, setFocusMode] = useState('all'); // 'all' | 'security' | 'complexity'
  const cyRef = useRef(null);
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => console.log(err));
    } else {
      document.exitFullscreen().catch(err => console.log(err));
    }
  };

  useEffect(() => {
    if (!repoId) return;
    async function fetchGraph() {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/docs/architecture/${encodeURIComponent(repoId)}`
        );
        const graphRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}${res.data.jsonUrl}`);
        const raw = graphRes.data.elements || [];

        // We DO NOT strip compound parent references anymore!
        // Grouping into modules makes it vastly easier for juniors/interns to understand.

        // Just remove unlabelled nodes
        const clean = raw.filter(el =>
          el.data?.source || (el.data?.label && el.data.label.trim() !== '') || el.classes === 'module'
        );

        setElements(clean);
      } catch (err) {
        console.error('Error loading architecture graph:', err);
        setError('Failed to load architecture data.');
      } finally {
        setLoading(false);
      }
    }
    fetchGraph();
  }, [repoId]);

  useEffect(() => {
    if (!cyRef.current || !elements.length) return;
    const cy = cyRef.current;

    cy.layout({
      name: 'fcose',
      quality: 'default',
      randomize: true,
      animate: true,
      animationDuration: 800,
      fit: true,
      padding: 50,
      nodeDimensionsIncludeLabels: true,
      idealEdgeLength: edge => 100,
      nodeSeparation: 60,
    }).run();

    cy.ready(() => cy.fit(undefined, 50));
  }, [elements]);

  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;

    // Reset all
    cy.elements().removeClass('dimmed highlighted security-focus complexity-focus');

    if (focusMode === 'security') {
      cy.nodes().addClass('dimmed');
      cy.edges().addClass('dimmed');
      const targets = cy.nodes().filter(node => node.data('httpEndpoint') || node.data('invokesDBQuery') || node.data('invokesAPI'));
      targets.removeClass('dimmed').addClass('security-focus');
      targets.connectedEdges().removeClass('dimmed');
      targets.ancestors().removeClass('dimmed');
    } else if (focusMode === 'complexity') {
      cy.nodes().addClass('dimmed');
      cy.edges().addClass('dimmed');
      const targets = cy.nodes().filter(node => parseInt(node.data('complexity') || 0) > 10);
      targets.removeClass('dimmed').addClass('complexity-focus');
      targets.connectedEdges().removeClass('dimmed');
      targets.ancestors().removeClass('dimmed');
    }
  }, [focusMode, elements]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-[#9CA3AF]">
      <div className="w-7 h-7 border-2 border-[#3A3838] border-t-[#2F89FF] rounded-full animate-spin" />
      <p className="text-xs font-medium tracking-widest uppercase">Building Graph Structure…</p>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-full text-[#E45454] text-sm font-medium">{error}</div>
  );

  if (!elements.length) return (
    <div className="flex items-center justify-center h-full text-[#9CA3AF] text-sm">
      No architecture data available for this repository.
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-[#161B22] ${isFullscreen ? 'fixed inset-0 z-[100]' : ''}`}
      style={{
        backgroundImage: 'radial-gradient(circle, #30363D 1.5px, transparent 1.5px)',
        backgroundSize: '24px 24px'
      }}
    >
      {/* Intern/Security Tools Overlay */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={() => setFocusMode('all')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${focusMode === 'all' ? 'bg-[#2F89FF] text-white border-[#2F89FF]' : 'bg-[#21262D] text-gray-300 border-[#30363D] hover:bg-[#30363D]'}`}
        >
          <Search className="w-3.5 h-3.5" /> Full View
        </button>
        <button
          onClick={() => setFocusMode('security')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${focusMode === 'security' ? 'bg-[#E45454]/20 text-[#E45454] border-[#E45454]' : 'bg-[#21262D] text-gray-300 border-[#30363D] hover:bg-[#30363D]'}`}
          title="Highlight APIs and DB Queries (Attack Vectors)"
        >
          <ShieldAlert className="w-3.5 h-3.5" /> Threat Surface (Intern Mode)
        </button>
        <button
          onClick={() => setFocusMode('complexity')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${focusMode === 'complexity' ? 'bg-[#FFAA00]/20 text-[#FFAA00] border-[#FFAA00]' : 'bg-[#21262D] text-gray-300 border-[#30363D] hover:bg-[#30363D]'}`}
          title="Highlight complex logic functions (>10 CC)"
        >
          <Activity className="w-3.5 h-3.5" /> Hotspots
        </button>
        <div className="w-px h-8 bg-[#30363D] mx-1"></div>
        <button
          onClick={toggleFullscreen}
          className="flex items-center justify-center gap-1.5 p-1.5 px-3 rounded-lg text-xs font-medium text-gray-300 border border-[#30363D] bg-[#21262D] hover:bg-[#30363D] transition-colors"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? (
            <><Minimize className="w-3.5 h-3.5" /> Exit Fullscreen</>
          ) : (
            <><Maximize className="w-3.5 h-3.5" /> Fullscreen</>
          )}
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 group">
        <button className="flex items-center gap-2 px-3 py-2 bg-[#21262D] border border-[#30363D] rounded-full text-xs font-medium text-gray-400 hover:text-gray-200 hover:border-gray-500 transition-colors shadow-lg">
          <HelpCircle className="w-4 h-4" />
          <span>Legend</span>
        </button>

        <div className="absolute bottom-full left-0 mb-3 w-64 bg-[#21262D]/95 backdrop-blur-md border border-[#30363D] rounded-xl p-4 text-xs text-gray-400 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 origin-bottom-left shadow-2xl">
          <div className="font-semibold text-gray-200 mb-3 text-sm">Graph Legend</div>
          <div className="flex items-center gap-2 mb-1.5"><div className="w-3 h-3 border border-dashed border-gray-500 bg-transparent rounded-sm"></div> Module boundary</div>
          {/* Node complexity tiers */}
          <div className="flex items-center gap-2 mb-1.5"><div className="w-3 h-3 rounded-sm" style={{ background: '#1E3A5F', border: '2px solid #38BDF8' }}></div> Simple function</div>
          <div className="flex items-center gap-2 mb-1.5"><div className="w-3 h-3 rounded-sm" style={{ background: '#1D4ED8', border: '2px solid #60A5FA' }}></div> Moderate complexity</div>
          <div className="flex items-center gap-2 mb-1.5"><div className="w-3 h-3 rounded-sm" style={{ background: '#7C3AED', border: '2px solid #A78BFA' }}></div> High complexity ⚠️</div>
          {/* Edge types */}
          <div className="mt-3 pt-3 border-t border-[#30363D]">
            <div className="font-semibold text-gray-200 mb-2">Connections</div>
            <div className="flex items-center gap-2 mb-1.5"><div className="w-5 h-0.5" style={{ background: '#4ADE80' }}></div> Intra-module component</div>
            <div className="flex items-center gap-2 mb-1.5"><div className="w-5 h-0.5" style={{ background: '#38BDF8' }}></div> Intra-module call</div>
            <div className="flex items-center gap-2 mb-1.5"><div className="w-5 h-0.5 border-t-2" style={{ borderColor: '#F59E0B' }}></div> Cross-module component</div>
            <div className="flex items-center gap-2 mb-1.5"><div className="w-5 h-0.5 border-t-2" style={{ borderColor: '#FB923C' }}></div> Cross-module call</div>
          </div>
          <div className="mt-3 pt-2 border-t border-[#30363D] text-[10px] italic text-[#8B949E]">
            Tip: Click a node to see its connections.
          </div>
        </div>
      </div>

      <CytoscapeComponent
        cy={cy => { cyRef.current = cy; }}
        elements={elements}
        style={{ width: '100%', height: '100%' }}
        zoomingEnabled userZoomingEnabled userPanningEnabled
        minZoom={0.05} maxZoom={3}
        boxSelectionEnabled={false}
        stylesheet={[
          // ── Module Compound Nodes (Glassmorphic Container) ──────────────
          {
            selector: '.module',
            style: {
              shape: 'roundrectangle',
              'background-color': '#080C14',        // Deep space dark
              'background-opacity': 0.5,            // Glassmorphic transparency
              'border-width': 1,
              'border-color': '#1E293B',            // Subtle slate border
              'border-style': 'solid',
              'label': 'data(label)',
              'color': '#64748B',                   // Muted label
              'font-size': 11,
              'font-family': '"SF Pro Display", "Inter", sans-serif',
              'text-transform': 'uppercase',
              'font-weight': 700,
              'letter-spacing': 2,
              'text-valign': 'top',
              'text-halign': 'center',
              'text-margin-y': -12,
              'padding': 35,
              // Shadow for depth
              'shadow-blur': 30,
              'shadow-color': '#000000',
              'shadow-opacity': 0.6,
              'shadow-offset-y': 10
            }
          },
          // ── Standard Nodes (Sleek Dark Cards) ─────────────────────────
          {
            selector: 'node:childless',
            style: {
              shape: 'roundrectangle',
              'background-color': '#0F172A',        // Slate 900
              'border-width': 1.5,
              label: 'data(label)',
              'text-valign': 'center',
              'text-halign': 'center',
              color: '#F8FAFC',                     // Crisp white text
              'font-size': 10.5,
              'font-family': '"Inter", system-ui, sans-serif',
              'font-weight': 500,
              'text-wrap': 'wrap',
              'text-max-width': 120,
              'padding': 16,
              width: 'label',
              height: 'label',
              'min-width': 90,
              // Base shadow
              'shadow-blur': 15,
              'shadow-opacity': 0.3,
              'shadow-offset-y': 4
            },
          },
          // ── Dynamic Glow Based on Complexity ──────────────────────────
          {
            selector: 'node:childless[complexity >= 15]',
            style: {
              'shadow-color': '#A78BFA', // Neon purple glow
              'shadow-opacity': 0.6,
              'shadow-blur': 25,
              color: '#E9D5FF'           // Bright purple text
            }
          },
          {
            selector: 'node:childless[complexity >= 8][complexity < 15]',
            style: {
              'shadow-color': '#60A5FA', // Electric blue glow
              'shadow-opacity': 0.5,
              'shadow-blur': 20,
              color: '#BFDBFE'
            }
          },
          {
            selector: 'node:childless[complexity < 8]',
            style: {
              'shadow-color': '#38BDF8', // Soft cyan glow
              'shadow-opacity': 0.3,
              'shadow-blur': 15
            }
          },
          // ── Selected node (Intense Glow) ──────────────────────────────
          {
            selector: 'node:selected',
            style: {
              'border-width': 2,
              'border-color': '#4ADE80',
              'background-color': '#064E3B',         // Deep green pulse
              color: '#A7F3D0',                      // Bright green text
              'shadow-color': '#4ADE80',
              'shadow-blur': 30,
              'shadow-opacity': 0.8
            },
          },
          // ── Custom Focus Classes (Security & Complexity) ──────────────
          {
            selector: '.dimmed',
            style: {
              opacity: 0.1
            }
          },
          {
            selector: 'node.security-focus',
            style: {
              'border-color': '#EF4444',             // Danger red
              'border-width': 2,
              'background-color': '#450A0A',
              color: '#FCA5A5',
              'shadow-color': '#EF4444',
              'shadow-blur': 30,
              'shadow-opacity': 0.9,
              'shadow-offset-y': 0
            }
          },
          {
            selector: 'node.complexity-focus',
            style: {
              'border-color': '#F59E0B',             // Warning amber
              'border-width': 2,
              'background-color': '#451A03',
              color: '#FDE68A',
              'shadow-color': '#F59E0B',
              'shadow-blur': 30,
              'shadow-opacity': 0.9,
              'shadow-offset-y': 0
            }
          },
          // ── Edges (Cyberpunk "Taxi" Routing) ──────────────────────────
          {
            selector: 'edge',
            style: {
              width: 2,
              'line-style': 'solid',
              'curve-style': 'taxi',
              'taxi-direction': 'auto',
              'taxi-turn': 20,
              'taxi-turn-min-distance': 15,
              'line-color': '#6B7280',               // Fallback inline color
              'target-arrow-color': '#6B7280',
              'target-arrow-shape': 'triangle',
              'arrow-scale': 1.1,
              label: '',
              // Subtle edge glow
              'shadow-blur': 8,
              'shadow-opacity': 0.3,
            },
          },
          // ── Edge Edge-Type Glows ──────────────────────────────────────
          {
            selector: 'edge[edgeType="cross-component"]',
            style: { 'shadow-color': '#F59E0B', 'shadow-opacity': 0.4 } // Amber glow
          },
          {
            selector: 'edge[edgeType="intra-component"]',
            style: { 'shadow-color': '#4ADE80', 'shadow-opacity': 0.2 } // Green shadow
          },
          {
            selector: 'edge[edgeType="cross-call"]',
            style: { 'shadow-color': '#FB923C', 'shadow-opacity': 0.4 } // Orange-red glow
          },
          {
            selector: 'edge[edgeType="intra-call"]',
            style: { 'shadow-color': '#38BDF8', 'shadow-opacity': 0.2 } // Sky blue glow
          },
          // ── Selected edge (Laser Focus) ────────────────────────────────
          {
            selector: 'edge:selected',
            style: {
              'line-color': '#F8FAFC',
              'target-arrow-color': '#F8FAFC',
              width: 3,
              label: 'data(relationship)',
              color: '#0F172A',
              'font-size': 10,
              'font-family': '"SF Pro Display", monospace',
              'font-weight': 600,
              'text-background-color': '#F8FAFC',     // Bright white pill background
              'text-background-opacity': 1,
              'text-background-padding': '6px',
              'text-background-shape': 'roundrectangle',
              'shadow-color': '#F8FAFC',
              'shadow-blur': 25,
              'shadow-opacity': 0.8
            },
          },
        ]}
      />
    </div>
  );
}
