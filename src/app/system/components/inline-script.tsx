import type { StateRow } from '../data';

export function InlineScript({ states }: { states: StateRow[] }) {
  const stateJson = JSON.stringify(states.map(s => ({
    slug: s.slug, state: s.state, stateFull: s.stateFull,
    det: s.detentionCostPerDay, comm: s.communityCostPerDay, ratio: s.ratio,
    kids: s.avgKids, annual: s.detentionAnnual, intv: s.interventionCount,
    orgs: s.orgCount, verify: s.verificationScore, conf: s.dataConfidence,
    fundRec: s.liveFundingRecords, fundTotal: s.liveFundingTotal,
  })));

  return (
    <>
      <script
        id="state-data"
        type="application/json"
        dangerouslySetInnerHTML={{ __html: stateJson }}
      />
      <script dangerouslySetInnerHTML={{ __html: INTERACTIVE_SCRIPT }} />
    </>
  );
}

const INTERACTIVE_SCRIPT = `
(function() {
  // ── 1. Sort table ──
  var sortBtns = { value: document.getElementById('sort-value'), contracts: document.getElementById('sort-contracts'), name: document.getElementById('sort-name') };
  var container = document.getElementById('org-table');
  if (container) {
    function sortTable(key) {
      var rows = Array.from(container.querySelectorAll('[data-org-row]'));
      rows.sort(function(a, b) {
        if (key === 'value') return Number(b.dataset.value) - Number(a.dataset.value);
        if (key === 'contracts') return Number(b.dataset.contracts) - Number(a.dataset.contracts);
        return a.dataset.name.localeCompare(b.dataset.name);
      });
      rows.forEach(function(row, i) {
        row.querySelector('span').textContent = String(i + 1).padStart(2, '0');
        container.appendChild(row);
      });
      Object.entries(sortBtns).forEach(function(entry) {
        if (entry[1]) entry[1].style.color = entry[0] === key ? '#DC2626' : '#555';
      });
    }
    Object.entries(sortBtns).forEach(function(entry) {
      if (entry[1]) entry[1].addEventListener('click', function() { sortTable(entry[0]); });
    });
  }

  // ── 2. Org drill-down panel ──
  var panel = null;
  function escHandler(e) { if (e.key === 'Escape') closeDrill(); }
  function closeDrill() {
    if (panel) { panel.remove(); panel = null; }
    document.body.style.overflow = '';
    document.removeEventListener('keydown', escHandler);
  }

  if (container) {
    container.addEventListener('click', function(e) {
      var row = e.target.closest('[data-org-row]');
      if (!row) return;
      if (e.target.closest('a')) return;
      var orgName = row.dataset.name;
      var stateEl = row.querySelector('a');
      var state = stateEl ? stateEl.textContent.trim() : 'QLD';
      showOrgDrill(orgName, state);
    });
  }

  function showOrgDrill(orgName, state) {
    closeDrill();
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;justify-content:flex-end;';
    overlay.innerHTML = '<div style="position:absolute;inset:0;background:rgba(0,0,0,0.6)" data-close></div>'
      + '<div style="position:relative;width:100%;max-width:640px;background:#0A0A0A;border-left:1px solid #333;overflow-y:auto;box-shadow:0 0 40px rgba(0,0,0,0.5)">'
      + '<div style="position:sticky;top:0;background:#0A0A0A;border-bottom:1px solid #333;padding:16px 24px;display:flex;justify-content:space-between;align-items:center;z-index:1">'
      + '<div><h3 style="font-family:Space Grotesk,sans-serif;font-size:18px;font-weight:700;color:#F5F0E8;margin:0">' + orgName + '</h3>'
      + '<p style="font-family:monospace;font-size:11px;color:#888;margin:4px 0 0">' + state + ' · Funding History + Programs</p></div>'
      + '<button data-close style="color:#888;font-family:monospace;font-size:13px;background:none;border:none;cursor:pointer;padding:4px 8px">[ESC]</button>'
      + '</div>'
      + '<div id="drill-body" style="padding:24px"><div style="display:flex;align-items:center;gap:12px;justify-content:center;padding:48px 0"><div style="width:16px;height:16px;border:2px solid #333;border-top-color:#DC2626;border-radius:50%;animation:spin 1s linear infinite"></div><span style="font-family:monospace;font-size:13px;color:#888">Loading...</span></div></div>'
      + '</div>';
    var style = document.createElement('style');
    style.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
    overlay.appendChild(style);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    panel = overlay;
    overlay.addEventListener('click', function(ev) {
      if (ev.target.hasAttribute('data-close')) closeDrill();
    });
    document.addEventListener('keydown', escHandler);

    fetch('/api/system/drill-down?id=org-detail&state=' + encodeURIComponent(state) + '&org=' + encodeURIComponent(orgName))
      .then(function(r) { return r.json(); })
      .then(function(data) { renderDrill(data); })
      .catch(function(err) {
        document.getElementById('drill-body').innerHTML = '<p style="font-family:monospace;font-size:13px;color:#DC2626;text-align:center;padding:48px 0">Error: ' + err.message + '</p>';
      });
  }

  function renderDrill(data) {
    var body = document.getElementById('drill-body');
    if (!body) return;
    var conf = data.confidence || 'estimate';
    var dot = conf === 'verified' ? '#059669' : conf === 'cross-referenced' ? '#D97706' : '#DC2626';
    var html = '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">'
      + '<span style="display:inline-flex;align-items:center;gap:4px;font-family:monospace;font-size:11px;color:#888"><span style="width:6px;height:6px;border-radius:50%;background:' + dot + ';display:inline-block"></span>' + conf.charAt(0).toUpperCase() + conf.slice(1) + '</span>'
      + '<span style="font-family:monospace;font-size:10px;color:#555">' + (data.total || 0).toLocaleString() + ' records</span>'
      + '</div>';
    html += '<div style="overflow-x:auto"><table style="width:100%;font-family:monospace;font-size:13px;border-collapse:collapse">';
    html += '<thead><tr style="border-bottom:1px solid #333">';
    (data.columns || []).forEach(function(col) {
      html += '<th style="padding:8px 12px;font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.05em;font-weight:500;text-align:' + (col.align === 'right' ? 'right' : 'left') + '">' + col.label + '</th>';
    });
    html += '</tr></thead><tbody>';
    (data.rows || []).forEach(function(row) {
      var isSection = String(row[data.columns[0].key] || '').startsWith('──');
      html += '<tr style="border-bottom:1px solid ' + (isSection ? '#333' : '#1a1a1a') + ';' + (isSection ? 'background:#111' : '') + '">';
      (data.columns || []).forEach(function(col) {
        var val = row[col.key];
        var style = 'padding:8px 12px;text-align:' + (col.align === 'right' ? 'right' : 'left') + ';';
        if (isSection) style += 'color:#DC2626;font-weight:bold;font-size:11px;';
        else style += 'color:#F5F0E8;';
        var display = val == null ? '' : typeof val === 'number' ? (Math.abs(val) >= 1e6 ? '$' + (val/1e6).toFixed(1) + 'M' : Math.abs(val) >= 1e3 ? '$' + (val/1e3).toFixed(0) + 'K' : Number.isInteger(val) ? val.toLocaleString() : String(val)) : String(val);
        html += '<td style="' + style + '">' + display + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    html += '<div style="border-top:1px solid #333;margin-top:16px;padding-top:16px;display:flex;justify-content:space-between">'
      + '<span style="font-family:monospace;font-size:10px;color:#555">Source: ' + (data.source || 'Unknown') + '</span>'
      + '<span style="font-family:monospace;font-size:10px;color:#444">Updated: ' + (data.lastUpdated || 'Unknown') + '</span>'
      + '</div>';
    body.innerHTML = html;
  }

  // ── 3. Click-to-copy with source ──
  document.addEventListener('dblclick', function(e) {
    var el = e.target.closest('[class*="font-mono"][class*="font-bold"]');
    if (!el) return;
    var text = el.textContent.trim();
    if (!text || text.length > 30) return;
    var parent = el.closest('div[class*="border"]') || el.parentElement;
    var sourceEl = parent ? parent.querySelector('[class*="text-gray-700"], [class*="text-gray-600"]') : null;
    var source = sourceEl ? sourceEl.textContent.trim() : 'JusticeHub System Terminal';
    var copyText = text + ' (Source: ' + source + ' — justicehub.com.au/system)';
    navigator.clipboard.writeText(copyText).then(function() {
      var toast = document.createElement('div');
      toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#059669;color:#F5F0E8;font-family:monospace;font-size:13px;padding:8px 16px;border-radius:4px;z-index:99999;';
      toast.textContent = 'Copied: ' + text;
      document.body.appendChild(toast);
      setTimeout(function() { toast.remove(); }, 2000);
    });
  });

  // ── 4. Keyboard navigation ──
  var focusedRow = -1;
  var allRows = [];
  function refreshRows() {
    allRows = Array.from(document.querySelectorAll('[data-org-row], #state-table a'));
  }
  function highlightRow(idx) {
    allRows.forEach(function(r) { r.style.background = ''; });
    if (idx >= 0 && idx < allRows.length) {
      allRows[idx].style.background = 'rgba(220,38,38,0.1)';
      allRows[idx].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }
  document.addEventListener('keydown', function(e) {
    if (panel) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'j' || e.key === 'ArrowDown') {
      e.preventDefault();
      refreshRows();
      focusedRow = Math.min(focusedRow + 1, allRows.length - 1);
      highlightRow(focusedRow);
    } else if (e.key === 'k' || e.key === 'ArrowUp') {
      e.preventDefault();
      refreshRows();
      focusedRow = Math.max(focusedRow - 1, 0);
      highlightRow(focusedRow);
    } else if (e.key === 'Enter' && focusedRow >= 0) {
      refreshRows();
      var row = allRows[focusedRow];
      if (row && row.dataset && row.dataset.name) {
        var stateEl = row.querySelector('a');
        showOrgDrill(row.dataset.name, stateEl ? stateEl.textContent.trim() : 'QLD');
      } else if (row && row.href) {
        window.location.href = row.href;
      }
    } else if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
      var existing = document.getElementById('kb-help');
      if (existing) { existing.remove(); return; }
      var help = document.createElement('div');
      help.id = 'kb-help';
      help.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#0A0A0A;border:1px solid #333;padding:16px;border-radius:4px;z-index:99999;font-family:monospace;font-size:12px;color:#888;min-width:200px;';
      help.innerHTML = '<div style="color:#F5F0E8;font-weight:bold;margin-bottom:8px">Keyboard Shortcuts</div>'
        + '<div><span style="color:#DC2626">j/\\u2193</span> Next row</div>'
        + '<div><span style="color:#DC2626">k/\\u2191</span> Previous row</div>'
        + '<div><span style="color:#DC2626">Enter</span> Open detail</div>'
        + '<div><span style="color:#DC2626">Esc</span> Close panel</div>'
        + '<div><span style="color:#DC2626">dbl-click</span> Copy number + source</div>'
        + '<div style="margin-top:8px"><span style="color:#DC2626">?</span> Toggle this help</div>';
      document.body.appendChild(help);
      setTimeout(function() { help.remove(); }, 5000);
    }
  });

  // ── 5. Alert subscribe ──
  var subBtn = document.getElementById('alert-subscribe');
  var emailInput = document.getElementById('alert-email');
  if (subBtn && emailInput) {
    subBtn.addEventListener('click', function() {
      var email = emailInput.value.trim();
      if (!email || !email.includes('@')) {
        emailInput.style.borderColor = '#DC2626';
        return;
      }
      subBtn.textContent = '...';
      subBtn.disabled = true;
      fetch('/api/system/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, states: ['QLD','NSW','VIC','NT'], keywords: ['youth justice'] })
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.ok) {
          subBtn.textContent = 'Subscribed';
          subBtn.style.background = 'rgba(5,150,105,0.2)';
          subBtn.style.borderColor = 'rgba(5,150,105,0.4)';
          subBtn.style.color = '#059669';
          emailInput.value = '';
          emailInput.style.borderColor = '#059669';
        } else {
          subBtn.textContent = data.error || 'Error';
          subBtn.style.borderColor = '#DC2626';
          setTimeout(function() { subBtn.textContent = 'Subscribe'; subBtn.disabled = false; }, 2000);
        }
      })
      .catch(function() {
        subBtn.textContent = 'Error';
        setTimeout(function() { subBtn.textContent = 'Subscribe'; subBtn.disabled = false; }, 2000);
      });
    });
  }

  // ── 6. State comparison mode ──
  var compareBtn = document.getElementById('compare-btn');
  var stateData = [];
  try { stateData = JSON.parse(document.getElementById('state-data').textContent); } catch(e) {}
  var compareMode = false;
  var selected = [];

  if (compareBtn && stateData.length > 0) {
    compareBtn.addEventListener('click', function() {
      compareMode = !compareMode;
      selected = [];
      compareBtn.textContent = compareMode ? 'SELECT 2 STATES' : 'COMPARE';
      compareBtn.style.color = compareMode ? '#DC2626' : '';
      compareBtn.style.borderColor = compareMode ? '#DC2626' : '';
      var existing = document.getElementById('compare-panel');
      if (existing) existing.remove();
      var stateRows = document.querySelectorAll('#state-table a');
      stateRows.forEach(function(row) {
        if (compareMode) {
          row.dataset.compareListener = 'true';
          row.addEventListener('click', stateClickHandler);
        } else {
          row.removeEventListener('click', stateClickHandler);
          row.style.background = '';
        }
      });
    });
  }

  function stateClickHandler(e) {
    if (!compareMode) return;
    e.preventDefault();
    e.stopPropagation();
    var row = e.currentTarget;
    var stateCode = row.querySelector('.font-mono.text-sm.font-bold')?.textContent?.trim();
    if (!stateCode) return;
    var idx = selected.indexOf(stateCode);
    if (idx >= 0) {
      selected.splice(idx, 1);
      row.style.background = '';
    } else if (selected.length < 2) {
      selected.push(stateCode);
      row.style.background = 'rgba(220,38,38,0.15)';
    }
    compareBtn.textContent = selected.length === 0 ? 'SELECT 2 STATES' : selected.length === 1 ? selected[0] + ' vs ?' : selected[0] + ' vs ' + selected[1];
    if (selected.length === 2) {
      showComparison(selected[0], selected[1]);
    }
  }

  function fmtMoney(n) { return n >= 1e9 ? '$'+(n/1e9).toFixed(1)+'B' : n >= 1e6 ? '$'+(n/1e6).toFixed(0)+'M' : n >= 1e3 ? '$'+(n/1e3).toFixed(0)+'K' : '$'+n; }
  function fmtN(n) { return n.toLocaleString(); }

  function showComparison(a, b) {
    var sa = stateData.find(function(s) { return s.state === a; });
    var sb = stateData.find(function(s) { return s.state === b; });
    if (!sa || !sb) return;

    var existing = document.getElementById('compare-panel');
    if (existing) existing.remove();

    var metrics = [
      { label: 'Detention cost/day', a: sa.det, b: sb.det, fmt: fmtMoney, worse: 'higher' },
      { label: 'Community cost/day', a: sa.comm, b: sb.comm, fmt: fmtMoney, worse: 'higher' },
      { label: 'Cost ratio', a: sa.ratio, b: sb.ratio, fmt: function(v){return v+'x'}, worse: 'higher' },
      { label: 'Avg kids detained', a: sa.kids, b: sb.kids, fmt: fmtN, worse: 'higher' },
      { label: 'Annual detention cost', a: sa.annual, b: sb.annual, fmt: fmtMoney, worse: 'higher' },
      { label: 'Interventions', a: sa.intv, b: sb.intv, fmt: fmtN, worse: 'lower' },
      { label: 'Organisations', a: sa.orgs, b: sb.orgs, fmt: fmtN, worse: 'lower' },
      { label: 'Funding records', a: sa.fundRec, b: sb.fundRec, fmt: fmtN, worse: 'lower' },
      { label: 'Verification', a: sa.verify, b: sb.verify, fmt: function(v){return v+'%'}, worse: 'lower' },
    ];

    var html = '<div id="compare-panel" style="border:1px solid #DC2626;border-radius:2px;margin-top:12px;background:#0A0A0A">';
    html += '<div style="border-bottom:1px solid #333;padding:12px 16px;display:flex;justify-content:space-between;align-items:center">';
    html += '<div style="display:flex;align-items:center;gap:8px"><span style="width:8px;height:8px;border-radius:50%;background:#DC2626;display:inline-block"></span><span style="font-family:monospace;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.1em">State Comparison</span></div>';
    html += '<button onclick="this.closest(\\x27#compare-panel\\x27).remove()" style="font-family:monospace;font-size:11px;color:#888;background:none;border:none;cursor:pointer">[CLOSE]</button>';
    html += '</div>';
    html += '<div style="display:grid;grid-template-columns:1fr 100px 60px 100px;gap:4px;padding:8px 16px;font-family:monospace;font-size:10px;color:#555;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #1a1a1a">';
    html += '<span>Metric</span><span style="text-align:right">' + a + '</span><span style="text-align:center">vs</span><span style="text-align:right">' + b + '</span>';
    html += '</div>';

    metrics.forEach(function(m) {
      var aWorse = m.worse === 'higher' ? m.a > m.b : m.a < m.b;
      var bWorse = m.worse === 'higher' ? m.b > m.a : m.b < m.a;
      var aColor = m.a === m.b ? '#F5F0E8' : aWorse ? '#DC2626' : '#059669';
      var bColor = m.a === m.b ? '#F5F0E8' : bWorse ? '#DC2626' : '#059669';
      var delta = m.a !== 0 ? Math.round(((m.b - m.a) / m.a) * 100) : 0;
      var deltaStr = delta > 0 ? '+' + delta + '%' : delta + '%';
      html += '<div style="display:grid;grid-template-columns:1fr 100px 60px 100px;gap:4px;padding:8px 16px;border-bottom:1px solid #111;align-items:center">';
      html += '<span style="font-family:monospace;font-size:12px;color:#888">' + m.label + '</span>';
      html += '<span style="font-family:monospace;font-size:13px;font-weight:bold;color:' + aColor + ';text-align:right">' + m.fmt(m.a) + '</span>';
      html += '<span style="font-family:monospace;font-size:10px;color:#555;text-align:center">' + (m.a === m.b ? '=' : deltaStr) + '</span>';
      html += '<span style="font-family:monospace;font-size:13px;font-weight:bold;color:' + bColor + ';text-align:right">' + m.fmt(m.b) + '</span>';
      html += '</div>';
    });

    html += '<div style="padding:12px 16px;font-family:monospace;font-size:10px;color:#555">';
    html += 'Red = worse outcome · Green = better outcome · Source: ROGS 2024-25, Live DB';
    html += '</div></div>';

    var table = document.querySelector('#state-table')?.parentElement;
    if (table) table.insertAdjacentHTML('beforeend', html);

    compareMode = false;
    compareBtn.textContent = 'COMPARE';
    compareBtn.style.color = '';
    compareBtn.style.borderColor = '';
    document.querySelectorAll('#state-table a').forEach(function(row) {
      row.removeEventListener('click', stateClickHandler);
    });
  }
})();
`;
