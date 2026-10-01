import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App.jsx';
import { mockServer, JD_TEXT, json, generateResponse, sse } from './mockServer.js';

const setup = async (overrides) => {
  const server = mockServer(overrides);
  const user = userEvent.setup();
  render(<App />);
  await screen.findByRole('button', { name: /Offline demo writer/ });
  return { server, user };
};

const pasteJob = async (user) => {
  fireEvent.change(screen.getByLabelText('Job description'), { target: { value: JD_TEXT } });
  await waitFor(() => expect(screen.getByTestId('match-score')).toHaveTextContent('58'), { timeout: 3000 });
};

const writeDrafts = async (user, label = /Write 2 drafts/) => {
  await user.click(screen.getByRole('button', { name: label }));
  await screen.findByRole('tab', { name: 'Email' });
};

describe('ApplyForge app', () => {
  it('starts with a clear empty state and loads models', async () => {
    await setup();
    expect(screen.getByRole('heading', { name: 'The job' })).toBeInTheDocument();
    expect(screen.getByText(/Try a sample job/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Write 2 drafts/ })).toBeDisabled();
    expect(screen.getByLabelText('Message the coach')).toBeDisabled();
  });

  it('loads a sample job and marks it up with keyword buckets', async () => {
    const { user } = await setup();
    await user.click(screen.getByText(/Try a sample job/));
    await waitFor(() => expect(screen.getByTestId('match-score')).toBeInTheDocument(), { timeout: 3000 });
    await user.click(screen.getByRole('button', { name: 'Marked up' }));
    const marked = screen.getByTestId('marked-jd');
    expect(marked.querySelector('.hl--have')).toBeTruthy();
    expect(screen.getByRole('textbox', { name: 'Role' })).toHaveValue('Data Analyst');
    expect(screen.getByRole('textbox', { name: 'Company' })).toHaveValue('Globex');
    expect(screen.getByText(/about 75 tokens/)).toBeInTheDocument();
  });

  it('shows have, bridge and gap keywords', async () => {
    const { user } = await setup();
    await pasteJob(user);
    expect(screen.getByText('You have')).toBeInTheDocument();
    expect(screen.getByText(/via Power BI/)).toBeInTheDocument();
    expect(within(screen.getByText(/Gaps, not claimed/).closest('.kw-group')).getByText('Kubernetes')).toBeInTheDocument();
  });

  it('generates only the selected drafts and reports token usage', async () => {
    const { user, server } = await setup();
    await pasteJob(user);
    await user.click(screen.getByRole('button', { name: 'Resume' }));
    expect(screen.getByRole('button', { name: /Write 3 drafts/ })).toBeEnabled();
    await writeDrafts(user, /Write 3 drafts/);
    const call = server.calls.find((c) => c.key === 'POST /api/generate');
    expect(call.body.sections).toEqual(['email', 'linkedin', 'resume']);
    expect(call.body.tone).toBe('metrics');
    expect(call.body.profile.name).toBe('Test Person');
    expect(call.body.role).toBe('Data Analyst');
    expect(screen.getByLabelText('Recruiter email text')).toHaveValue('metrics email draft. Second sentence.');
    expect(screen.getByTestId('usage-line')).toHaveTextContent('1,200 tokens in and 300 out');
  });

  it('says when a result came from the cache', async () => {
    const { user } = await setup({ 'POST /api/generate': (b) => json(generateResponse(b.sections, b.tone, true)) });
    await pasteJob(user);
    await writeDrafts(user);
    expect(screen.getByTestId('usage-line')).toHaveTextContent('0 tokens used');
  });

  it('lets you edit, rewrite and undo a draft', async () => {
    let n = 0;
    const { user } = await setup({
      'POST /api/generate': (b) => {
        n += 1;
        const r = generateResponse(b.sections, b.tone);
        for (const s of b.sections) r.drafts[s].text = `version ${n} of ${s}`;
        return json(r);
      },
    });
    await pasteJob(user);
    await writeDrafts(user);
    const box = screen.getByLabelText('Recruiter email text');
    expect(box).toHaveValue('version 1 of email');
    await user.click(screen.getByRole('button', { name: /Rewrite/ }));
    await waitFor(() => expect(box).toHaveValue('version 2 of email'));
    await user.click(screen.getByRole('button', { name: /Undo/ }));
    expect(box).toHaveValue('version 1 of email');
    fireEvent.change(box, { target: { value: 'my own edit' } });
    expect(box).toHaveValue('my own edit');
  });

  it('copies a draft to the clipboard', async () => {
    const { user } = await setup();
    await pasteJob(user);
    await writeDrafts(user);
    await user.click(screen.getByRole('button', { name: /^Copy$/ }));
    expect(await screen.findByRole('button', { name: /Copied/ })).toBeInTheDocument();
    expect(screen.getByText('Recruiter email copied')).toBeInTheDocument();
  });

  it('writes the other tone on demand', async () => {
    const { user, server } = await setup();
    await pasteJob(user);
    await writeDrafts(user);
    await user.click(screen.getByRole('button', { name: 'Concise' }));
    await user.click(screen.getByRole('button', { name: /Write concise version/ }));
    await waitFor(() => expect(screen.getByLabelText('Recruiter email text')).toHaveValue('concise email draft. Second sentence.'));
    const calls = server.calls.filter((c) => c.key === 'POST /api/generate');
    expect(calls.at(-1).body).toMatchObject({ tone: 'concise', sections: ['email', 'linkedin'] });
  });

  it('shows a LinkedIn character ring', async () => {
    const { user } = await setup({
      'POST /api/generate': (b) => {
        const r = generateResponse(b.sections);
        r.drafts.linkedin.text = 'x'.repeat(320);
        return json(r);
      },
    });
    await pasteJob(user);
    await writeDrafts(user);
    await user.click(screen.getByRole('tab', { name: 'LinkedIn' }));
    expect(screen.getByText('320/300')).toBeInTheDocument();
  });

  it('streams a coach revision, shows the diff and applies it', async () => {
    const { user, server } = await setup();
    await pasteJob(user);
    await writeDrafts(user);
    await user.click(screen.getByRole('button', { name: 'Make it shorter' }));
    expect(await screen.findByText('Trimmed it.')).toBeInTheDocument();
    const diff = screen.getByTestId('revision-diff');
    expect(diff.querySelector('del')).toHaveTextContent('Second sentence.');
    const chat = server.calls.find((c) => c.key === 'POST /api/chat');
    expect(chat.body).toMatchObject({ message: 'Make it shorter', docType: 'email', draft: 'metrics email draft. Second sentence.' });
    await user.click(screen.getByRole('button', { name: /Apply to draft/ }));
    expect(screen.getByLabelText('Recruiter email text')).toHaveValue('metrics email draft.');
    expect(screen.getByText('Applied')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Undo/ }));
    expect(screen.getByLabelText('Recruiter email text')).toHaveValue('metrics email draft. Second sentence.');
  });

  it('sends typed chat messages with history and supports dismiss', async () => {
    const { user, server } = await setup();
    await pasteJob(user);
    await writeDrafts(user);
    const box = screen.getByLabelText('Message the coach');
    await user.type(box, 'first ask{Enter}');
    await screen.findByText('Trimmed it.');
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.getByText('Dismissed')).toBeInTheDocument();
    await user.type(box, 'second ask{Enter}');
    await waitFor(() => expect(server.calls.filter((c) => c.key === 'POST /api/chat')).toHaveLength(2));
    const second = server.calls.filter((c) => c.key === 'POST /api/chat')[1];
    expect(second.body.history.map((m) => m.role)).toEqual(['user', 'assistant']);
    expect(second.body.history[0].content).toBe('first ask');
  });

  it('asks general questions when no draft is open', async () => {
    const { user, server } = await setup({
      'POST /api/chat': () => sse([{ type: 'done', note: 'Lead with SQL.', draft: null, usage: { input: 1, output: 1 } }]),
    });
    await pasteJob(user);
    expect(screen.getByText('General questions')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'What should I emphasize?' }));
    expect(await screen.findByText('Lead with SQL.')).toBeInTheDocument();
    expect(server.calls.find((c) => c.key === 'POST /api/chat').body.docType).toBe('general');
  });

  it('can stop a streaming reply', async () => {
    const { user } = await setup({
      'POST /api/chat': (body, init) =>
        new Response(
          new ReadableStream({
            start(c) {
              c.enqueue(new TextEncoder().encode('data: {"type":"text","text":"Thinking "}\n\n'));
              init.signal.addEventListener('abort', () => c.error(new DOMException('aborted', 'AbortError')));
            },
          }),
          { status: 200 },
        ),
    });
    await pasteJob(user);
    await user.type(screen.getByLabelText('Message the coach'), 'long answer please{Enter}');
    await user.click(await screen.findByRole('button', { name: 'Stop' }));
    expect(await screen.findByText('Stopped.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
  });

  it('opens settings when the model needs a key', async () => {
    const { user } = await setup({
      'POST /api/generate': () => json({ error: 'OpenAI is not configured.', code: 'missing_key' }, 400),
    });
    await pasteJob(user);
    await user.click(screen.getByRole('button', { name: /Write 2 drafts/ }));
    expect(await screen.findByText('OpenAI is not configured.')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Model and settings' })).toBeInTheDocument();
  });

  it('shows coach errors inline', async () => {
    const { user } = await setup({
      'POST /api/chat': () => json({ error: 'Rate limited, wait a minute.', code: 'rate_limited' }, 429),
    });
    await pasteJob(user);
    await user.type(screen.getByLabelText('Message the coach'), 'hello{Enter}');
    expect(await screen.findByText('Rate limited, wait a minute.')).toBeInTheDocument();
  });

  it('sends your own API key after choosing a provider', async () => {
    const { user, server } = await setup();
    await pasteJob(user);
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    await user.click(screen.getByRole('radio', { name: /OpenAI/ }));
    await user.type(screen.getByLabelText(/Your OpenAI API key/), 'sk-test');
    await user.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: /GPT-4o mini/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Write 2 drafts/ }));
    await screen.findByRole('tab', { name: 'Email' });
    const call = server.calls.find((c) => c.key === 'POST /api/generate');
    expect(call.body).toMatchObject({ provider: 'openai', model: 'gpt-4o-mini' });
    expect(call.headers['x-provider-key']).toBe('sk-test');
    expect(window.localStorage.getItem('applyforge:keys')).toBeNull();
  });

  it('generates with Ctrl+Enter', async () => {
    const { user, server } = await setup();
    await pasteJob(user);
    await user.keyboard('{Control>}{Enter}{/Control}');
    await screen.findByRole('tab', { name: 'Email' });
    expect(server.calls.some((c) => c.key === 'POST /api/generate')).toBe(true);
  });

  it('saves profile edits and uses them for the next request', async () => {
    const { user, server } = await setup();
    await pasteJob(user);
    await user.click(screen.getByRole('button', { name: /Profile/ }));
    const dialog = screen.getByRole('dialog', { name: 'Your profile' });
    const name = within(dialog).getByRole('textbox', { name: 'Full name' });
    await user.clear(name);
    await user.click(within(dialog).getByRole('button', { name: 'Save profile' }));
    expect(within(dialog).getByRole('alert')).toHaveTextContent('Name and headline are required.');
    await user.type(name, 'Jordan Lee');
    await user.clear(within(dialog).getByRole('textbox', { name: /Skills/ }));
    await user.type(within(dialog).getByRole('textbox', { name: /Skills/ }), 'SQL, dbt');
    await user.click(within(dialog).getByRole('button', { name: 'Save profile' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await writeDrafts(user);
    const call = server.calls.filter((c) => c.key === 'POST /api/generate').at(-1);
    expect(call.body.profile.name).toBe('Jordan Lee');
    expect(call.body.profile.skills).toEqual(['SQL', 'dbt']);
  });

  it('tracks applications and moves them through statuses', async () => {
    const { user } = await setup();
    await pasteJob(user);
    await writeDrafts(user);
    await user.click(screen.getByRole('button', { name: /Track application/ }));
    expect(screen.getByText('Tracking Data Analyst at Globex')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Applications/ }));
    const dialog = screen.getByRole('dialog', { name: 'Applications' });
    expect(within(dialog).getByRole('heading', { name: 'Data Analyst' })).toBeInTheDocument();
    await user.selectOptions(within(dialog).getByRole('combobox'), 'sent');
    const saved = JSON.parse(window.localStorage.getItem('applyforge:apps'));
    expect(saved[0].status).toBe('sent');
    expect(saved[0].sentAt).toBeTruthy();
    await user.click(within(dialog).getByRole('button', { name: /Delete Data Analyst/ }));
    expect(within(dialog).getByText(/Nothing tracked yet/)).toBeInTheDocument();
  });

  it('flags follow-ups that are due and reopens a saved application', async () => {
    const old = new Date(Date.now() - 8 * 86_400_000).toISOString();
    window.localStorage.setItem(
      'applyforge:apps',
      JSON.stringify([
        {
          id: 'a1',
          role: 'BI Developer',
          company: 'Initech',
          jd: JD_TEXT,
          status: 'sent',
          sentAt: old,
          createdAt: old,
          drafts: { metrics: { email: { text: 'saved email', quality: { issues: [] }, history: [] } }, concise: {} },
        },
      ]),
    );
    const { user } = await setup();
    expect(screen.getByLabelText('1 follow-ups due')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Applications/ }));
    expect(screen.getByText(/Time to follow up/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Open/ }));
    expect(screen.getByLabelText('Recruiter email text')).toHaveValue('saved email');
    expect(screen.getByRole('textbox', { name: 'Role' })).toHaveValue('BI Developer');
  });

  it('starts a new job cleanly', async () => {
    const { user } = await setup();
    await pasteJob(user);
    await writeDrafts(user);
    await user.click(screen.getByRole('button', { name: /New job/ }));
    expect(screen.getByLabelText('Job description')).toHaveValue('');
    expect(screen.queryByRole('tab', { name: 'Email' })).not.toBeInTheDocument();
  });

  it('switches theme', async () => {
    const { user } = await setup();
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    await user.click(screen.getByRole('button', { name: 'Dark' }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    await user.click(screen.getByRole('button', { name: 'Auto' }));
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('switches panes on small screens', async () => {
    const { user } = await setup();
    const nav = screen.getByRole('navigation', { name: 'Sections' });
    await user.click(within(nav).getByRole('button', { name: /Coach/ }));
    expect(document.querySelector('.app').dataset.view).toBe('chat');
  });

  it('reports a server that cannot be reached', async () => {
    mockServer({ 'GET /api/models': () => Promise.reject(new TypeError('offline')) });
    render(<App />);
    expect(await screen.findByText(/Could not reach the ApplyForge server/)).toBeInTheDocument();
  });
});
