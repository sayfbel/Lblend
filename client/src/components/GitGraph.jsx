import React, { useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Handle, 
  Position 
} from 'reactflow';
import 'reactflow/dist/style.css';

const CommitNode = ({ data }) => (
    <div style={{ 
        padding: '12px', 
        borderRadius: '12px', 
        background: '#ffffff', 
        border: '2px solid var(--secondary)',
        fontSize: '0.75rem',
        width: '180px',
        boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
        position: 'relative'
    }}>
        <Handle type="target" position={Position.Left} style={{ background: 'var(--secondary)' }} />
        <div style={{ 
            fontSize: '0.5rem', 
            fontWeight: '900', 
            color: 'white', 
            background: 'var(--secondary)', 
            padding: '2px 8px', 
            borderRadius: '100px',
            position: 'absolute',
            top: '-10px',
            left: '10px',
            letterSpacing: '1px'
        }}>
            {data.branchName.toUpperCase()}
        </div>
        <div style={{ fontWeight: '800', color: 'var(--secondary)', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '5px' }}>
            {data.message}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: 'var(--accent-dark)', fontWeight: '800', fontSize: '0.6rem', fontFamily: 'monospace' }}>
                {data.sha.substring(0, 7)}
            </div>
            <div style={{ fontSize: '0.55rem', opacity: 0.6, fontWeight: '700' }}>
                {data.author}
            </div>
        </div>
        <Handle type="source" position={Position.Right} style={{ background: 'var(--secondary)' }} />
    </div>
);

const nodeTypes = {
    commit: CommitNode,
};

const GitGraph = ({ data }) => {
    const { nodes, edges } = useMemo(() => {
        const nodes = [];
        const edges = [];
        
        const branchColors = ['#004842', '#E6D04C', '#64748b', '#e11d48', '#34d399'];
        
        data.branches.forEach((branch, bIdx) => {
            const yPos = bIdx * 200; // Vertical spacing between branches
            
            branch.commits.forEach((commit, cIdx) => {
                const nodeId = `${branch.name}-${commit.sha}`;
                nodes.push({
                    id: nodeId,
                    type: 'commit',
                    data: { ...commit, branchName: branch.name },
                    position: { x: cIdx * 250, y: yPos }, // Horizontal flow
                });
                
                // Connect to next commit in same branch (horizontal connection)
                if (cIdx < branch.commits.length - 1) {
                    edges.push({
                        id: `edge-${nodeId}-${branch.commits[cIdx+1].sha}`,
                        source: nodeId,
                        target: `${branch.name}-${branch.commits[cIdx+1].sha}`,
                        animated: true,
                        style: { stroke: branchColors[bIdx % branchColors.length], strokeWidth: 3 },
                    });
                }
            });
        });
        
        return { nodes, edges };
    }, [data]);

    return (
        <div style={{ height: '600px', width: '100%', background: '#fcfcfc', borderRadius: '30px', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'inset 0 0 40px rgba(0,0,0,0.02)' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView
                zoomOnScroll={false}
                preventScrolling={false}
            >
                <Background color="#004842" variant="dots" gap={20} size={1} opacity={0.1} />
                <Controls showInteractive={false} />
            </ReactFlow>
        </div>
    );
};

export default GitGraph;
