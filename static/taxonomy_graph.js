// taxonomy_graph.js
// ETH Lumina Taxonomy Graph logic using vis-network

let network;
let nodes, edges;
let taxonomyData = [];

// Load JSON data and initialize graph
window.addEventListener('DOMContentLoaded', async () => {
  const response = await fetch('/static/taxonomy-enriched.json');
  taxonomyData = await response.json();

  nodes = new vis.DataSet();
  edges = new vis.DataSet();
  const container = document.getElementById('graph-network');
  network = new vis.Network(container, { nodes, edges }, getVisOptions());

  loadRootSelector();
  setupFullscreen();
  document.getElementById('graph-search-input').focus();

  // ✅ Enable double-click to refocus the graph
  network.on('doubleClick', function (params) {
    if (params.nodes.length > 0) {
      const qid = params.nodes[0];
      drawGraphFor(qid);
    }
  });

});

// Options for vis.js graph
function getVisOptions() {
  return {
    physics: {
      stabilization: false,
      barnesHut: { gravitationalConstant: -2500, springLength: 180 }
    },
    nodes: {
      shape: 'box',
      margin: 10,
      font: { size: 14, face: 'Arial' }
    },
    edges: {
      arrows: { to: { enabled: true, scaleFactor: 0.7 } },
      smooth: { type: 'cubicBezier', roundness: 0.2 },
      color: { color: '#666', highlight: '#ff8c00' }
    },
    interaction: { hover: true, tooltipDelay: 200 }
  };
}

// Load root selector with top-level subjects
function loadRootSelector() {
  const selector = document.getElementById('graph-root-selector');
  selector.innerHTML = '<option value="">-- Select root --</option>';
  taxonomyData.forEach(item => {
    if (!item.subclass_of) {
      const label = item.label?.en || item.label?.de || item.label?.fr || item.id;
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = `${label} (${item.id})`;
      selector.appendChild(option);
    }
  });

  selector.addEventListener('change', () => {
    const selected = selector.value;
    if (selected) {
      drawGraphFor(selected);
    }
  });
}

// Draw graph focused on a given QID
function drawGraphFor(qid) {
  const main = taxonomyData.find(d => d.id === qid);
  if (!main) return;

  showSpinner(true);
  nodes.clear();
  edges.clear();

  const label = getLabel(main);
  nodes.add({ id: main.id, label: `${label} (${main.id})`, color: colorMap.selected, title: label });

  // Subclass Of (parents)
  if (main.subclass_of) {
    main.subclass_of.forEach(parent => {
      const parentObj = taxonomyData.find(d => d.id === parent.id);
      const label = getLabel(parentObj);
      nodes.add({ id: parent.id, label: `${label} (${parent.id})`, color: colorMap.parent, title: label });
      edges.add({ from: parent.id, to: main.id });
    });
  }

  // Instance Of (also parents!)
  if (main.instance_of) {
    const parents = Array.isArray(main.instance_of) ? main.instance_of : [main.instance_of];
    parents.forEach(parent => {
      const parentObj = taxonomyData.find(d => d.id === parent.id);
      const label = getLabel(parentObj);
      nodes.add({ id: parent.id, label: `${label} (${parent.id})`, color: colorMap.parent, title: label });
      edges.add({ from: parent.id, to: main.id });
    });
  }

  // ✅ Dynamically find children (any subject where current qid is in subclass_of or instance_of)
  taxonomyData.forEach(candidate => {
    const subclassMatch = (candidate.subclass_of || []).some(p => p.id === qid);
    const instanceMatch = (Array.isArray(candidate.instance_of) ? candidate.instance_of : [candidate.instance_of || {}]).some(p => p.id === qid);

    if (subclassMatch || instanceMatch) {
      const label = getLabel(candidate);
      nodes.add({ id: candidate.id, label: `${label} (${candidate.id})`, color: colorMap.child, title: label });
      edges.add({ from: main.id, to: candidate.id });
    }
  });


  // Has Part (related)
  if (main.has_part) {
    main.has_part.forEach(part => {
      const partObj = taxonomyData.find(d => d.id === part.id);
      const label = getLabel(partObj);
      nodes.add({ id: part.id, label: `${label} (${part.id})`, color: colorMap.related, title: label });
      edges.add({ from: main.id, to: part.id });
    });
  }

  showSpinner(false);
  network.focus(qid, { scale: 1.5, animation: true });
}

function getLabel(obj) {
  if (!obj) return '';
  return obj.label?.en || obj.label?.de || obj.label?.fr || obj.id;
}

function showSpinner(show) {
  document.getElementById('graph-loading').style.display = show ? 'flex' : 'none';
  document.getElementById('graph-network').style.display = show ? 'none' : 'block';
}

const colorMap = {
  selected: { background: '#ffa500', border: '#ff8c00' },
  parent:   { background: '#d4edda', border: '#28a745' },
  child:    { background: '#cce5ff', border: '#0d6efd' },
  related:  { background: '#f8d7da', border: '#dc3545' }
};

// Simple search with dropdown results
function searchTaxonomyGraph(query) {
  const resultsList = document.getElementById('graph-search-results');
  resultsList.innerHTML = '';
  if (query.length < 2) return;

  const lower = query.toLowerCase();
  const matches = taxonomyData.filter(d => {
    return Object.values(d.label || {}).some(label => label.toLowerCase().includes(lower));
  }).slice(0, 20);

  matches.forEach(match => {
    const label = getLabel(match);
    const li = document.createElement('li');
    li.className = 'list-group-item list-group-item-action graph-clickable';
    li.textContent = `${label} (${match.id})`;
    li.onclick = () => {
      drawGraphFor(match.id);
      resultsList.innerHTML = '';
      document.getElementById('graph-search-input').value = '';
    };
    resultsList.appendChild(li);
  });
}

// Fullscreen toggle
function setupFullscreen() {
  const btn = document.getElementById('fullscreen-btn');
  const graphContainer = document.getElementById('graph-network');
  const topBar = document.querySelector('.bg-light');

  btn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      graphContainer.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen().catch(err => console.error(err));
    }
  });

  document.addEventListener('fullscreenchange', () => {
    topBar.style.display = document.fullscreenElement ? 'none' : 'flex';
    network.redraw();
  });
}