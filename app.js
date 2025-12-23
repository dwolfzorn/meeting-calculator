document.addEventListener('DOMContentLoaded', () => {
  const attendeeList = document.getElementById('attendeeList');
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
      "CIP": 260000
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

  // Move meeting length input next to header
  const container = document.querySelector('.container');
  const header = container.querySelector('h1');
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

  // Insert after header
  header.insertAdjacentElement('afterend', lengthContainer);

  document.getElementById('length').addEventListener('input', calculate);

  addRow();
  window.addFromPreset = addFromPreset;
  window.addRow = addRow;
});