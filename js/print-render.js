// Renders the project grid for the print document (print.html).
// Reuses the `projects` array from projects-data.js (loaded first) and
// applies "condensed" transforms: the near-identical inventory systems are
// collapsed into a single entry, and the flagship Appskep products lead.

(function () {
  const FLAGSHIP_IDS = ['1', '2', '3']; // Appskep UKOM, CPNS, Homecare

  // Latest year referenced in a date string; ongoing ("Now") sorts to the top.
  function endYear(date) {
    if (!date) return 0;
    if (/now/i.test(date)) return 9999;
    const years = (date.match(/\d{4}/g) || []).map(Number);
    return years.length ? Math.max(...years) : 0;
  }

  // One combined entry standing in for every `inventory` project.
  const inventoryEntry = {
    title: 'Inventory Management Systems',
    categories: ['inventory'],
    categoryLabels: ['Inventory'],
    shortDesc:
      'Stock, sales, and operational systems delivered to 10+ automotive, pharmaceutical, and trading companies.',
    tech: ['PHP (Yii2)', 'MySQL'],
    date: '2014 – Now',
    location: 'West Sumatra & Riau',
  };

  const nonInventory = projects.filter((p) => !p.categories.includes('inventory'));
  const flagship = FLAGSHIP_IDS.map((id) => nonInventory.find((p) => p.id === id)).filter(Boolean);
  const rest = nonInventory.filter((p) => !FLAGSHIP_IDS.includes(p.id));

  const pool = [inventoryEntry, ...rest].sort((a, b) => endYear(b.date) - endYear(a.date));
  const ordered = [...flagship, ...pool];

  const grid = document.getElementById('pdf-projects');
  grid.innerHTML = ordered
    .map(
      (p) => `
      <div class="pdf-project">
        <div class="pdf-project-top">
          <h3>${p.title}</h3>
          <span class="pdf-project-date">${p.date || '—'}</span>
        </div>
        <p>${p.shortDesc}</p>
        <div class="pdf-project-meta">
          <span class="pdf-project-tech">${p.tech.join(' · ')}</span>
          <span class="pdf-project-location">${p.location || '—'}</span>
        </div>
      </div>`
    )
    .join('');
})();
