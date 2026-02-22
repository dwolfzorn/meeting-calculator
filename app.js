document.addEventListener('DOMContentLoaded', () => {
  const attendeeRowsContainer = document.getElementById('attendeeRows');
  const presetRoleGroupsContainer = document.getElementById('presetRoleGroups');
  const addCustomParticipantButton = document.getElementById('addCustomParticipantButton');
  const exportJpegButton = document.getElementById('exportJpegButton');
  const meetingDurationOptions = document.getElementById('meetingDurationOptions');
  const customDurationContainer = document.getElementById('customDurationContainer');
  const customDurationMinutesInput = document.getElementById('customDurationMinutes');
  const meetingTotalCost = document.getElementById('meetingTotalCost');

  const HOURS_PER_WORK_YEAR = 2080;
  let selectedMeetingMinutes = 60;

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

  function renderPresetRoleGroups() {
    for (const [categoryName, roles] of Object.entries(ROLE_SALARY_PRESETS)) {
      const groupElement = document.createElement('div');
      groupElement.className = 'preset-role-group';

      const categoryHeading = document.createElement('h3');
      categoryHeading.textContent = categoryName;
      categoryHeading.className = 'preset-role-heading';
      categoryHeading.setAttribute('role', 'button');
      categoryHeading.setAttribute('aria-expanded', 'true');
      categoryHeading.addEventListener('click', () => {
        const isCollapsed = groupElement.classList.toggle('collapsed');
        categoryHeading.setAttribute('aria-expanded', String(!isCollapsed));
      });
      groupElement.appendChild(categoryHeading);

      const roleListElement = document.createElement('div');
      roleListElement.className = 'preset-role-list';

      for (const [roleName, annualSalary] of Object.entries(roles)) {
        const roleButton = document.createElement('button');
        roleButton.type = 'button';
        roleButton.className = 'preset-role-button';
        roleButton.textContent = roleName;
        roleButton.addEventListener('click', () => addAttendeeRow(roleName, annualSalary));
        roleListElement.appendChild(roleButton);
      }

      groupElement.appendChild(roleListElement);
      presetRoleGroupsContainer.appendChild(groupElement);
    }
  }

  function addAttendeeRow(participantRole = '', annualSalary = '') {
    const attendeeRow = document.createElement('div');
    attendeeRow.className = 'attendee-grid';
    attendeeRow.innerHTML = `
      <input class="attendee-role-input" type="text" value="${participantRole}" />
      <input class="attendee-salary-input" type="number" value="${annualSalary}" />
      <input class="attendee-hourly-cost-input" type="text" value="$0.00" readonly />
      <button class="attendee-remove-button" type="button">X</button>
    `;

    attendeeRow.querySelector('.attendee-remove-button').addEventListener('click', () => {
      attendeeRow.remove();
      updateMeetingCost();
    });

    attendeeRow.querySelectorAll('input:not([readonly])').forEach(inputElement => {
      inputElement.addEventListener('input', updateMeetingCost);
    });

    attendeeRowsContainer.appendChild(attendeeRow);
    updateMeetingCost();
  }

  function getSelectedMeetingMinutes() {
    if (!customDurationContainer.classList.contains('is-hidden')) {
      const customMinutes = Number(customDurationMinutesInput.value);
      return customMinutes > 0 ? customMinutes : 0;
    }

    return selectedMeetingMinutes;
  }

  function selectMeetingDuration(durationValue) {
    meetingDurationOptions.querySelectorAll('.meeting-duration-button').forEach(button => {
      const isActive = button.dataset.minutes === String(durationValue);
      button.classList.toggle('is-active', isActive);
    });

    if (durationValue === 'custom') {
      customDurationContainer.classList.remove('is-hidden');
      customDurationMinutesInput.focus();
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

    attendeeRowsContainer.querySelectorAll('.attendee-grid').forEach(attendeeRow => {
      const salaryInput = attendeeRow.querySelector('.attendee-salary-input');
      const hourlyCostInput = attendeeRow.querySelector('.attendee-hourly-cost-input');
      const annualSalary = Number(salaryInput.value);
      const hourlyCost = annualSalary > 0 ? annualSalary / HOURS_PER_WORK_YEAR : 0;

      hourlyCostInput.value = formatCurrency(hourlyCost);
      totalMeetingCost += hourlyCost * meetingLengthHours;
    });

    meetingTotalCost.textContent = formatCurrency(totalMeetingCost);
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
      const attendeeExportSection = document.getElementById('attendeeExportSection');
      const appShell = document.querySelector('.app-shell');

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

  // Collapse/Expand all controls
  const collapseAllButton = document.getElementById('collapseAll');
  const expandAllButton = document.getElementById('expandAll');
  function setAllGroupsCollapsed(collapsed) {
    document.querySelectorAll('.preset-role-group').forEach(group => {
      const heading = group.querySelector('.preset-role-heading');
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

  meetingDurationOptions.addEventListener('click', event => {
    const button = event.target.closest('.meeting-duration-button');
    if (!button) return;
    selectMeetingDuration(button.dataset.minutes);
  });

  customDurationMinutesInput.addEventListener('input', () => {
    if (!customDurationContainer.classList.contains('is-hidden')) {
      updateMeetingCost();
    }
  });

  addCustomParticipantButton.addEventListener('click', () => addAttendeeRow());
  exportJpegButton.addEventListener('click', exportAsJpeg);
});
