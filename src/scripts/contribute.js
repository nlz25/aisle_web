const root = document.querySelector('[data-contribute-view]');
const byId = id => document.getElementById(id);
const prefix = '/api/contribute';
const maxZip = 25 * 1024 * 1024;
const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const labStates = ['Open for experiments', 'By appointment', 'Temporarily unavailable'];
const reviewStates = ['in_review', 'changes_requested', 'accepted', 'rejected'];

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function api(path, { method = 'GET', data, file } = {}) {
  const response = await fetch(prefix + path, {
    method,
    credentials: 'same-origin',
    cache: 'no-store',
    headers: file ? { 'Content-Type': 'application/zip', 'X-AISLE-Filename': encodeURIComponent(file.name) }
      : data === undefined ? {} : { 'Content-Type': 'application/json' },
    body: file ?? (data === undefined ? undefined : JSON.stringify(data)),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload) {
    const message = response.status === 404 || (response.ok && !payload)
      ? 'The contribution service is unavailable. Please try again later or contact the AISLE team.'
      : 'The request could not be completed. Please try again.';
    const retry = Number(response.headers.get('Retry-After'));
    const retryMessage = response.status === 429 && Number.isFinite(retry) && retry > 0
      ? ' Try again after ' + new Date(Date.now() + retry * 1000).toLocaleString() + '.'
      : '';
    throw new ApiError(response.status, (payload?.error || message) + retryMessage);
  }
  return payload;
}

function showMessage(text, isError = false, target = byId('workspace-message')) {
  target.textContent = text;
  target.toggleAttribute('data-error', isError);
}

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function link(text, href) {
  const node = element('a', text);
  node.href = href;
  return node;
}

function field(label, control) {
  const node = element('label', label);
  node.append(control);
  return node;
}

function input(name, type, value = '', maxLength) {
  const node = element('input');
  node.name = name;
  node.type = type;
  if (type !== 'file') node.value = value;
  if (maxLength) node.maxLength = maxLength;
  return node;
}

function select(name, values, selected) {
  const node = element('select');
  node.name = name;
  for (const value of values) node.add(new Option(statusLabel(value), value, false, value === selected));
  return node;
}

function button(text, type = 'button', className) {
  const node = element('button', text, className);
  node.type = type;
  return node;
}

function confirmRemoval(title, message) {
  const dialog = element('dialog', undefined, 'contribute-card contribute-confirm');
  dialog.setAttribute('aria-label', title);
  const actions = element('div', undefined, 'contribute-toolbar');
  const cancel = button('Cancel', 'button', 'secondary');
  cancel.setAttribute('autofocus', '');
  cancel.addEventListener('click', () => dialog.close());
  const confirm = button(title, 'button', 'contribute-danger');
  confirm.addEventListener('click', () => dialog.close('confirm'));
  actions.append(cancel, confirm);
  dialog.append(element('h3', title), element('p', message), actions);
  root.append(dialog);

  return new Promise(resolve => {
    dialog.addEventListener('close', () => {
      const confirmed = dialog.returnValue === 'confirm';
      dialog.remove();
      resolve(confirmed);
    }, { once: true });
    dialog.showModal();
  });
}

function formFor(controls, label, handler) {
  const form = element('form', undefined, 'contribute-form');
  form.method = 'post';
  form.append(...controls, button(label, 'submit'));
  bindForm(form, handler);
  return form;
}

function bindForm(form, handler) {
  const message = element('p', '', 'contribute-message');
  message.setAttribute('role', 'status');
  form.append(message);
  const submit = form.querySelector('button[type=submit]');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled) return;
    submit.disabled = true;
    showMessage('Working…', false, message);
    try {
      await handler(new FormData(form));
      showMessage('', false, message);
    } catch (error) {
      showMessage(error.message, true, message);
    } finally {
      submit.disabled = false;
    }
  });
  return message;
}

function statusLabel(value) {
  return value.replaceAll('_', ' ').replace(/^[a-z]/, first => first.toUpperCase());
}

function taskCard(task) {
  const card = element('article', undefined, 'contribute-card');
  card.id = task.id;
  card.append(
    element('p', task.kind === 'wet' ? 'Wet Lab' : 'Dry Lab', 'contribute-kicker'),
    element('h3', task.title),
    element('p', task.id, 'task-meta'),
    element('p', statusLabel(task.status), 'task-status'),
    element('p', task.description),
  );
  if (task.lab?.name) {
    const lab = task.lab;
    card.append(element('p',
      lab.name + ' · ' + lab.status + '\n' + lab.days.join(', ') + ' · ' +
      lab.start + '–' + lab.end + ' ' + lab.timezone + (lab.note ? '\n' + lab.note : ''),
      'task-meta'));
  }
  if (task.notice) card.append(element('p', 'Lab notice: ' + task.notice));
  if (task.pr_url) {
    try {
      const url = new URL(task.pr_url);
      if (url.origin === 'https://github.com') card.append(link('View GitHub pull request', url.href));
    } catch { /* Legacy or malformed URL. */ }
  }
  return card;
}

function dateLabel(timestamp) {
  return new Date(timestamp * 1000).toLocaleDateString();
}

function details(title, ...children) {
  const node = element('details');
  node.append(element('summary', title), ...children);
  return node;
}

function taskDetailsForm(task, save, reviewer = false) {
  const title = input('title', 'text', task.title, 160);
  const description = element('textarea');
  description.name = 'description';
  description.value = task.description;
  description.maxLength = 5000;
  description.rows = 4;
  title.required = description.required = true;
  const fields = [field('Task title', title), field('Experiment description', description)];
  if (reviewer && task.kind === 'dry') {
    const pr = input('pr_url', 'url', task.pr_url, 500);
    pr.required = true;
    fields.push(field('GitHub pull request URL', pr));
  }
  return formFor(fields, 'Save details', form => save(Object.fromEntries(form)));
}

function discussion(task, path, { forFile = false, panel = details('Task discussion') } = {}) {
  const endpoint = path + '/comments' + (forFile ? '?scope=package' : '?scope=task');
  const content = element('div');
  const thread = element('ol', undefined, 'contribute-comments');
  const notice = element('p', '', 'contribute-message');
  notice.setAttribute('role', 'status');
  const older = button('Load older comments', 'button', 'secondary');
  const reload = button('Refresh comments', 'button', 'secondary');
  const toolbar = element('div', undefined, 'contribute-toolbar');
  toolbar.append(reload, older);
  older.hidden = true;
  content.append(toolbar, notice, thread);
  let cursor = null;
  let loaded = false;
  let loadVersion = 0;

  function commentItem(comment) {
    const item = element('li');
    const role = comment.author_role === 'reviewer' ? 'Reviewer' : 'Contributor';
    const timestamp = new Date(comment.created_at * 1000).toLocaleString();
    item.append(element('p', comment.author_name + ' · ' + role + ' · ' + timestamp, 'task-meta'));
    if (forFile) {
      const version = comment.package_version === task.package_version ? 'Current ZIP' : 'Earlier ZIP';
      item.append(element('p', version + ' · ' + comment.package_name, 'task-meta'));
    }
    item.append(element('p', comment.message, 'comment-text'));
    return item;
  }

  async function load(olderPage = false) {
    const version = ++loadVersion;
    reload.disabled = older.disabled = true;
    showMessage('Loading comments…', false, notice);
    try {
      const { comments, before } = await api(endpoint + (olderPage ? '&before=' + cursor : ''));
      if (version !== loadVersion) return;
      const items = comments.map(commentItem);
      if (olderPage) thread.prepend(...items);
      else thread.replaceChildren(...items);
      cursor = before;
      older.hidden = cursor === null;
      loaded = true;
      showMessage(thread.childElementCount ? '' : 'No comments yet.', false, notice);
    } catch (error) {
      if (version === loadVersion) showMessage(error.message, true, notice);
    } finally {
      if (version === loadVersion) reload.disabled = older.disabled = false;
    }
  }

  reload.addEventListener('click', () => load());
  older.addEventListener('click', () => load(true));
  if (!forFile || task.has_package) {
    const message = element('textarea');
    message.name = 'message';
    message.required = true;
    message.maxLength = 2000;
    message.rows = 3;
    content.append(formFor([
      field(forFile ? 'Comment on ' + task.package_name : 'Message to contributors and reviewers', message),
    ], 'Post comment', async form => {
      await api(endpoint, { method: 'POST', data: {
        message: form.get('message'),
        package_version: forFile ? task.package_version : undefined,
      } });
      message.value = '';
      await load();
    }));
  }
  panel.append(content);
  panel.addEventListener('toggle', () => {
    if (panel.open && !loaded && !reload.disabled) load();
  });
  return panel;
}

function packagePanel(task, path, refresh, reviewer = false) {
  const panel = element('section', undefined, 'contribute-package');
  panel.append(element('h4', 'Experiment ZIP'));
  if (task.has_package) {
    panel.append(
      element('p', task.package_name + ' · ' + (task.package_size / 1048576).toFixed(2) + ' MiB', 'task-meta'),
      link(reviewer ? 'Download private ZIP' : 'Download ZIP',
        prefix + path + '/package?version=' + encodeURIComponent(task.package_version)),
    );
  } else {
    panel.append(element('p', 'No ZIP attached.', 'task-meta'));
  }
  if (task.package_locked)
    panel.append(element('p', 'Locked by a reviewer. The ZIP can still be downloaded and discussed.', 'task-status'));
  else if (!task.package_editable)
    panel.append(element('p', 'File changes are closed for this review status.', 'task-meta'));

  const canManage = reviewer ? task.has_package || task.package_locked : task.package_editable;
  const manage = details(canManage ? 'Manage ZIP' : 'ZIP comments');
  if (reviewer && canManage) {
    const locked = !task.package_locked;
    manage.append(formFor([], locked ? 'Lock ZIP changes' : 'Unlock ZIP changes', async () => {
      await api(path + '/package-lock', { method: 'PATCH', data: { locked, revision: task.revision } });
      await refresh(locked ? 'ZIP changes locked.' : 'ZIP lock removed.', task.id);
    }));
  }
  if (!reviewer && canManage) {
    const endpoint = path + '/package?revision=' + task.revision;
    const file = input('zip', 'file');
    file.accept = '.zip,application/zip,application/x-zip-compressed';
    file.required = true;
    manage.append(formFor([
      field('Experiment ZIP', file),
      element('p', 'Upload one complete ZIP archive, up to 25 MiB.', 'task-meta'),
    ], task.has_package ? 'Replace ZIP' : 'Upload ZIP', async form => {
      const archive = form.get('zip');
      if (!archive.size || !/\.zip$/i.test(archive.name) || archive.size > maxZip)
        throw new Error('Choose a non-empty ZIP archive of 25 MiB or less.');
      await api(endpoint, { method: 'PUT', file: archive });
      await refresh('ZIP saved.', task.id);
    }));
    if (task.has_package) {
      const remove = formFor([], 'Remove ZIP', async () => {
        if (!await confirmRemoval('Remove ZIP', 'Remove ' + task.package_name + ' from this task? Attach a new ZIP before submitting again.')) return;
        await api(endpoint, { method: 'DELETE' });
        await refresh('ZIP removed.', task.id);
      });
      remove.querySelector('button').classList.add('secondary');
      manage.append(remove);
    }
  }
  if (canManage) manage.append(element('h5', 'ZIP comments'));
  panel.append(discussion(task, path, { forFile: true, panel: manage }));
  return panel;
}

function dryLabGuide(task, path, refresh) {
  const panel = element('section', undefined, 'contribute-pr-guide');
  const steps = element('ol');
  steps.append(
    element('li', 'Open a GitHub pull request with your task files.'),
    element('li', 'Copy the template into your PR description and add the steps to reproduce your results.'),
    element('li', 'Save the PR link below, then choose Submit for review.'),
  );
  const template = element('textarea', undefined, 'contribute-pr-template');
  template.readOnly = true;
  template.rows = 9;
  template.value = [
    '## AISLE Dry Lab submission',
    '',
    '- Task ID: `' + task.id + '`',
    '- Task title: ' + task.title.replace(/\s+/g, ' ').trim(),
    '',
    '## Experiment description',
    '',
    task.description,
    '',
    '## Reproduction and validation',
    '',
    '<!-- Add the task directory, how to run it, and the expected result. -->',
  ].join('\n');

  const copy = button('Copy PR description', 'button', 'secondary');
  const copied = element('p', '', 'contribute-message');
  copied.setAttribute('role', 'status');
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(template.value);
      showMessage('PR description copied.', false, copied);
    } catch {
      template.focus();
      template.select();
      showMessage('Template selected. Press Ctrl+C or Cmd+C to copy it.', false, copied);
    }
  });
  const templateBox = element('div', undefined, 'contribute-form');
  const copyActions = element('div', undefined, 'contribute-toolbar');
  copyActions.append(copy, copied);
  templateBox.append(field('PR description template', template), copyActions);

  const pr = input('pr_url', 'url', task.pr_url, 500);
  pr.required = true;
  panel.append(element('h4', 'Submit your Dry Lab task'), steps, templateBox, formFor([
    field('GitHub pull request URL', pr),
  ], 'Save pull request', async form => {
    await api(path, { method: 'PATCH', data: { pr_url: form.get('pr_url') } });
    await refresh('Pull request saved.', task.id);
  }));
  return panel;
}

function scheduleForm(task, save) {
  const current = task.lab ?? {};
  const name = input('name', 'text', current.name, 120);
  name.required = true;
  const start = input('start', 'time', current.start || '09:00');
  const end = input('end', 'time', current.end || '17:00');
  const timezone = input('timezone', 'text', current.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone, 80);
  start.required = end.required = timezone.required = true;
  const days = element('fieldset');
  days.append(element('legend', 'Operating days'));
  for (const day of weekdays) {
    const box = input('day', 'checkbox', day);
    box.checked = (current.days || []).includes(day);
    days.append(field(day, box));
  }
  return formFor([
    field('Lab name', name),
    field('Availability', select('status', labStates, current.status)),
    days, field('Open from', start), field('Open until', end), field('Time zone (IANA)', timezone),
    field('Schedule note', input('note', 'text', current.note, 2000)),
    field('Lab notice for reviewers', input('notice', 'text', task.notice, 2000)),
  ], 'Save lab availability', form => save({
    lab: {
      name: form.get('name'), status: form.get('status'), days: form.getAll('day'),
      start: form.get('start'), end: form.get('end'), timezone: form.get('timezone'), note: form.get('note'),
    },
    notice: form.get('notice'),
  }));
}

function ownerCard(task, refresh) {
  const card = taskCard(task);
  const path = '/tasks/' + encodeURIComponent(task.id);
  const editable = ['draft', 'changes_requested'].includes(task.status);
  const actions = element('div', undefined, 'contribute-toolbar');
  if (editable) {
    card.append(details('Edit draft details', taskDetailsForm(task, async data => {
      await api(path, { method: 'PATCH', data });
      await refresh('Draft updated.', task.id);
    })));
  }
  if (task.kind === 'wet') {
    card.append(packagePanel(task, path, refresh));
    card.append(details('Manage lab availability', scheduleForm(task, async data => {
      await api(path, { method: 'PATCH', data });
      await refresh('Lab availability saved.', task.id);
    })));
  } else if (editable) {
    card.append(dryLabGuide(task, path, refresh));
  }
  card.append(discussion(task, path));
  if (editable) {
    const submit = button('Submit for review');
    submit.disabled = task.kind === 'wet' ? !task.has_package : !task.pr_url;
    submit.addEventListener('click', async () => {
      submit.disabled = true;
      try {
        await api(path + '/submit', { method: 'POST' });
        await refresh('Task submitted for review.', task.id);
      } catch (error) {
        showMessage(error.message, true);
        submit.disabled = false;
      }
    });
    actions.append(submit);
  }
  if (task.status === 'draft') {
    const discard = formFor([], 'Discard draft', async () => {
      const confirmed = await confirmRemoval('Discard draft',
        'Discard "' + task.title + '" and its comments and attached ZIP? This cannot be undone.');
      if (!confirmed) return;
      await api(path + '?revision=' + task.revision, { method: 'DELETE' });
      await refresh('Draft discarded.');
    });
    discard.querySelector('button').classList.add('contribute-danger');
    actions.append(discard);
  }
  card.append(actions);
  return card;
}

async function initWorkspace() {
  const loginPanel = byId('login-panel');
  const profilePanel = byId('profile-panel');
  const panel = byId('workspace-panel');
  const profileForm = byId('profile-form');
  const newTask = byId('new-task');
  const tasks = byId('my-tasks');
  const preferredKind = new URLSearchParams(location.search).get('kind');
  if (['dry', 'wet'].includes(preferredKind)) newTask.elements.kind.value = preferredKind;

  const refresh = async (message = '', focusTask) => {
    const { tasks: records } = await api('/tasks');
    tasks.replaceChildren(...records.map(task => ownerCard(task, refresh)));
    if (!records.length) tasks.append(element('p', 'No tasks yet. Create a draft to get started.'));
    showMessage(message);
    if (focusTask) byId(focusTask)?.scrollIntoView({ block: 'nearest' });
  };

  async function openWorkspace(session) {
    const { user, profile_complete: complete, admin_eligible: adminEligible } = session;
    loginPanel.hidden = true;
    panel.hidden = false;
    profilePanel.hidden = complete;
    byId('task-area').hidden = !complete;
    byId('account-summary').textContent = complete
      ? user.name + ' · ' + user.organization + ' · ' + user.email
      : user.email;
    byId('admin-link').hidden = !complete || !adminEligible;
    if (complete) {
      await refresh();
    } else {
      profileForm.elements.email.value = user.email;
      profileForm.elements.name.value = user.name;
      profileForm.elements.organization.value = user.organization;
      showMessage('Complete your profile to start a contribution.');
    }
  }

  bindForm(profileForm, async form => {
    await openWorkspace(await api('/me/profile', {
      method: 'PATCH', data: { name: form.get('name'), organization: form.get('organization') },
    }));
  });

  bindForm(newTask, async form => {
    const { id } = await api('/tasks', { method: 'POST', data: Object.fromEntries(form) });
    newTask.reset();
    if (['dry', 'wet'].includes(preferredKind)) newTask.elements.kind.value = preferredKind;
    byId('new-task-panel').open = false;
    await refresh('Draft created.', id);
  });

  byId('sign-out').addEventListener('click', async event => {
    const signOut = event.currentTarget;
    signOut.disabled = true;
    try {
      await api('/auth/logout', { method: 'POST' });
      location.assign('contributor.html');
    } catch (error) {
      showMessage(error.message, true);
      signOut.disabled = false;
    }
  });

  const query = new URLSearchParams(location.search);
  const issue = query.get('auth');
  if (issue) {
    query.delete('auth');
    history.replaceState(null, '', location.pathname + (query.size ? '?' + query : ''));
  }
  try {
    await openWorkspace(await api('/me'));
  } catch (error) {
    if (error.status !== 401) throw error;
    loginPanel.hidden = false;
    const messages = {
      failed: 'GitHub sign-in did not complete. Please try again.',
      account: 'This email is linked to an earlier AISLE account. Contact the team to connect it to GitHub.',
      disabled: 'Your contributor account is disabled. Contact the AISLE team.',
    };
    showMessage(messages[issue] || '', Boolean(messages[issue]));
    const { github_sign_in: ready } = await api('/config');
    if (!ready) throw new Error('GitHub sign-in is not configured yet.');
    const signIn = byId('github-sign-in');
    signIn.disabled = false;
    signIn.addEventListener('click', async () => {
      signIn.disabled = true;
      try {
        const { url } = await api('/auth/start', { method: 'POST', data: { kind: preferredKind } });
        location.assign(url);
      } catch (err) {
        showMessage(err.message, true);
        signIn.disabled = false;
      }
    });
  }
}

async function verifyAdmin(session) {
  if (!session.profile_complete) throw new Error('Complete your profile in the contributor workspace first.');
  if (!session.admin_eligible) throw new Error('Administrator access requires an approved GitHub account.');
  if (session.admin_verified) return true;

  const { enrolled } = await api('/auth/mfa');
  const form = byId('mfa-form');
  const enroll = byId('mfa-enroll');
  byId('admin-mfa').hidden = false;
  form.hidden = !enrolled;
  enroll.hidden = enrolled;
  showMessage('');

  enroll.addEventListener('click', async () => {
    enroll.disabled = true;
    try {
      const { secret } = await api('/auth/mfa/enroll', { method: 'POST' });
      byId('mfa-secret').textContent = secret;
      byId('mfa-setup').hidden = false;
      enroll.hidden = true;
      form.hidden = false;
      form.elements.code.focus();
    } catch (error) {
      showMessage(error.message, true);
      enroll.disabled = false;
    }
  });
  bindForm(form, async data => {
    await api('/auth/mfa/verify', { method: 'POST', data: { code: data.get('code') } });
    byId('mfa-secret').textContent = '';
    location.reload();
  });
  return false;
}

async function initAdmin() {
  if (window.top !== window.self) throw new Error('Open the admin workspace in a separate tab.');
  let session;
  try {
    session = await api('/me');
  } catch (error) {
    if (error.status === 401) throw new Error('Sign in with GitHub from the contributor workspace first.');
    throw error;
  }
  if (!(await verifyAdmin(session))) return;
  const viewButtons = [...document.querySelectorAll('[data-admin-view]')];
  const layoutButtons = [...document.querySelectorAll('[data-admin-mode]')];
  const previous = byId('admin-previous');
  const next = byId('admin-next');
  const items = byId('admin-items');
  let view = 'tasks';
  let page = 0;
  let loading = false;

  function setLayout(layout) {
    items.dataset.layout = layout;
    layoutButtons.forEach(control => control.setAttribute('aria-pressed', String(control.dataset.adminMode === layout)));
    for (const row of items.querySelectorAll(':scope > details')) row.open = layout === 'cards';
  }

  function adminRow(title, metadata, card) {
    const row = element('details', undefined, 'contribute-admin-row');
    row.open = items.dataset.layout === 'cards';
    const summary = element('summary', undefined, 'contribute-admin-summary');
    summary.append(element('span', title), element('span', metadata, 'task-meta'));
    row.append(summary, card);
    return row;
  }

  const refresh = async (requestedView = view, requestedPage = page, message = '', focusTask) => {
    if (loading) return;
    loading = true;
    for (const control of [...viewButtons, previous, next]) control.disabled = true;
    try {
      const result = await api('/admin/' + requestedView + '?page=' + requestedPage);
      view = requestedView;
      page = requestedPage;
      const records = result[view];
      const rows = view === 'tasks'
        ? records.map(task => adminRow(task.title,
          (task.kind === 'wet' ? 'Wet Lab' : 'Dry Lab') + ' · ' + statusLabel(task.status) + ' · ' + dateLabel(task.updated_at),
          reviewCard(task)))
        : records.map(user => adminRow(user.name, user.email + ' · ' + (user.disabled ? 'Disabled' : 'Active'),
          userCard(user, result.viewer_id)));
      items.replaceChildren(...rows);
      if (!records.length) items.append(element('p', 'No records on this page.'));
      byId('admin-view-title').textContent = view === 'tasks' ? 'Submissions' : 'Users';
      byId('admin-page').textContent = 'Page ' + (page + 1);
      viewButtons.forEach(control => control.setAttribute('aria-pressed', String(control.dataset.adminView === view)));
      previous.disabled = page === 0;
      next.disabled = !result.has_more;
      byId('admin-panel').hidden = false;
      showMessage(message);
      if (focusTask) {
        const card = byId(focusTask);
        card?.closest('.contribute-admin-row')?.setAttribute('open', '');
        card?.scrollIntoView({ block: 'nearest' });
      }
    } catch (error) {
      items.replaceChildren();
      byId('admin-panel').hidden = true;
      showMessage(error.status === 401 ? 'Sign in to AISLE from the contributor workspace first.'
        : error.status === 403 ? 'Administrator verification expired. Reload this page and verify your authenticator code.'
        : error.message, true);
    } finally {
      viewButtons.forEach(control => { control.disabled = false; });
      loading = false;
    }
  };

  const refreshTask = (message, id) => refresh(view, page, message, id);

  function reviewCard(task) {
    const card = taskCard(task);
    const path = '/admin/tasks/' + encodeURIComponent(task.id);
    card.append(element('p', task.email + ' · ' + task.organization + ' · Updated ' + dateLabel(task.updated_at), 'task-meta'));
    if (task.status !== 'draft') {
      const saveDetails = async data => {
        await api(path + '/details', { method: 'PATCH', data: { ...data, revision: task.revision } });
        await refreshTask('Task details saved.', task.id);
      };
      card.append(details('Edit task details', taskDetailsForm(task, saveDetails, true)));
      if (task.kind === 'wet')
        card.append(details('Edit lab availability', scheduleForm(task, saveDetails)));
    }
    if (task.kind === 'wet') card.append(packagePanel(task, path, refreshTask, true));
    card.append(discussion(task, path));
    if (!['draft', 'changes_requested'].includes(task.status)) {
      const status = select('status', [...new Set([task.status, ...reviewStates])], task.status);
      card.append(details('Review submission', formFor([field('Review status', status)], 'Save review', async form => {
        await api(path, { method: 'PATCH', data: { status: form.get('status'), revision: task.revision } });
        await refreshTask('Review status saved.', task.id);
      })));
    }
    const remove = formFor([], 'Delete task', async () => {
      const confirmed = await confirmRemoval('Delete task',
        'Delete "' + task.title + '" and its comments and attached ZIP? This cannot be undone.');
      if (!confirmed) return;
      await api(path + '?revision=' + task.revision, { method: 'DELETE' });
      await refreshTask('Task deleted.');
    });
    remove.classList.add('contribute-task-delete');
    card.append(remove);
    return card;
  }

  function userCard(user, viewerId) {
    const card = element('article', undefined, 'contribute-card');
    const change = button(user.disabled ? 'Enable account' : 'Disable account', 'button', 'secondary');
    change.addEventListener('click', async () => {
      if (!confirm((user.disabled ? 'Enable ' : 'Disable ') + user.email + '?')) return;
      change.disabled = true;
      try {
        await api('/admin/users/' + encodeURIComponent(user.id), { method: 'PATCH', data: { disabled: !user.disabled } });
        await refresh();
      } catch (error) {
        showMessage(error.message, true);
        change.disabled = false;
      }
    });
    card.append(element('h3', user.name),
      element('p', user.email + ' · ' + user.organization),
      element('p', (user.disabled ? 'Disabled' : 'Active') + ' · Joined ' + dateLabel(user.created_at), 'task-meta'));
    if (viewerId !== user.id) card.append(change);
    return card;
  }

  viewButtons.forEach(control => control.addEventListener('click', () => refresh(control.dataset.adminView, 0)));
  layoutButtons.forEach(control => control.addEventListener('click', () => setLayout(control.dataset.adminMode)));
  previous.addEventListener('click', () => refresh(view, page - 1));
  next.addEventListener('click', () => refresh(view, page + 1));
  await refresh();
}

if (root) {
  const init = root.dataset.contributeView === 'admin' ? initAdmin : initWorkspace;
  init().catch(error => showMessage(error.message, true));
}
