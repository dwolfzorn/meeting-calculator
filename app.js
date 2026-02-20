document.addEventListener('DOMContentLoaded', () => {
  const attendeeList = document.getElementById('attendeeList');
  const exportJpgBtn = document.getElementById('exportJpgBtn');
  const HOURS_PER_YEAR = 2080;

  const ROLE_PRESETS = {
    "Engineering": {
      "Architect":150000,
      "Engineer": 130000,
      "Designer": 100000
    },
    "Data": {
      "Data Architect": 135000
    },
    "Product": {
      "Product Owner": 110000
    },
    "Leadership": {
      "SVP": 200000,
      "CIO": 260000
    }
  };

  const roleSelect = document.getElementById('rolePreset');

  // Populate role dropdown from ROLE_PRESETS
  for (const category in ROLE_PRESETS) {
    const optgroup = document.createElement('optgroup');
    optgroup.label = category;
    for (const role in ROLE_PRESETS[category]) {
      const option = document.createElement('option');
      option.value = role;
      option.textContent = role;
      optgroup.appendChild(option);
    }
    roleSelect.appendChild(optgroup);
  }

  function addRow(role = '', count = 1, salary = '') {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `
      <input type="text" value="${role}" />
      <input type="number" min="1" value="${count}" />
      <input type="number" value="${salary}" />
      <button class="remove-btn">X</button>
    `;
    row.querySelector('.remove-btn').onclick = () => {
      row.remove();
      calculate();
    };
    row.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', calculate);
    });
    attendeeList.appendChild(row);
    calculate();
  }

  function addFromPreset() {
    const role = roleSelect.value;
    if (!role) return;
    let salary = null;
    for (const category in ROLE_PRESETS) {
      if (ROLE_PRESETS[category][role] !== undefined) {
        salary = ROLE_PRESETS[category][role];
        break;
      }
    }
    if (salary !== null) {
      addRow(role, 1, salary);
      roleSelect.value = '';
    }
  }

  function calculate() {
    const lengthMinutes = Number(document.getElementById('length').value);
    const lengthHours = lengthMinutes / 60;
    let total = 0;
    attendeeList.querySelectorAll('.row').forEach(row => {
      const inputs = row.querySelectorAll('input');
      const count = Number(inputs[1].value);
      const salary = Number(inputs[2].value);
      if (count > 0 && salary > 0) {
        const hourlyRate = salary / HOURS_PER_YEAR;
        total += hourlyRate * lengthHours * count;
      }
    });
    document.getElementById('totalCost').textContent = `$${total.toFixed(2)}`;
  }

  async function exportAsJpg() {
    if (typeof html2canvas !== 'function') {
      alert('Unable to export image right now. Please refresh and try again.');
      return;
    }

    exportJpgBtn.disabled = true;
    const originalText = exportJpgBtn.textContent;
    exportJpgBtn.textContent = 'Exporting...';

    let exportRoot = null;
    try {
      const titleRow = document.getElementById('titleRow');
      const attendeesExportSection = document.getElementById('attendeesExportSection');
      const container = document.querySelector('.container');

      exportRoot = document.createElement('div');
      exportRoot.className = 'export-capture';
      exportRoot.style.position = 'fixed';
      exportRoot.style.left = '-99999px';
      exportRoot.style.top = '0';
      exportRoot.style.backgroundColor = '#ffffff';
      exportRoot.style.padding = '2rem';
      exportRoot.style.width = `${container.clientWidth}px`;

      const titleClone = titleRow.cloneNode(true);
      const attendeesClone = attendeesExportSection.cloneNode(true);
      exportRoot.appendChild(titleClone);
      exportRoot.appendChild(attendeesClone);
      document.body.appendChild(exportRoot);

      const canvas = await html2canvas(exportRoot, {
        backgroundColor: '#ffffff',
        scale: Math.min(window.devicePixelRatio || 1, 2),
        useCORS: true
      });

      const imageData = canvas.toDataURL('image/jpeg', 0.92);
      const downloadLink = document.createElement('a');
      downloadLink.href = imageData;
      downloadLink.download = `meeting-calculator-${new Date().toISOString().slice(0, 10)}.jpg`;
      downloadLink.click();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      if (exportRoot) {
        exportRoot.remove();
      }
      exportJpgBtn.disabled = false;
      exportJpgBtn.textContent = originalText;
    }
  }

  // Move meeting length input next to header
  const titleRow = document.getElementById('titleRow');
  const lengthContainer = document.createElement('div');
  lengthContainer.style.display = 'flex';
  lengthContainer.style.alignItems = 'center';
  lengthContainer.style.gap = '0.5rem';

  const lengthLabel = document.createElement('label');
  lengthLabel.textContent = 'Meeting Length (minutes):';
  lengthLabel.setAttribute('for', 'length');

  const lengthInput = document.getElementById('length');
  lengthInput.style.width = '80px';

  // Append label and input in same row
  lengthContainer.appendChild(lengthLabel);
  lengthContainer.appendChild(lengthInput);

  // Insert below title row
  titleRow.insertAdjacentElement('afterend', lengthContainer);

  document.getElementById('length').addEventListener('input', calculate);
  exportJpgBtn.addEventListener('click', exportAsJpg);

  window.addFromPreset = addFromPreset;
  window.addRow = addRow;
});
