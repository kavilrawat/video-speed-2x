(function() {
  const range = document.getElementById('speedRange');
  const output = document.getElementById('speedValue');
  const ticks = document.getElementById('ticks');

  // Build tick marks for every 0.25 from 0.25 to 5 (inclusive)
  const steps = Math.round((5 - 0.25) / 0.25) + 1; // 20 steps
  for (let i = 0; i < steps; i++) {
    const s = document.createElement('span');
    ticks.appendChild(s);
  }

  function clamp(value) {
    const min = 0.25;
    const max = 5;
    const step = 0.25;
    const rounded = Math.round(value / step) * step;
    return Math.min(max, Math.max(min, Number(rounded.toFixed(2))));
  }

  function fmt(v) {
    return (Math.round(v * 100) / 100).toFixed(2) + 'x';
  }

  function setUI(value) {
    range.value = String(value);
    output.textContent = fmt(value);
  }

  function save(value) {
    chrome.storage.sync.set({ boostSpeed: value }, () => {
      chrome.tabs.query({}, (tabs) => {
        for (const tab of tabs) {
          if (!tab.id) continue;
          chrome.tabs.sendMessage(tab.id, { type: 'BOOST_SPEED_UPDATED', value }).catch?.(() => {});
        }
      });
    });
  }

  // Load current value
  chrome.storage.sync.get({ boostSpeed: 2.0 }, (items) => {
    const v = clamp(items.boostSpeed);
    setUI(v);
  });

  // Slider interactions
  range.addEventListener('input', () => {
    const v = clamp(parseFloat(range.value));
    setUI(v);
  });
  range.addEventListener('change', () => {
    const v = clamp(parseFloat(range.value));
    save(v);
  });

  // Presets
  document.querySelectorAll('.preset').forEach((btn) => {
    btn.addEventListener('click', () => {
      const v = clamp(parseFloat(btn.getAttribute('data-v') || '1'));
      setUI(v);
      save(v);
    });
  });
})();


