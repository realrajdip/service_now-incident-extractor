function showToast(msg, type) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = type;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 2500);
}

document.getElementById('extract').onclick = async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.webNavigation.getAllFrames({ tabId: tab.id }, function (frames) {
    const frameIds = frames.map(f => f.frameId);

    chrome.scripting.executeScript({
      target: { tabId: tab.id, frameIds: frameIds },
      func: () => {
        const number = document.getElementById('incident.number')?.value || '';
        if (!number) return null;

        const desc = document.getElementById('incident.short_description')?.value || '';

        // Priority
        const priorityElem = document.getElementById('incident.priority');
        const priorityMap = { '1': '1 - Critical', '2': '2 - High', '3': '3 - Moderate', '4': '4 - Low', '5': '5 - Very Low' };
        const priorityVal = priorityElem?.value || '';
        const priority = priorityElem?.tagName === 'SELECT'
          ? priorityElem.options[priorityElem.selectedIndex]?.text.trim() || priorityVal
          : priorityMap[priorityVal] || priorityVal;

        // Urgency
        const urgencyElem = document.getElementById('incident.urgency');
        const urgencyMap = { '1': '1 - High', '2': '2 - Medium', '3': '3 - Low' };
        const urgencyVal = urgencyElem?.value || '';
        const urgency = urgencyElem?.tagName === 'SELECT'
          ? urgencyElem.options[urgencyElem.selectedIndex]?.text.trim() || urgencyVal
          : urgencyMap[urgencyVal] || urgencyVal;

        // Assigned To
        const rawAssignee = document.getElementById('sys_display.incident.assigned_to')?.value || '';
        const assignee = rawAssignee
          ? '@' + rawAssignee.replace(/\(.*?\)/, '').trim().replace(/\./g, ' ')
          : 'Unassigned';

        // Assignment Group
        const rawGroup = document.getElementById('sys_display.incident.assignment_group')?.value || '';
        const assignmentGroup = rawGroup || 'Unassigned';

        return { number, desc, priority, urgency, assignee, assignmentGroup };
      }
    }, (results) => {
      const result = results?.filter(r => r.result !== null).sort((a, b) => {
        const scoreA = Object.values(a.result).filter(Boolean).length;
        const scoreB = Object.values(b.result).filter(Boolean).length;
        return scoreB - scoreA;
      })[0]?.result;

      if (!result) {
        showToast('Could not find incident fields.', 'error');
        return;
      }

      const { number, desc, priority, urgency, assignee, assignmentGroup } = result;
      const formatted = `${number}\nDesc: ${desc}\nPriority: ${priority}\nUrgency: ${urgency}\nAssignment Group: ${assignmentGroup}\nAssigned To: ${assignee}`;

      document.getElementById('output').value = formatted;
      navigator.clipboard.writeText(formatted).then(() => {
        showToast('Copied to clipboard!', 'success');
      });
    });
  });
};

document.getElementById('copy').onclick = () => {
  const text = document.getElementById('output').value;
  if (!text) { showToast('Nothing to copy.', 'error'); return; }
  navigator.clipboard.writeText(text).then(() => showToast('Copied!', 'success'));
};

document.getElementById('clear').onclick = () => {
  document.getElementById('output').value = '';
  showToast('Cleared.', 'success');
};
