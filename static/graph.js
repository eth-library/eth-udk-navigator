let network;
let nodes, edges;

document.addEventListener('DOMContentLoaded', async function () {
    const container = document.getElementById('graph-network');

    nodes = new vis.DataSet([]);
    edges = new vis.DataSet([]);
    const networkData = { nodes, edges };

    const options = {
        physics: {
            enabled: true,
            stabilization: { iterations: 200 },
            barnesHut: {
                gravitationalConstant: -2500,
                springLength: 200,
                springConstant: 0.04,
                damping: 0.3
            }
        },
        nodes: {
            shape: 'box',
            margin: 10,
            font: { color: '#000000', face: 'Arial', size: 14 },
        },
        edges: {
            arrows: { to: { enabled: true, scaleFactor: 0.7 } },
            color: { color: '#666666', highlight: '#ff8c00' },
            smooth: { type: 'cubicBezier', roundness: 0.2 }
        },
        interaction: {
            hover: true,
            tooltipDelay: 500
        }
    };

    network = new vis.Network(container, networkData, options);

    // Load root objects
    await loadGraphRootObjects();

    // Double-click to focus graph on that node
    network.on('doubleClick', async function (params) {
        if (params.nodes.length) {
            const clickedId = params.nodes[0];
            await loadFocusedGraph(clickedId);
        }
    });

    // Handle fullscreen toggle
    setupFullscreen();

    // ✅ Auto-load specific object (e.g., sys: 12370)
    await loadFocusedGraph(12370);

    // ✅ Add window resize handling for graph redraw
    window.addEventListener('resize', function () {
        network.redraw(); // Ensure graph resizes properly
    });

    // ✅ Set focus to graph search input after all setup
    document.getElementById('graph-search-input').focus();
}); // End of DOMContentLoaded

// ✅ Load graph and apply colors + tooltips
async function loadFocusedGraph(sysId) {
    const loadingDiv = document.getElementById('graph-loading');
    const graphDiv = document.getElementById('graph-network');

    // ✅ Show spinner and hide graph
    loadingDiv.style.display = 'flex';
    graphDiv.style.display = 'none';

    const startTime = Date.now(); // Record start time

    const response = await fetch(`/graph-focused?sys=${sysId}`);
    const data = await response.json();

    nodes.clear();
    edges.clear();

    data.nodes.forEach(node => {
        const baseColor = colorByCategory(node.color);
        nodes.add({
            id: node.id,
            label: `${node.label} (${node.id})`,
            title: node.title,
            color: {
                background: baseColor.background,
                border: baseColor.border,
                highlight: { background: baseColor.background, border: baseColor.border },
                hover: { background: baseColor.background, border: baseColor.border }
            }
        });
    });

    data.edges.forEach(edge => edges.add({ from: edge.from, to: edge.to }));

    // ✅ Ensure spinner is shown at least 1 second
    const elapsedTime = Date.now() - startTime;
    const remainingTime = Math.max(0, 300 - elapsedTime); // Calculate remaining time to 1s

    setTimeout(() => {
        // ✅ Hide spinner and show graph after minimum 1 second
        loadingDiv.style.display = 'none';
        graphDiv.style.display = 'block';

        // Auto-focus on main node (centered)
        network.focus(sysId, { scale: 1.5, animation: true });
    }, remainingTime);
}


// Color category mapper
function colorByCategory(category) {
    const colors = {
        "orange": { background: '#ffa500', border: '#ff8c00' },
        "green": { background: '#d4edda', border: '#28a745' },
        "blue": { background: '#cce5ff', border: '#0d6efd' },
        "red": { background: '#f8d7da', border: '#dc3545' },
    };
    return colors[category] || { background: '#d0e6ff', border: '#0d6efd' };
}

// Load roots for dropdown
async function loadGraphRootObjects() {
    const response = await fetch('/graph-roots');
    const rootObjects = await response.json();

    const rootSelect = document.getElementById('graph-root-selector');
    rootSelect.innerHTML = '<option value="">-- Select a root object --</option>';

    rootObjects.forEach(obj => {
        const option = document.createElement('option');
        option.value = obj.sys;
        option.textContent = `${obj.descriptor_eng} (${obj.sys})`;
        rootSelect.appendChild(option);
    });

    // Load graph when selected
    rootSelect.addEventListener('change', function () {
        const selectedSys = this.value;
        if (selectedSys) {
            loadFocusedGraph(selectedSys);
        }
    });
}

// ✅ Updated search with Top Picks and All Results
async function searchGraphObjects(query) {
    const resultsList = document.getElementById('graph-search-results');
    resultsList.innerHTML = '';
    if (query.length < 3) return;

    const response = await fetch(`/search?q=${encodeURIComponent(query)}`);
    const resultObj = await response.json();

    const { top_picks, other_results } = resultObj;

    // Top Picks Section
    if (top_picks.length > 0) {
        const topHeader = document.createElement('li');
        topHeader.classList.add('list-group-item', 'fw-bold', 'small');
        topHeader.textContent = 'Top Picks';
        resultsList.appendChild(topHeader);

        top_picks.forEach(item => {
            const li = document.createElement('li');
            li.classList.add('list-group-item', 'list-group-item-action', 'graph-clickable');
            li.textContent = `${item.descriptor_eng} (${item.sys})`;
            li.onclick = () => {
                loadFocusedGraph(item.sys);
                resultsList.innerHTML = '';
                document.getElementById('graph-search-input').value = '';
            };
            resultsList.appendChild(li);
        });
    }

    // All Results Section
    if (other_results.length > 0) {
        const otherHeader = document.createElement('li');
        otherHeader.classList.add('list-group-item', 'fw-bold', 'small');
        otherHeader.textContent = 'All Results'; // Adjusted label
        resultsList.appendChild(otherHeader);

        other_results.forEach(item => {
            const li = document.createElement('li');
            li.classList.add('list-group-item', 'list-group-item-action', 'graph-clickable');
            li.textContent = `${item.descriptor_eng} (${item.sys})`;
            li.onclick = () => {
                loadFocusedGraph(item.sys);
                resultsList.innerHTML = '';
                document.getElementById('graph-search-input').value = '';
            };
            resultsList.appendChild(li);
        });
    }
}


// ✅ Fullscreen setup
function setupFullscreen() {
    const btn = document.getElementById('fullscreen-btn');
    const graphContainer = document.getElementById('graph-network');
    const topBar = document.querySelector('.bg-light');

    btn.addEventListener('click', function () {
        if (!document.fullscreenElement) {
            graphContainer.requestFullscreen().catch(err => console.error(err));
        } else {
            document.exitFullscreen().catch(err => console.error(err));
        }
    });

    // Auto-hide/show top bar when entering/exiting fullscreen
    document.addEventListener('fullscreenchange', function () {
        if (document.fullscreenElement) {
            topBar.style.display = 'none'; // Hide UI
        } else {
            topBar.style.display = 'flex'; // Restore UI
            network.redraw(); // Fix possible resizing issues when exiting fullscreen
        }
    });
}

// ESC to close search
document.addEventListener('click', function (event) {
    const searchInput = document.getElementById('graph-search-input');
    const searchResults = document.getElementById('graph-search-results');
    if (!searchInput.contains(event.target) && !searchResults.contains(event.target)) {
        searchResults.innerHTML = '';
    }
});
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        document.getElementById('graph-search-results').innerHTML = '';
        document.getElementById('graph-search-input').value = '';
    }
});