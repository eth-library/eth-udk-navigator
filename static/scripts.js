document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const sysId = urlParams.get('sys');

    if (sysId) {
        loadObject(sysId, false); // Load object directly if sys= is present, no history push
    } else {
        loadRootObjects(false); // Otherwise load root objects, no history push
    }

    setupGlobalListeners(); // Set up ESC and click-outside to close search

    // ✅ Set focus to search input after loading
    document.getElementById('search-input').focus();
});

// ✅ Handle back/forward browser navigation properly
window.onpopstate = function (event) {
    const urlParams = new URLSearchParams(window.location.search);
    const sysId = urlParams.get('sys');

    if (sysId) {
        loadObject(sysId, false); // Don't push history when navigating via popstate
    } else {
        loadRootObjects(false); // Also don't push history here
    }
};

async function loadRootObjects(pushHistory = true) {
    const detailsDiv = document.getElementById('object-details');
    detailsDiv.innerHTML = '<p>Loading root objects...</p>';

    // Reset URL to /explorer if pushHistory is true
    if (pushHistory) {
        window.history.pushState({}, '', '/explorer');
    }

    const response = await fetch('/roots');
    const rootObjects = await response.json();

    let html = '<h3>Root Objects (Top-Level Concepts)</h3><ul>';
    rootObjects.forEach(obj => {
        html += `<li class="clickable" onclick="loadObject(${obj.sys})">
                    ${obj.descriptor_eng} (${obj.sys}) 
                    <a href="https://eth-udk.library.ethz.ch/terms/${obj.sys}/eng" 
                       target="_blank" 
                       title="Open in ETH-UDK Database" 
                       class="eth-udk-btn" 
                       onclick="event.stopPropagation();">ETH-UDK DB</a>&nbsp;
                    <a href="https://eth.swisscovery.slsp.ch/discovery/search?query=sub,exact,${encodeURIComponent(obj.descriptor_ger)},AND&query=any,exact,(ETHUDK)${String(obj.sys).padStart(9, '0')},AND&tab=discovery_network&search_scope=DiscoveryNetwork&sortby=rank&vid=41SLSP_ETH:ETH&facet=topic,include,${encodeURIComponent(obj.descriptor_ger)}&lang=de&mode=advanced&offset=0&mfacet=library,include,5503%E2%80%93112049010005503,1,lk&mfacet=library,include,5503%E2%80%93112051140005503,1,lk&mfacet=library,include,5503%E2%80%93112050480005503,1,lk&mfacet=library,include,5503%E2%80%93112051520005503,1,lk&mfacet=library,include,5503%E2%80%93112049770005503,1,lk&mfacet=library,include,5503%E2%80%93112047110005503,1,lk&mfacet=library,include,5503%E2%80%9313544388860005503,1,lk&mfacet=library,include,5503%E2%80%93112050810005503,1,lk&mfacet=library,include,5503%E2%80%93112047490005503,1,lk&mfacet=library,include,5503%E2%80%93112049390005503,1,lk&mfacet=library,include,5503%E2%80%93112048250005503,1,lk&mfacet=library,include,5503%E2%80%93112048630005503,1,lk&mfacet=library,include,5503%E2%80%93112047870005503,1,lk" 
                       target="_blank" 
                       title="Search in ETH Library @ swisscovery" 
                       class="swisscovery-btn" 
                       onclick="event.stopPropagation();">SWISSCOVERY</a>
                </li>`;
    });
    html += '</ul>';
    detailsDiv.innerHTML = html;
}


async function loadObject(sysId, pushHistory = true) {
    const detailsDiv = document.getElementById('object-details');
    detailsDiv.innerHTML = '<p>Loading...</p>';

    const response = await fetch(`/object/${sysId}`);
    const data = await response.json();

    // Update URL dynamically to reflect the loaded object, only if pushHistory is true
    if (pushHistory) {
        window.history.pushState({}, '', `/explorer?sys=${sysId}`);
    }
    
    let html = `<h3>${data.descriptor_eng} (${data.sys}) <a href="https://eth-udk.library.ethz.ch/terms/${data.sys}/eng" target="_blank" title="Open in ETH-UDK Database" class="eth-udk-btn">ETH-UDK DB</a>&nbsp;<a href="https://eth.swisscovery.slsp.ch/discovery/search?query=sub,exact,${encodeURIComponent(data.descriptor_ger)},AND&query=any,exact,(ETHUDK)${String(data.sys).padStart(9, '0')},AND&tab=discovery_network&search_scope=DiscoveryNetwork&sortby=rank&vid=41SLSP_ETH:ETH&facet=topic,include,${encodeURIComponent(data.descriptor_ger)}&lang=de&mode=advanced&offset=0&mfacet=library,include,5503%E2%80%93112049010005503,1,lk&mfacet=library,include,5503%E2%80%93112051140005503,1,lk&mfacet=library,include,5503%E2%80%93112050480005503,1,lk&mfacet=library,include,5503%E2%80%93112051520005503,1,lk&mfacet=library,include,5503%E2%80%93112049770005503,1,lk&mfacet=library,include,5503%E2%80%93112047110005503,1,lk&mfacet=library,include,5503%E2%80%9313544388860005503,1,lk&mfacet=library,include,5503%E2%80%93112050810005503,1,lk&mfacet=library,include,5503%E2%80%93112047490005503,1,lk&mfacet=library,include,5503%E2%80%93112049390005503,1,lk&mfacet=library,include,5503%E2%80%93112048250005503,1,lk&mfacet=library,include,5503%E2%80%93112048630005503,1,lk&mfacet=library,include,5503%E2%80%93112047870005503,1,lk" 
    target="_blank" title="Search in ETH Library @ swisscovery" class="swisscovery-btn">SWISSCOVERY</a>
    </h3><table class="table table-striped"><tbody>`;
    for (const [key, value] of Object.entries(data)) {
        if (key === 'broader_terms_resolved' || key === 'narrower_terms_resolved') continue;
        html += `<tr><td><strong>${key}</strong></td><td>${Array.isArray(value) ? value.join(", ") : value}</td></tr>`;
    }
    html += '</tbody></table>';

    if (data.broader_terms_resolved.length > 0) {
        html += '<h5>Broader Terms</h5><ul>';
        data.broader_terms_resolved.forEach(bt => {
            html += `<li class="clickable" onclick="loadObject(${bt.sys})">${bt.name} (${bt.sys}) <a href="https://eth-udk.library.ethz.ch/terms/${bt.sys}/eng" target="_blank" title="Open in ETH-UDK Database" class="eth-udk-btn" onclick="event.stopPropagation();">ETH-UDK DB</a>&nbsp;<a href="https://eth.swisscovery.slsp.ch/discovery/search?query=sub,exact,${encodeURIComponent(data.descriptor_ger)},AND&query=any,exact,(ETHUDK)${String(bt.sys).padStart(9, '0')},AND&tab=discovery_network&search_scope=DiscoveryNetwork&sortby=rank&vid=41SLSP_ETH:ETH&facet=topic,include,${encodeURIComponent(data.descriptor_ger)}&lang=de&mode=advanced&offset=0&mfacet=library,include,5503%E2%80%93112049010005503,1,lk&mfacet=library,include,5503%E2%80%93112051140005503,1,lk&mfacet=library,include,5503%E2%80%93112050480005503,1,lk&mfacet=library,include,5503%E2%80%93112051520005503,1,lk&mfacet=library,include,5503%E2%80%93112049770005503,1,lk&mfacet=library,include,5503%E2%80%93112047110005503,1,lk&mfacet=library,include,5503%E2%80%9313544388860005503,1,lk&mfacet=library,include,5503%E2%80%93112050810005503,1,lk&mfacet=library,include,5503%E2%80%93112047490005503,1,lk&mfacet=library,include,5503%E2%80%93112049390005503,1,lk&mfacet=library,include,5503%E2%80%93112048250005503,1,lk&mfacet=library,include,5503%E2%80%93112048630005503,1,lk&mfacet=library,include,5503%E2%80%93112047870005503,1,lk" 
    target="_blank" title="Search in ETH Library @ swisscovery" class="swisscovery-btn" onclick="event.stopPropagation();">SWISSCOVERY</a></li>`;
        });
        html += '</ul>';
    }

    if (data.narrower_terms_resolved.length > 0) {
        html += '<h5>Narrower Terms</h5><ul>';
        data.narrower_terms_resolved.forEach(nt => {
            html += `<li class="clickable" onclick="loadObject(${nt.sys})">${nt.name} (${nt.sys}) <a href="https://eth-udk.library.ethz.ch/terms/${nt.sys}/eng" target="_blank" title="Open in ETH-UDK Database" class="eth-udk-btn" onclick="event.stopPropagation();">ETH-UDK DB</a>&nbsp;<a href="https://eth.swisscovery.slsp.ch/discovery/search?query=sub,exact,${encodeURIComponent(data.descriptor_ger)},AND&query=any,exact,(ETHUDK)${String(nt.sys).padStart(9, '0')},AND&tab=discovery_network&search_scope=DiscoveryNetwork&sortby=rank&vid=41SLSP_ETH:ETH&facet=topic,include,${encodeURIComponent(data.descriptor_ger)}&lang=de&mode=advanced&offset=0&mfacet=library,include,5503%E2%80%93112049010005503,1,lk&mfacet=library,include,5503%E2%80%93112051140005503,1,lk&mfacet=library,include,5503%E2%80%93112050480005503,1,lk&mfacet=library,include,5503%E2%80%93112051520005503,1,lk&mfacet=library,include,5503%E2%80%93112049770005503,1,lk&mfacet=library,include,5503%E2%80%93112047110005503,1,lk&mfacet=library,include,5503%E2%80%9313544388860005503,1,lk&mfacet=library,include,5503%E2%80%93112050810005503,1,lk&mfacet=library,include,5503%E2%80%93112047490005503,1,lk&mfacet=library,include,5503%E2%80%93112049390005503,1,lk&mfacet=library,include,5503%E2%80%93112048250005503,1,lk&mfacet=library,include,5503%E2%80%93112048630005503,1,lk&mfacet=library,include,5503%E2%80%93112047870005503,1,lk" 
    target="_blank" title="Search in ETH Library @ swisscovery" class="swisscovery-btn" onclick="event.stopPropagation();">SWISSCOVERY</a></li>`;
        });
        html += '</ul>';
    }

    if (data.related_terms_resolved.length > 0) {
        html += '<h5>Related Terms</h5><ul>';
        data.related_terms_resolved.forEach(nt => {
            html += `<li class="clickable" onclick="loadObject(${nt.sys})">${nt.name} (${nt.sys}) <a href="https://eth-udk.library.ethz.ch/terms/${nt.sys}/eng" target="_blank" title="Open in ETH-UDK Database" class="eth-udk-btn" onclick="event.stopPropagation();">ETH-UDK DB</a>&nbsp;<a href="https://eth.swisscovery.slsp.ch/discovery/search?query=sub,exact,${encodeURIComponent(data.descriptor_ger)},AND&query=any,exact,(ETHUDK)${String(nt.sys).padStart(9, '0')},AND&tab=discovery_network&search_scope=DiscoveryNetwork&sortby=rank&vid=41SLSP_ETH:ETH&facet=topic,include,${encodeURIComponent(data.descriptor_ger)}&lang=de&mode=advanced&offset=0&mfacet=library,include,5503%E2%80%93112049010005503,1,lk&mfacet=library,include,5503%E2%80%93112051140005503,1,lk&mfacet=library,include,5503%E2%80%93112050480005503,1,lk&mfacet=library,include,5503%E2%80%93112051520005503,1,lk&mfacet=library,include,5503%E2%80%93112049770005503,1,lk&mfacet=library,include,5503%E2%80%93112047110005503,1,lk&mfacet=library,include,5503%E2%80%9313544388860005503,1,lk&mfacet=library,include,5503%E2%80%93112050810005503,1,lk&mfacet=library,include,5503%E2%80%93112047490005503,1,lk&mfacet=library,include,5503%E2%80%93112049390005503,1,lk&mfacet=library,include,5503%E2%80%93112048250005503,1,lk&mfacet=library,include,5503%E2%80%93112048630005503,1,lk&mfacet=library,include,5503%E2%80%93112047870005503,1,lk" 
    target="_blank" title="Search in ETH Library @ swisscovery" class="swisscovery-btn" onclick="event.stopPropagation();">SWISSCOVERY</a></li>`;
        });
        html += '</ul>';
    }

    detailsDiv.innerHTML = html;
    document.getElementById('search-results').innerHTML = ''; // Clear search results
    document.getElementById('search-input').value = ''; // Optional: clear input
}

async function searchObjects(query) {
    const resultsList = document.getElementById('search-results');
    resultsList.innerHTML = '';
    if (query.length < 3) return; // Start search only with at least 3 chars

    const response = await fetch(`/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    const topPicks = data.top_picks;
    const otherResults = data.other_results;

    // Render "Top Picks"
    if (topPicks.length > 0) {
        const topHeader = document.createElement('li');
        topHeader.classList.add('list-group-item', 'search-section-header');
        topHeader.textContent = 'Top Picks';
        resultsList.appendChild(topHeader);

        topPicks.forEach(item => {
            const li = document.createElement('li');
            li.classList.add('list-group-item', 'list-group-item-action');
            li.innerHTML = `${item.descriptor_eng} (${item.sys}) 
                <a href="https://eth-udk.library.ethz.ch/terms/${item.sys}/eng" target="_blank" class="eth-udk-btn" onclick="event.stopPropagation();">ETH-UDK DB</a>&nbsp;
                <a href="https://eth.swisscovery.slsp.ch/discovery/search?query=sub,exact,${encodeURIComponent(item.descriptor_ger)},AND&query=any,exact,(ETHUDK)${String(item.sys).padStart(9, '0')},AND&tab=discovery_network&search_scope=DiscoveryNetwork&sortby=rank&vid=41SLSP_ETH:ETH&facet=topic,include,${encodeURIComponent(item.descriptor_ger)}&lang=de&mode=advanced&offset=0&mfacet=library,include,5503%E2%80%93112049010005503,1,lk&mfacet=library,include,5503%E2%80%93112051140005503,1,lk&mfacet=library,include,5503%E2%80%93112050480005503,1,lk&mfacet=library,include,5503%E2%80%93112051520005503,1,lk&mfacet=library,include,5503%E2%80%93112049770005503,1,lk&mfacet=library,include,5503%E2%80%93112047110005503,1,lk&mfacet=library,include,5503%E2%80%9313544388860005503,1,lk&mfacet=library,include,5503%E2%80%93112050810005503,1,lk&mfacet=library,include,5503%E2%80%93112047490005503,1,lk&mfacet=library,include,5503%E2%80%93112049390005503,1,lk&mfacet=library,include,5503%E2%80%93112048250005503,1,lk&mfacet=library,include,5503%E2%80%93112048630005503,1,lk&mfacet=library,include,5503%E2%80%93112047870005503,1,lk" 
                target="_blank" title="Search in ETH Library @ swisscovery" class="swisscovery-btn" onclick="event.stopPropagation();">SWISSCOVERY</a>`;
            li.onclick = () => {
                loadObject(item.sys);
                resultsList.innerHTML = '';
                document.getElementById('search-input').value = '';
            };
            resultsList.appendChild(li);
        });
    }

    // Render "All Results"
    if (otherResults.length > 0) {
        const otherHeader = document.createElement('li');
        otherHeader.classList.add('list-group-item', 'search-section-header');
        otherHeader.textContent = 'All Results';
        resultsList.appendChild(otherHeader);

        otherResults.forEach(item => {
            const li = document.createElement('li');
            li.classList.add('list-group-item', 'list-group-item-action');
            li.innerHTML = `${item.descriptor_eng} (${item.sys}) 
                <a href="https://eth-udk.library.ethz.ch/terms/${item.sys}/eng" target="_blank" class="eth-udk-btn" onclick="event.stopPropagation();">ETH-UDK DB</a>&nbsp;
                <a href="https://eth.swisscovery.slsp.ch/discovery/search?query=sub,exact,${encodeURIComponent(item.descriptor_ger)},AND&query=any,exact,(ETHUDK)${String(item.sys).padStart(9, '0')},AND&tab=discovery_network&search_scope=DiscoveryNetwork&sortby=rank&vid=41SLSP_ETH:ETH&facet=topic,include,${encodeURIComponent(item.descriptor_ger)}&lang=de&mode=advanced&offset=0&mfacet=library,include,5503%E2%80%93112049010005503,1,lk&mfacet=library,include,5503%E2%80%93112051140005503,1,lk&mfacet=library,include,5503%E2%80%93112050480005503,1,lk&mfacet=library,include,5503%E2%80%93112051520005503,1,lk&mfacet=library,include,5503%E2%80%93112049770005503,1,lk&mfacet=library,include,5503%E2%80%93112047110005503,1,lk&mfacet=library,include,5503%E2%80%9313544388860005503,1,lk&mfacet=library,include,5503%E2%80%93112050810005503,1,lk&mfacet=library,include,5503%E2%80%93112047490005503,1,lk&mfacet=library,include,5503%E2%80%93112049390005503,1,lk&mfacet=library,include,5503%E2%80%93112048250005503,1,lk&mfacet=library,include,5503%E2%80%93112048630005503,1,lk&mfacet=library,include,5503%E2%80%93112047870005503,1,lk" 
                target="_blank" title="Search in ETH Library @ swisscovery" class="swisscovery-btn" onclick="event.stopPropagation();">SWISSCOVERY</a>`;
            li.onclick = () => {
                loadObject(item.sys);
                resultsList.innerHTML = '';
                document.getElementById('search-input').value = '';
            };
            resultsList.appendChild(li);
        });
    }
}



// ✅ Setup ESC key and click-outside behavior for search dropdown
function setupGlobalListeners() {
    // Close dropdown when clicking outside
    document.addEventListener('click', function (event) {
        const searchInput = document.getElementById('search-input');
        const searchResults = document.getElementById('search-results');
        if (!searchInput.contains(event.target) && !searchResults.contains(event.target)) {
            searchResults.innerHTML = '';
        }
    });

    // Close dropdown when pressing ESC
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            document.getElementById('search-results').innerHTML = '';
            document.getElementById('search-input').value = ''; // Optional: clear input as well
        }
    });
}
