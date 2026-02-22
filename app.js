document.addEventListener('DOMContentLoaded', () => {
  const attendeeRowsContainer = document.getElementById('attendeeRows');
  const presetGroupsContainer = document.getElementById('presetGroups');
  const addParticipantBtn = document.getElementById('addParticipantBtn');
  const exportJpegButton = document.getElementById('exportJpegButton');
  const durationOptions = document.getElementById('durationOptions');
  const customDurationContainer = document.getElementById('customDuration');
  const customMinutesInput = document.getElementById('customMinutes');
  const totalCost = document.getElementById('totalCost');

  const HOURS_PER_WORK_YEAR = 2080;
  let selectedMeetingMinutes = 60;
  let salariesEditable = false;

  const ROLE_SALARY_PRESETS = {
    Engineering: {
      Architect: 150000,
      Engineer: 130000
    },
/*
    Data: {
      'Data architect': 135000
    },'
*/
    Product: {
      'Product owner': 110000,
      'Team coach': 100000,
      Designer: 100000
    },
    Leadership: {
      SVP: 200000,
      CIO: 260000
    }
  };

  function formatCurrency(amount) {
    return `$${amount.toFixed(2)}`;
  }

  function formatSalaryK(amount) {
    const n = Number(amount) || 0;
    return `${Math.round(n / 1000)}k`;
  }

  function formatSalaryDisplay(amount) {
    const n = Number(amount) || 0;
    return `$${n.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
  }

  function parseSalaryInputValue(value) {
    if (value == null) return 0;
    // Remove anything that isn't digit or dot or minus
    const cleaned = String(value).replace(/[^0-9.-]+/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }

  function renderPresetRoleGroups() {
    for (const [categoryName, roles] of Object.entries(ROLE_SALARY_PRESETS)) {
      const groupElement = document.createElement('div');
      groupElement.className = 'preset-group';

      const categoryHeading = document.createElement('h3');
      categoryHeading.textContent = categoryName;
      categoryHeading.className = 'preset-heading';
      categoryHeading.setAttribute('role', 'button');
      categoryHeading.setAttribute('aria-expanded', 'true');
      categoryHeading.addEventListener('click', () => {
        const isCollapsed = groupElement.classList.toggle('collapsed');
        categoryHeading.setAttribute('aria-expanded', String(!isCollapsed));
      });
      groupElement.appendChild(categoryHeading);

      const roleListElement = document.createElement('div');
      roleListElement.className = 'preset-list';

      for (const [roleName, annualSalary] of Object.entries(roles)) {
        const roleButton = document.createElement('button');
        roleButton.type = 'button';
        roleButton.className = 'preset-button';
        roleButton.innerHTML = `<span class="preset-name">${roleName}</span><span class="preset-salary">${formatSalaryK(annualSalary)}</span>`;
        roleButton.addEventListener('click', () => addAttendeeRow(roleName, annualSalary));
        roleListElement.appendChild(roleButton);
      }

      groupElement.appendChild(roleListElement);
      presetGroupsContainer.appendChild(groupElement);
    }
  }

  function addAttendeeRow(participantRole = '', annualSalary = '') {
    const attendeeRow = document.createElement('div');
    attendeeRow.className = 'row';
    const salaryInitial = salariesEditable ? (annualSalary || '') : formatSalaryDisplay(annualSalary);
    attendeeRow.innerHTML = `
      <input class="input-role" type="text" value="${participantRole}" />
      <input class="input-salary" type="text" value="${salaryInitial}" ${salariesEditable ? '' : 'readonly'} />
      <input class="input-hourly" type="text" value="$0.00" readonly />
      <button class="btn-remove" type="button">X</button>
    `;

    attendeeRow.querySelector('.btn-remove').addEventListener('click', () => {
      attendeeRow.remove();
      updateMeetingCost();
      updateNoAttendeesMessage();
    });

    // Add input listeners
    attendeeRow.querySelectorAll('input').forEach(inputElement => {
      inputElement.addEventListener('input', updateMeetingCost);
    });

    // Salary input: format on blur, unformat on focus for easier editing
    const salaryInput = attendeeRow.querySelector('.input-salary');
    if (salaryInput) {
      salaryInput.addEventListener('focus', (e) => {
        const v = parseSalaryInputValue(salaryInput.value);
        salaryInput.value = v ? String(v) : '';
      });
      salaryInput.addEventListener('blur', (e) => {
        const n = parseSalaryInputValue(salaryInput.value);
        salaryInput.value = formatSalaryDisplay(n);
        updateMeetingCost();
      });
    }

    attendeeRowsContainer.appendChild(attendeeRow);
    updateMeetingCost();
    updateNoAttendeesMessage();
  }

  function updateNoAttendeesMessage() {
    const noMsg = document.getElementById('noAttendeesMsg');
    const rows = attendeeRowsContainer.querySelectorAll('.row');
    if (!noMsg) return;
    if (rows.length === 0) {
      noMsg.style.display = 'block';
    } else {
      noMsg.style.display = 'none';
    }
  }

  // Toggle showing/editing of salaries. When hidden, salary inputs stay in DOM and retain values.
  function setSalariesEditable(editable) {
    salariesEditable = !!editable;
    // Toggle readOnly state on salary inputs
    document.querySelectorAll('.input-salary').forEach(input => {
      input.readOnly = !salariesEditable;
    });

    // Toggle visual visibility on the attendee main container
    const attendeeMain = document.getElementById('attendeeSection');
    if (attendeeMain) {
      attendeeMain.classList.toggle('salaries-visible', salariesEditable);
    }

    const btn = document.getElementById('editSalariesBtn');
    if (btn) btn.textContent = salariesEditable ? 'Save salaries' : 'Edit salaries';
  }

  function getSelectedMeetingMinutes() {
    if (!customDurationContainer.classList.contains('is-hidden')) {
      const customMinutes = Number(customMinutesInput.value);
      return customMinutes > 0 ? customMinutes : 0;
    }

    return selectedMeetingMinutes;
  }

  function selectMeetingDuration(durationValue) {
    durationOptions.querySelectorAll('.duration-button').forEach(button => {
      const isActive = button.dataset.minutes === String(durationValue);
      button.classList.toggle('is-active', isActive);
    });

    if (durationValue === 'custom') {
      customDurationContainer.classList.remove('is-hidden');
      customMinutesInput.focus();
    } else {
      selectedMeetingMinutes = Number(durationValue);
      customDurationContainer.classList.add('is-hidden');
    }

    updateMeetingCost();
  }

  function updateMeetingCost() {
    const meetingLengthMinutes = getSelectedMeetingMinutes();
    const meetingLengthHours = meetingLengthMinutes / 60;
    let totalMeetingCost = 0;

    attendeeRowsContainer.querySelectorAll('.row').forEach(attendeeRow => {
      const salaryInput = attendeeRow.querySelector('.input-salary');
      const hourlyCostInput = attendeeRow.querySelector('.input-hourly');
      const annualSalary = salaryInput ? parseSalaryInputValue(salaryInput.value) : 0;
      const hourlyCost = annualSalary > 0 ? annualSalary / HOURS_PER_WORK_YEAR : 0;

      hourlyCostInput.value = formatCurrency(hourlyCost);
      totalMeetingCost += hourlyCost * meetingLengthHours;
    });

    totalCost.textContent = formatCurrency(totalMeetingCost);
  }

  async function exportAsJpeg() {
    if (typeof html2canvas !== 'function') {
      alert('Unable to export image right now. Please refresh and try again.');
      return;
    }

    exportJpegButton.disabled = true;
    const originalButtonLabel = exportJpegButton.textContent;
    exportJpegButton.textContent = 'Exporting...';

    let exportCaptureRoot = null;
    try {
      const appHeader = document.getElementById('appHeader');
      const attendeeExportSection = document.getElementById('attendeeSection');
      const appShell = document.querySelector('.app');

      exportCaptureRoot = document.createElement('div');
      exportCaptureRoot.className = 'export-capture';
      exportCaptureRoot.style.position = 'fixed';
      exportCaptureRoot.style.left = '-99999px';
      exportCaptureRoot.style.top = '0';
      exportCaptureRoot.style.backgroundColor = '#ffffff';
      exportCaptureRoot.style.padding = '2rem';
      exportCaptureRoot.style.width = `${appShell.clientWidth}px`;

      const headerClone = appHeader.cloneNode(true);
      const exportBtnInClone = headerClone.querySelector('#exportJpegButton');
      if (exportBtnInClone) exportBtnInClone.remove();
      const attendeesClone = attendeeExportSection.cloneNode(true);
      const editBtnInClone = attendeesClone.querySelector('#editSalariesBtn');
      if (editBtnInClone) editBtnInClone.remove();
      exportCaptureRoot.appendChild(headerClone);
      exportCaptureRoot.appendChild(attendeesClone);
      document.body.appendChild(exportCaptureRoot);

      const captureCanvas = await html2canvas(exportCaptureRoot, {
        backgroundColor: '#ffffff',
        scale: Math.min(window.devicePixelRatio || 1, 2),
        useCORS: true
      });

      const jpegDataUrl = captureCanvas.toDataURL('image/jpeg', 0.92);
      const downloadLink = document.createElement('a');
      downloadLink.href = jpegDataUrl;
      downloadLink.download = `meeting-calculator-${new Date().toISOString().slice(0, 10)}.jpg`;
      downloadLink.click();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      if (exportCaptureRoot) {
        exportCaptureRoot.remove();
      }

      exportJpegButton.disabled = false;
      exportJpegButton.textContent = originalButtonLabel;
    }
  }

  renderPresetRoleGroups();
  updateNoAttendeesMessage();

  const editSalariesButton = document.getElementById('editSalariesBtn');
  if (editSalariesButton) {
    editSalariesButton.addEventListener('click', () => setSalariesEditable(!salariesEditable));
  }

  // Collapse/Expand all controls
  const collapseAllButton = document.getElementById('collapseAllBtn');
  const expandAllButton = document.getElementById('expandAllBtn');
  function setAllGroupsCollapsed(collapsed) {
    document.querySelectorAll('.preset-group').forEach(group => {
      const heading = group.querySelector('.preset-heading');
      if (!heading) return;
      group.classList.toggle('collapsed', collapsed);
      heading.setAttribute('aria-expanded', String(!collapsed));
    });
  }

  if (collapseAllButton) {
    collapseAllButton.addEventListener('click', () => setAllGroupsCollapsed(true));
  }
  if (expandAllButton) {
    expandAllButton.addEventListener('click', () => setAllGroupsCollapsed(false));
  }

  durationOptions.addEventListener('click', event => {
    const button = event.target.closest('.duration-button');
    if (!button) return;
    selectMeetingDuration(button.dataset.minutes);
  });

  customMinutesInput.addEventListener('input', () => {
    if (!customDurationContainer.classList.contains('is-hidden')) {
      updateMeetingCost();
    }
  });

  // When adding a custom participant, prefill the name
  addParticipantBtn.addEventListener('click', () => addAttendeeRow('Custom participant', ''));
  exportJpegButton.addEventListener('click', exportAsJpeg);
});
