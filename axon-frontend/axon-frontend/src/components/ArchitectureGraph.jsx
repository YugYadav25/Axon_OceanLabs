import { useEffect, useState, useRef } from 'react';
import Cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import CytoscapeComponent from 'react-cytoscapejs';
import axios from 'axios';

Cytoscape.use(dagre);

export default function ArchitectureGraph({ repoId }) {
  const [elements, setElements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cyRef = useRef(null);

  useEffect(() => {
    if (!repoId) return;
    async function fetchGraph() {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/docs/architecture/${encodeURIComponent(repoId)}`
        );
        const graphRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}${res.data.jsonUrl}`);
        const raw = graphRes.data.elements || [];

        // Strip compound parent references (prevents the giant grouped boxes)
        const flat = raw.map(el => {
          if (el.data?.parent) {
            const { parent, ...rest } = el.data;
            return { ...el, data: rest };
          }
          return el;
        });

        // Remove unlabelled container nodes
        const clean = flat.filter(el =>
          el.data?.source || (el.data?.label && el.data.label.trim() !== '')
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
      name: 'dagre',
      rankDir: 'TB',
      nodeSep: 55,
      edgeSep: 15,
      rankSep: 100,
      fit: true,
      padding: 50,
      animate: true,
      animationDuration: 500,
    }).run();
    cy.ready(() => cy.fit(undefined, 50));
  }, [elements]);

  // High-complexity nodes (C > 30) get a subtle red border — only one exception
  const highComplexStyles = elements
    .filter(el => {
      if (!el.data?.label || el.data?.source) return false;
      const m = el.data.label.match(/C=(\d+)/);
      return m && parseInt(m[1]) > 30;
    })
    .map(el => ({
      selector: `node[id="${el.data.id}"]`,
      style: {
        'border-color': '#E45454',
        'border-width': 2,
        color: '#FFAAAA',
      },
    }));

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-[#9CA3AF]">
      <div className="w-7 h-7 border-2 border-[#3A3838] border-t-[#2F89FF] rounded-full animate-spin" />
      <p className="text-xs font-medium tracking-widest uppercase">Building graph…</p>
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
    <div style={{ width: '100%', height: '100%' }}>
      <CytoscapeComponent
        cy={cy => { cyRef.current = cy; }}
        elements={elements}
        style={{ width: '100%', height: '100%' }}
        zoomingEnabled userZoomingEnabled userPanningEnabled
        minZoom={0.1} maxZoom={3}
        boxSelectionEnabled={false}
        stylesheet={[
          // ── Nodes: match site's dark card aesthetic ──────────────────────
          {
            selector: 'node',
            style: {
              shape: 'roundrectangle',
              'background-color': '#292E37',        // site card background
              'border-color': '#2F89FF',             // site's primary blue accent
              'border-width': 1,
              label: 'data(label)',
              'text-valign': 'center',
              'text-halign': 'center',
              color: '#E2E8F0',                      // light text on dark bg
              'font-size': 11,
              'font-family': 'Manrope, system-ui, sans-serif',
              'font-weight': 600,
              'text-wrap': 'wrap',
              'text-max-width': 120,
              'padding-top': '10px',
              'padding-bottom': '10px',
              'padding-left': '14px',
              'padding-right': '14px',
              width: 'label',
              height: 'label',
              'min-width': 85,
              'min-height': 36,
            },
          },
          // ── Selected node ─────────────────────────────────────────────
          {
            selector: 'node:selected',
            style: {
              'border-width': 2.5,
              'border-color': '#CAF5BB',             // site's green accent for selection
              color: '#CAF5BB',
            },
          },
          // ── High-complexity warning (only C>30) ─────────────────────
          ...highComplexStyles,
          // ── Edges ────────────────────────────────────────────────────
          {
            selector: 'edge',
            style: {
              width: 1.2,
              'line-style': 'solid',
              'line-color': '#3A3838',               // subtle, site border color
              'target-arrow-color': '#4B5563',
              'target-arrow-shape': 'triangle',
              'arrow-scale': 0.8,
              'curve-style': 'bezier',
              label: '',                             // labels off by default = clean
            },
          },
          // ── Selected edge — show relationship label ───────────────────
          {
            selector: 'edge:selected',
            style: {
              'line-color': '#2F89FF',
              'target-arrow-color': '#2F89FF',
              width: 2,
              label: 'data(relationship)',
              color: '#B1E3FF',
              'font-size': 10,
              'font-family': 'Manrope, system-ui, sans-serif',
              'text-rotation': 'none',
              'text-background-color': '#21262D',
              'text-background-opacity': 1,
              'text-background-padding': '4px',
            },
          },
        ]}
      />
    </div>
  );
}
