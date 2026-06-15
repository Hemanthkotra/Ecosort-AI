/* ==========================================
   EcoSort AI App Engine & Logic Core
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================
  // 1. STATE MANAGEMENT & DATA
  // ==========================================
  
  let appState = {
    totalScans: 18,
    carbonOffset: 14.6,
    recyclingRate: 83.3,
    ecoPoints: 360,
    history: [
      { name: 'Plastic Milk Bottle', emoji: '🍼', category: 'HDPE Plastic', points: 25, time: '2 hours ago' },
      { name: 'Aluminum Soda Can', emoji: '🥤', category: 'Metal', points: 30, time: '5 hours ago' },
      { name: 'Banana Peel', emoji: '🍌', category: 'Organic', points: 20, time: '1 day ago' },
      { name: 'Old Phone Charger', emoji: '🔌', category: 'E-Waste', points: 50, time: '2 days ago' }
    ],
    selectedItem: null,
    currentScanMode: 'samples'
  };

  // Sample Waste Classification Database
  const wasteDatabase = {
    'pizza-box': {
      emoji: '🍕',
      name: 'Greasy Pizza Box',
      material: 'Soiled Cardboard (Cellulose)',
      destination: 'MUNICIPAL COMPOST / LANDFILL',
      binColor: '#EF4444', // Red
      steps: [
        'Tear off the clean cardboard top cover (it can be recycled with dry paper).',
        'Place the greasy, oily bottom cardboard section in the compost bin or regular landfill trash.',
        'Ensure no leftover cheese, crusts, or plastic sauce cups are left inside.'
      ],
      warningTitle: 'Grease Contamination Hazard',
      warningText: 'Cardboard fibers soaked in grease or food oils cannot be processed by standard paper mills. Attempting to recycle them risks clogging filters and contaminating large, clean batches of paper.',
      co2: 0.1,
      points: 15,
      confidence: 96.4
    },
    'milk-bottle': {
      emoji: '🍼',
      name: 'Plastic Milk Bottle',
      material: 'High-Density Polyethylene (HDPE 02)',
      destination: 'DRY RECYCLABLE BIN',
      binColor: '#10B981', // Green
      steps: [
        'Rinse out any residual milk with water to prevent odor, bacteria, and mold.',
        'Compress the plastic bottle flat to save space in transport.',
        'Keep the cap on if it is compressed, or sort it separately according to local center policies.'
      ],
      warningTitle: 'Residue & Bacterial Decay',
      warningText: 'Milk residues degrade rapidly, emitting smells and attracting pests at sorting facilities. A quick rinse saves entire truckloads of plastic from being rejected.',
      co2: 0.4,
      points: 25,
      confidence: 98.7
    },
    'charger': {
      emoji: '🔌',
      name: 'Old Phone Charger',
      material: 'Copper, Polycarbonate & Silicon',
      destination: 'E-WASTE COLLECTION CENTRE',
      binColor: '#F59E0B', // Amber
      steps: [
        'Do NOT discard in standard household recycling or wet compost bins.',
        'Bundle the cables together neatly using a twist-tie.',
        'Locate a certified local electronics drop-off container, or check retail recycle programs.'
      ],
      warningTitle: 'Toxic Material Hazards',
      warningText: 'E-waste contains flame retardants, trace heavy metals, and copper wiring. When dumped in landfills, these chemicals slowly leach into the groundwater, poisoning ecosystems.',
      co2: 1.2,
      points: 50,
      confidence: 94.2
    },
    'soda-can': {
      emoji: '🥤',
      name: 'Aluminum Soda Can',
      material: 'Aluminum (AL 100% Recyclable)',
      destination: 'DRY RECYCLABLE BIN',
      binColor: '#10B981', // Green
      steps: [
        'Empty all fluid residues completely.',
        'Give the metal container a light rinse to prevent sticky sugar residue.',
        'Crush the can to optimize bin volume. Aluminum can be recycled indefinitely without losing quality.'
      ],
      warningTitle: 'High Circular Value',
      warningText: 'Recycling aluminum consumes 95% less energy than extracting virgin bauxite ore. Aluminum can be back on the shelf as a new can in as little as 60 days.',
      co2: 0.6,
      points: 30,
      confidence: 99.1
    },
    'battery': {
      emoji: '🔋',
      name: 'Household AA Battery',
      material: 'Alkaline / Zinc-Manganese',
      destination: 'HAZARDOUS WASTE DROP-OFF',
      binColor: '#F59E0B', // Amber
      steps: [
        'Keep batteries in a dry container out of reach of children prior to disposal.',
        'Apply clear tape over the positive and negative terminals to prevent short-circuits.',
        'Drop off at certified battery collection bins (often found in supermarket entrances or municipal offices).'
      ],
      warningTitle: 'Short-Circuit & Fire Hazard',
      warningText: 'Batteries retain residual charges. When mixed with general waste, they rub together under truck compaction, which can trigger short-circuits, leaks, and severe waste facility fires.',
      co2: 0.8,
      points: 40,
      confidence: 97.5
    },
    'banana-peel': {
      emoji: '🍌',
      name: 'Banana Peel',
      material: 'Organic Material (Nitrogen-rich)',
      destination: 'COMPOST / WET WASTE BIN',
      binColor: '#06B6D4', // Cyan
      steps: [
        'Remove any small, plastic pricing stickers stuck to the peel.',
        'Discard directly into your home compost bin or city-designated wet organic waste bins.',
        'Do not mix with plastic wraps or metal items.'
      ],
      warningTitle: 'Methane Emissions in Landfills',
      warningText: 'Organic waste buried in landfills undergoes anaerobic decomposition (deprived of oxygen), generating methane gas—a greenhouse gas with 25 times more warming potential than CO₂.',
      co2: 0.3,
      points: 20,
      confidence: 99.8
    }
  };

  // Municipal Policy RAG Document Chunks
  const municipalPolicyDB = [
    {
      id: 'doc1',
      title: 'Solid Waste Management Rules (2016), India',
      source: 'National Policy - Ministry of Environment',
      text: 'Rule 4: All waste generators must segregate and store waste in three separate streams: Biodegradable (Wet waste - Green bin), Non-biodegradable (Dry waste - Blue bin), and Domestic Hazardous waste (diapers, napkins, mosquito cans - Red pouches). Refusal to segregate or mixing segregated streams is liable for local municipal fines.',
      keywords: ['segregate', 'bin', 'wet', 'dry', 'hazardous', 'rules', 'fine', 'mixing', 'policy']
    },
    {
      id: 'doc2',
      title: 'E-Waste (Management) Rules, Government of India',
      source: 'Hazardous Waste Act',
      text: 'Rule 12: Consumers of electrical and electronic equipment (EEE) must ensure that e-waste (including batteries, bulbs, cells, chargers, power banks, computer boards) is channelized to authorized collection points, dismantling centers, or registered recyclers. E-waste must not be mixed with municipal solid waste streams.',
      keywords: ['e-waste', 'electronics', 'battery', 'charger', 'bulb', 'cell', 'toxic', 'recycler', 'computer']
    },
    {
      id: 'doc3',
      title: 'MCGM Solid Waste Management Bylaws, Section 9',
      source: 'Mumbai Municipal Corporation (MCGM)',
      text: 'Section 9: Industrial composting or municipal organic treatment centers require that biodegradable waste contains no plastic residues. Plastic bags, even if labeled compostable or biodegradable, should be processed in specialized facilities or separated from backyard garden composting to prevent macro-plastic soil contamination.',
      keywords: ['plastic', 'biodegradable', 'bag', 'compost', 'mumbai', 'soil', 'organic']
    },
    {
      id: 'doc4',
      title: 'Urban Recycling Contamination Directives, Clause 4',
      source: 'Smart Cities Recycling Guidelines',
      text: 'Clause 4.1: Cardboard, paper cartons, and packages coated in food oils, dairy residue, pizza grease, or heavy wax are unfit for cardboard paper mills. They must be categorized as organic compostable (if purely paper/oil) or regular landfill waste. Dry paper, newspaper, and boxes must be flattened and kept dry to preserve fiber length.',
      keywords: ['pizza', 'cardboard', 'paper', 'grease', 'oil', 'box', 'contamination', 'wash', 'rinse']
    }
  ];

  // ==========================================
  // 2. UI NAVIGATION & TABS
  // ==========================================
  
  const navItems = document.querySelectorAll('.nav-item');
  const tabContents = document.querySelectorAll('.tab-content');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabId = item.getAttribute('data-tab');
      
      // Update navigation active states
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      
      // Toggle visibility of panels
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === tabId) {
          content.classList.add('active');
        }
      });
    });
  });

  // Light/Dark Theme Switcher
  const themeToggleBtn = document.getElementById('theme-toggle');
  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    document.body.classList.toggle('dark-mode');
    
    // Change icon representation
    const isLight = document.body.classList.contains('light-mode');
    themeToggleBtn.innerHTML = isLight 
      ? `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z"></path></svg>`
      : `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path></svg>`;
  });

  // ==========================================
  // 3. STATS & HISTORY HANDLER
  // ==========================================
  
  const totalScansEl = document.getElementById('stat-total-scans');
  const carbonEl = document.getElementById('stat-carbon');
  const recycleEl = document.getElementById('stat-recycling-rate');
  const pointsEl = document.getElementById('stat-points');
  const activityLogEl = document.getElementById('activity-log');
  const clearHistoryBtn = document.getElementById('clear-history');

  function updateDashboardUI() {
    totalScansEl.textContent = appState.totalScans;
    carbonEl.textContent = `${appState.carbonOffset.toFixed(1)} kg`;
    recycleEl.textContent = `${appState.recyclingRate.toFixed(1)}%`;
    pointsEl.textContent = appState.ecoPoints;

    // Render activity log
    activityLogEl.innerHTML = '';
    if (appState.history.length === 0) {
      activityLogEl.innerHTML = `<li class="activity-item" style="color: var(--text-muted); justify-content: center;">No items scanned yet</li>`;
      return;
    }
    
    appState.history.forEach(item => {
      const li = document.createElement('li');
      li.className = 'activity-item';
      li.innerHTML = `
        <div class="act-meta">
          <span class="act-emoji">${item.emoji}</span>
          <div>
            <span class="act-name">${item.name}</span>
            <span class="act-tag">${item.category}</span>
          </div>
        </div>
        <div style="text-align: right;">
          <span class="act-points">+${item.points} pts</span>
          <div style="font-size: 0.65rem; color: var(--text-muted);">${item.time}</div>
        </div>
      `;
      activityLogEl.appendChild(li);
    });
  }

  // Clear History
  clearHistoryBtn.addEventListener('click', () => {
    appState.history = [];
    appState.totalScans = 0;
    appState.carbonOffset = 0.0;
    appState.recyclingRate = 0.0;
    appState.ecoPoints = 0;
    updateDashboardUI();
  });

  // Initialize UI
  updateDashboardUI();

  // ==========================================
  // 4. AI WASTE SEGREGATION CLASSIFIER MODULE
  // ==========================================
  
  const scanModeButtons = document.querySelectorAll('.scan-mode-btn');
  const scanPanels = document.querySelectorAll('.scan-panel');
  const sampleCards = document.querySelectorAll('.sample-item-card');
  const resultsPlaceholder = document.getElementById('results-placeholder');
  const resultsData = document.getElementById('results-data');
  
  // Report elements
  const repConfidence = document.getElementById('report-confidence');
  const repEmoji = document.getElementById('report-emoji');
  const repItemName = document.getElementById('report-item-name');
  const repMaterial = document.getElementById('report-material');
  const binColorIndicator = document.getElementById('bin-color-indicator');
  const binDestination = document.getElementById('bin-destination');
  const repSteps = document.getElementById('report-steps');
  const repAlertTitle = document.getElementById('alert-title');
  const repAlertText = document.getElementById('alert-text');
  const repStatCo2 = document.getElementById('report-stat-co2');
  const repStatPoints = document.getElementById('report-stat-points');
  const btnLogAction = document.getElementById('btn-log-action');

  // Toggle input modes
  scanModeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      scanModeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const mode = btn.getAttribute('data-mode');
      scanPanels.forEach(panel => {
        panel.classList.remove('active');
        if (panel.id === `panel-${mode}`) {
          panel.classList.add('active');
        }
      });
      appState.currentScanMode = mode;
    });
  });

  // Click on a pre-loaded Sample Item
  sampleCards.forEach(card => {
    card.addEventListener('click', () => {
      const itemKey = card.getAttribute('data-item');
      analyzeItem(itemKey);
    });
  });

  function analyzeItem(key) {
    const item = wasteDatabase[key];
    if (!item) return;

    appState.selectedItem = item;

    // Display values in UI
    repConfidence.textContent = `${item.confidence.toFixed(1)}% match`;
    repEmoji.textContent = item.emoji;
    repItemName.textContent = item.name;
    repMaterial.textContent = item.material;
    
    // Bin assignments
    binColorIndicator.style.backgroundColor = item.binColor;
    binDestination.textContent = item.destination;
    binDestination.style.color = item.binColor;

    // Steps rendering
    repSteps.innerHTML = '';
    item.steps.forEach(step => {
      const li = document.createElement('li');
      li.textContent = step;
      repSteps.appendChild(li);
    });

    // Warning alert
    repAlertTitle.textContent = item.warningTitle;
    repAlertText.textContent = item.warningText;

    // Stats
    repStatCo2.textContent = `+${item.co2.toFixed(1)} kg`;
    repStatPoints.textContent = `+${item.points} pts`;

    // Swap placeholder layout
    resultsPlaceholder.style.display = 'none';
    resultsData.style.display = 'block';
  }

  // Log action
  btnLogAction.addEventListener('click', () => {
    if (!appState.selectedItem) return;

    const item = appState.selectedItem;
    
    // Update State
    appState.totalScans += 1;
    appState.carbonOffset += item.co2;
    appState.ecoPoints += item.points;

    // Recompute recycling rate: Recyclable bins are GREEN or AMBER, Organic/wet is CYAN, Landfill is RED.
    // Let's increment recycling counts.
    let recycledScans = appState.history.filter(h => h.category !== 'Organic' && h.name !== 'Greasy Pizza Box').length;
    if (item.destination.includes('RECYCLABLE') || item.destination.includes('E-WASTE')) {
      recycledScans += 1;
    }
    appState.recyclingRate = (recycledScans / appState.totalScans) * 100.0;

    // Prepend to history
    appState.history.unshift({
      name: item.name,
      emoji: item.emoji,
      category: item.material.split(' ')[0], // simple clean title
      points: item.points,
      time: 'Just now'
    });

    // Update Dashboard UI
    updateDashboardUI();

    // Reset results view to placeholder
    resultsData.style.display = 'none';
    resultsPlaceholder.style.display = 'flex';
    resultsPlaceholder.innerHTML = `
      <div style="text-align: center; color: var(--primary);">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        <h4 style="margin-top: 12px; font-weight:600;">Action Logged Successfully!</h4>
        <p style="color: var(--text-muted); font-size: 0.8rem; margin-top: 4px;">Earned +${item.points} points. Check your Dashboard updates.</p>
      </div>
    `;

    // Reset placeholder after a few seconds
    setTimeout(() => {
      resultsPlaceholder.innerHTML = `
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <p>No item scanned. Please select a sample item or upload an image to launch the classifier analysis.</p>
      `;
    }, 4000);

    appState.selectedItem = null;
  });

  // Drag and Drop simulation
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');

  dropZone.addEventListener('click', () => fileInput.click());
  
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    simulateFileAnalysis();
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      simulateFileAnalysis();
    }
  });

  function simulateFileAnalysis() {
    resultsPlaceholder.style.display = 'flex';
    resultsPlaceholder.innerHTML = `
      <div class="loader-container">
        <div class="spinner"></div>
        <p style="margin-top: 12px;">AI Processing Uploaded Image...</p>
      </div>
    `;
    resultsData.style.display = 'none';

    setTimeout(() => {
      // Pick a random sample item to simulate detection
      const keys = Object.keys(wasteDatabase);
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      analyzeItem(randomKey);
    }, 1500);
  }

  // Webcam Simulator
  const btnStartCam = document.getElementById('btn-start-camera');
  const camPlaceholder = document.querySelector('.camera-placeholder');
  const camControls = document.querySelector('.camera-controls');
  const cameraText = document.querySelector('.camera-text');

  btnStartCam.addEventListener('click', () => {
    camPlaceholder.style.display = 'none';
    camControls.style.display = 'flex';
    
    // Simulate streaming
    const wrapper = document.querySelector('.camera-stream-wrapper');
    wrapper.style.backgroundColor = '#1e293b';
    wrapper.style.backgroundImage = 'radial-gradient(circle, #334155 10%, transparent 80%)';
    cameraText.textContent = 'Camera Streaming ACTIVE';
    cameraText.style.color = '#10B981';
  });

  document.getElementById('btn-capture').addEventListener('click', () => {
    resultsPlaceholder.style.display = 'flex';
    resultsPlaceholder.innerHTML = `
      <div class="loader-container">
        <div class="spinner"></div>
        <p style="margin-top: 12px;">Computer Vision Frame Captured...</p>
      </div>
    `;
    resultsData.style.display = 'none';

    setTimeout(() => {
      // Pick metal can or batteries as capturing examples
      const options = ['soda-can', 'battery', 'charger'];
      const pick = options[Math.floor(Math.random() * options.length)];
      analyzeItem(pick);
    }, 1200);
  });

  // ==========================================
  // 5. POLICY RAG CHATBOT ENGINE
  // ==========================================
  
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatMessages = document.getElementById('chat-messages');
  const citySelect = document.getElementById('city-select');
  const traceChunks = document.getElementById('trace-chunks');
  const tracePrompt = document.getElementById('trace-assembled-prompt');
  
  const stepRetrieval = document.getElementById('trace-step-retrieval');
  const stepPrompt = document.getElementById('trace-step-prompt');

  // Query chips listener
  document.querySelectorAll('.chip-query').forEach(chip => {
    chip.addEventListener('click', () => {
      chatInput.value = chip.textContent;
      chatForm.dispatchEvent(new Event('submit'));
    });
  });

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = chatInput.value.trim();
    if (!query) return;

    // 1. Add user message
    appendMessage(query, 'user');
    chatInput.value = '';

    // 2. Trigger simulated RAG logic
    resultsPlaceholder.style.display = 'none';
    
    // Enable visual inspector tracing
    stepRetrieval.classList.remove('disabled');
    stepRetrieval.classList.add('active');
    
    // Loading indicator for chatbot
    const botMsgId = appendTypingIndicator();

    setTimeout(() => {
      // Execute RAG logic
      const searchResults = runVectorQueryMatch(query);
      
      // Update RAG Inspector Step 1: Chunk Retrieval
      renderTraceChunks(searchResults);

      // Assemble LLM prompt
      const assembledPrompt = constructGranitePrompt(query, searchResults);
      
      // Update RAG Inspector Step 2: Prompt Assembly
      stepPrompt.classList.remove('disabled');
      stepPrompt.classList.add('active');
      tracePrompt.textContent = assembledPrompt;

      // Generate response from IBM Granite simulated output
      const answer = generateRAGAnswer(query, searchResults);

      // Remove typing indicator & replace with bot answer
      removeTypingIndicator(botMsgId);
      appendMessage(answer, 'assistant', searchResults.length > 0 ? searchResults[0].title : null);

      // Scroll to bottom
      chatMessages.scrollTop = chatMessages.scrollHeight;

    }, 1800);
  });

  function appendMessage(text, sender, citation = null) {
    const msg = document.createElement('div');
    msg.className = `msg ${sender}`;
    
    let content = `<p>${text}</p>`;
    if (citation) {
      content += `<span class="msg-citation">Source: ${citation}</span>`;
    }
    
    msg.innerHTML = content;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function appendTypingIndicator() {
    const id = 'typing-' + Date.now();
    const msg = document.createElement('div');
    msg.className = 'msg assistant';
    msg.id = id;
    msg.innerHTML = `<p style="display: flex; gap: 4px; align-items:center;">Thinking<span class="dot-typing">.</span><span class="dot-typing">.</span><span class="dot-typing">.</span></p>`;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return id;
  }

  function removeTypingIndicator(id) {
    const indicator = document.getElementById(id);
    if (indicator) indicator.remove();
  }

  // Local RAG Matcher (Cosine Similarity simulation based on keywords)
  function runVectorQueryMatch(query) {
    const tokens = query.toLowerCase().split(/\W+/);
    let matches = [];

    municipalPolicyDB.forEach(doc => {
      let score = 0;
      doc.keywords.forEach(keyword => {
        if (tokens.includes(keyword)) {
          score += 1.0;
        }
      });
      // Normalize score based on chunk length
      if (score > 0) {
        const similarity = score / (Math.sqrt(tokens.length) * Math.sqrt(doc.keywords.length));
        matches.push({
          doc: doc,
          score: Math.min(similarity + 0.35, 0.95) // simulate high-fidelity vector matching
        });
      }
    });

    // Sort descending by score
    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, 2); // return top 2 matched document chunks
  }

  function renderTraceChunks(matches) {
    traceChunks.innerHTML = '';
    
    if (matches.length === 0) {
      traceChunks.innerHTML = `
        <div class="chunk-item">
          <div class="chunk-item-title" style="color: var(--accent-red)">NO MATCH FOUND (Score < 0.30)</div>
          <div class="chunk-item-text">Local vector documents did not score high enough. Prompt will fall back to Granite baseline knowledge.</div>
        </div>
      `;
      return;
    }

    matches.forEach((m, idx) => {
      const chunkDiv = document.createElement('div');
      chunkDiv.className = 'chunk-item';
      chunkDiv.innerHTML = `
        <div class="chunk-item-title">
          <span>[Chunk ${idx + 1}] ${m.doc.title}</span>
          <span class="chunk-item-score">Match: ${(m.score * 100).toFixed(0)}%</span>
        </div>
        <div class="chunk-item-text">${m.doc.text}</div>
      `;
      traceChunks.appendChild(chunkDiv);
    });
  }

  function constructGranitePrompt(query, matches) {
    let contextStr = "No relevant context found in regional municipal document indexes.";
    if (matches.length > 0) {
      contextStr = matches.map((m, idx) => `[Source ${idx + 1}: ${m.doc.title} - ${m.doc.source}]\n"${m.doc.text}"`).join('\n\n');
    }

    return `<|system|>
You are a highly accurate, local Municipal Waste and Sustainability Advisor. Answer the citizen's query based strictly on the retrieved policies provided in the context below. 
If the context does not contain relevant instructions, answer the query politely using standard national waste management laws but clearly state that no specific local bylaws were found. Always prioritize local fines and environmental safety warnings.
<|context|>
${contextStr}
<|user|>
Question: ${query}
<|assistant|>`;
  }

  function generateRAGAnswer(query, matches) {
    const lowerQuery = query.toLowerCase();
    
    // Check MCGM / SWM fine rules
    if (lowerQuery.includes('fine') || lowerQuery.includes('mix') || lowerQuery.includes('wet') || lowerQuery.includes('dry')) {
      const selectedCity = citySelect.options[citySelect.selectedIndex].text;
      return `According to current policy directives under the **Solid Waste Management Rules**, households must segregate waste at source. Under local guidelines in the selected jurisdiction (${selectedCity}), mixing organic kitchen wet waste with dry plastic/paper recyclables violates environmental safety mandates. First-time offenders are subject to municipal fines of **Rs. 500**, which can escalate for repeated offenses. Please segregate wet waste into green containers and dry waste into blue containers.`;
    }

    // Check batteries / e-waste rules
    if (lowerQuery.includes('battery') || lowerQuery.includes('bulb') || lowerQuery.includes('tube') || lowerQuery.includes('charger') || lowerQuery.includes('electronic')) {
      return `Electronic components and batteries (zinc-carbon, alkaline, or lithium) contain trace quantities of hazardous metals. Under **Rule 12 of the E-Waste Management Rules**, batteries and electrical components must **not** be mixed with standard household bins. They must be isolated in secure containment and handed over to authorized municipal recycling collection points or drops. This prevents short circuits and chemicals from leaching into municipal soil.`;
    }

    // Check pizza box / cardboard grease contamination
    if (lowerQuery.includes('pizza') || lowerQuery.includes('grease') || lowerQuery.includes('cardboard') || lowerQuery.includes('box')) {
      return `Clean cardboard is 100% recyclable, but grease or oils from foods (like pizza) chemically degrade cellulose fibers, making them unfit for standard paper mill processing. According to local **Contamination Directives**, you should tear off the clean cover of the box for recycling, and discard the oily base in the organic wet waste or compost bin.`;
    }

    // Check biodegradable bags
    if (lowerQuery.includes('bag') || lowerQuery.includes('biodegradable') || lowerQuery.includes('compostable')) {
      return `Under the **Urban Recycling Directives**, plastic carry bags, even if stamped "biodegradable" or "compostable," do not decompose in ordinary residential compost bins. They require commercial, industrial-grade high-heat composting facilities. You should keep them separate from backyard organic waste and check if local centers support industrial composting.`;
    }

    // Default fallback
    return `To answer your question: please separate organic wet materials from clean, dry dry-recyclable packaging. For specific hazardous items (like chemicals, batteries, or old electronics), check local collections centers. Local municipality laws strongly penalize mixed waste dumping to prevent landfill saturation.`;
  }

  // ==========================================
  // 6. 1M1B SUBMISSION FORM COPY MODULE
  // ==========================================
  
  const copyButtons = document.querySelectorAll('.btn-copy');

  copyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const textarea = document.getElementById(targetId);
      
      if (textarea) {
        // Select and Copy to clipboard
        textarea.select();
        textarea.setSelectionRange(0, 99999); // For mobile devices
        
        navigator.clipboard.writeText(textarea.value).then(() => {
          // Visual success indication
          const originalText = btn.textContent;
          btn.textContent = 'Copied!';
          btn.classList.add('copied');
          
          setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('copied');
          }, 2000);
        }).catch(err => {
          console.error('Failed to copy text: ', err);
        });
      }
    });
  });

});
