// Toolbar popup: sign in, plan and usage, the freelancer's saved profiles and default
// tone / length, and recent proposals.
;(() => {
  const { el, icon, googleMark, request, alertBox, button, usageCard, planCards, choiceGroup, copyButton, skeleton } =
    Copalat
  const root = document.getElementById('root')

  const state = {
    app: null, // { user, account, selectors, profiles, config } from the background
    settings: null, // editable copy of account.settings (default tone and length)
    editing: null, // the profile open in the editor: { id?, name, about }, or null
    history: [],
    loading: true,
    error: '',
    notice: '',
  }

  const run = async (task) => {
    Object.assign(state, { loading: true, error: '', notice: '' })
    render()
    try {
      await task()
    } catch (error) {
      state.error = error.message
    }
    state.loading = false
    render()
  }

  const applyState = async (app) => {
    state.app = app
    state.settings = app.account ? { ...app.account.settings } : null
    state.editing = null
    state.history = app.user ? (await request('GET_HISTORY')).proposals : []
  }

  const load = (action) => run(async () => applyState(await request(action)))
  const checkout = (plan) => run(() => request('CHECKOUT', { plan }))
  const manage = () => run(() => request('PORTAL'))

  // ---------- profiles ----------

  const changeProfiles = (payload, notice) =>
    run(async () => {
      const { profiles, account } = await request('PROFILES', payload)
      Object.assign(state.app, { profiles, account })
      state.editing = null
      state.notice = notice
    })

  const edit = (profile) => {
    state.editing = profile ? { ...profile } : { name: '', about: '' }
    Object.assign(state, { error: '', notice: '' })
    render()
  }

  const closeEditor = () => {
    state.editing = null
    render()
  }

  const saveProfile = () => {
    const { id, name, about } = state.editing
    // The first profile becomes the default without the user having to say so.
    const makeDefault = !state.app.profiles.length
    changeProfiles({ action: 'save', id, name, about, makeDefault }, 'Profile saved.')
  }

  const profileEditor = () => {
    const { editing } = state
    return el(
      'div',
      { class: 'editor stack tight' },
      el(
        'label',
        { class: 'field' },
        el('span', { class: 'label', text: 'Profile name' }),
        el('input', {
          type: 'text',
          maxLength: 60,
          placeholder: 'e.g. Shopify developer',
          value: editing.name,
          oninput: (event) => (editing.name = event.target.value),
        }),
      ),
      el(
        'label',
        { class: 'field' },
        el('span', { class: 'label', text: 'Skills, experience and results' }),
        el('textarea', {
          rows: 6,
          maxLength: 3000,
          placeholder: 'e.g. 6 years building Shopify stores. Shipped 40+ stores, cut load time by half on three of them.',
          value: editing.about,
          oninput: (event) => (editing.about = event.target.value),
        }),
        el('span', { class: 'hint', text: 'Proposals only claim what you write here. Nothing is invented.' }),
      ),
      el(
        'div',
        { class: 'row' },
        button('dark grow', editing.id ? 'Save changes' : 'Save profile', { disabled: state.loading, onclick: saveProfile }),
        button('ghost', 'Cancel', { onclick: closeEditor }),
      ),
    )
  }

  const profileRow = (profile) =>
    el(
      'div',
      { class: profile.is_default ? 'profile profile-default' : 'profile' },
      el(
        'div',
        { class: 'row' },
        el('div', { class: 'truncate grow profile-name', text: profile.name }),
        profile.is_default && el('span', { class: 'pill', text: 'Default' }),
      ),
      el('div', { class: 'preview', text: profile.about }),
      el(
        'div',
        { class: 'row profile-actions' },
        el('button', { type: 'button', class: 'link', text: 'Edit', onclick: () => edit(profile) }),
        !profile.is_default &&
          el('button', {
            type: 'button',
            class: 'link',
            text: 'Make default',
            onclick: () => changeProfiles({ action: 'default', id: profile.id }, `"${profile.name}" is now your default.`),
          }),
        el('button', {
          type: 'button',
          class: 'link link-danger',
          text: 'Delete',
          onclick: () => changeProfiles({ action: 'delete', id: profile.id }, 'Profile deleted.'),
        }),
      ),
    )

  const profilesView = () => {
    const { profiles } = state.app
    return [
      el(
        'div',
        { class: 'row between' },
        el('div', { class: 'subtitle' }, icon('user', 13), el('span', { text: 'Your profiles' })),
        !state.editing &&
          profiles.length > 0 &&
          el('button', { type: 'button', class: 'link', text: '+ New profile', onclick: () => edit() }),
      ),
      state.editing
        ? profileEditor()
        : profiles.length
        ? profiles.map(profileRow)
        : el(
            'div',
            { class: 'empty stack tight' },
            el('span', {
              text: 'Add a profile so proposals are written from your real skills and results. You can keep several, one per kind of work.',
            }),
            button('dark', 'Create your first profile', { onclick: () => edit() }),
          ),
    ]
  }

  // ---------- defaults ----------

  // Tone and length are saved as soon as they are picked.
  const saveDefault = (key, value) => {
    state.settings[key] = value
    run(async () => {
      const { account } = await request('SAVE_SETTINGS', state.settings)
      state.app.account = account
      state.notice = 'Default saved.'
    })
  }

  const defaultsView = (config) => [
    el('div', { class: 'subtitle' }, icon('sparkles', 13), el('span', { text: 'Defaults' })),
    choiceGroup('Tone', 'chips', config.tones, state.settings.tone, (value) => saveDefault('tone', value)),
    choiceGroup('Length', 'segments', config.lengths, state.settings.length, (value) => saveDefault('length', value)),
  ]

  // ---------- the rest ----------

  const signedOutView = (config) =>
    el(
      'div',
      { class: 'hero' },
      el('div', { class: 'headline', text: 'Upwork proposals that get opened, in seconds' }),
      el(
        'ul',
        { class: 'welcome' },
        [
          'Tailored to each job post',
          'Screening questions answered',
          'Inserted into Upwork’s form in one click',
        ].map((text) => el('li', {}, icon('check', 14), el('span', { text }))),
      ),
      el(
        'button',
        { type: 'button', class: 'btn ghost wide', disabled: state.loading, onclick: () => load('SIGN_IN') },
        googleMark(),
        el('span', { text: 'Continue with Google' }),
      ),
      el('div', {
        class: 'muted',
        text: `${config.freeTrial} proposals free, no card. Then from ${config.plans[0].price} a month.`,
      }),
    )

  const historyView = () => [
    el('div', { class: 'subtitle' }, icon('history', 13), el('span', { text: 'Recent proposals' })),
    state.history.length
      ? el(
          'div',
          { class: 'history' },
          state.history.map((item) =>
            el(
              'div',
              { class: 'row history-item' },
              el(
                'div',
                { class: 'grow' },
                item.job_title && el('div', { class: 'truncate history-title', text: item.job_title }),
                // Two lines of the letter itself, so proposals can be told apart.
                el('div', { class: 'preview', text: item.content }),
                el('div', { class: 'muted', text: new Date(item.created_at).toLocaleDateString() }),
              ),
              copyButton(item.content),
            ),
          ),
        )
      : el('div', {
          class: 'empty',
          text: 'Open a job on Upwork and click Apply. Your proposals will show up here.',
        }),
  ]

  const signedInView = ({ user, account, config }) => [
    el(
      'div',
      { class: 'row account' },
      user.avatar
        ? el('img', { class: 'avatar', src: user.avatar, alt: '', referrerPolicy: 'no-referrer' })
        : el('div', { class: 'avatar' }),
      el(
        'div',
        { class: 'grow' },
        el('div', { class: 'truncate', text: user.name }),
        el('div', { class: 'muted truncate', text: user.email }),
      ),
      el('button', { type: 'button', class: 'link', text: 'Sign out', onclick: () => load('SIGN_OUT') }),
    ),
    usageCard(account),
    planCards({ account, plans: config.plans, disabled: state.loading, onChoose: checkout, onManage: manage }),
    el('hr', { class: 'divider' }),
    profilesView(),
    el('hr', { class: 'divider' }),
    defaultsView(config),
    el('hr', { class: 'divider' }),
    historyView(),
  ]

  function render() {
    const { app } = state
    const body = !app
      ? state.loading && skeleton()
      : app.user && app.account
      ? signedInView(app)
      : signedOutView(app.config)
    root.replaceChildren(
      el(
        'div',
        { class: 'popup-head' },
        el(
          'div',
          { class: 'row' },
          el('img', { class: 'logo', src: '../logo.png', alt: '' }),
          el('div', { class: 'title grow', text: 'Copalat' }),
          el('span', { class: 'muted', text: 'AI Upwork proposal writer' }),
        ),
      ),
      ...[
        el('div', { class: 'progress', hidden: !state.loading }),
        alertBox('error', state.error),
        alertBox('success', state.notice),
        body,
      ]
        .flat(Infinity)
        .filter(Boolean),
    )
  }

  load('GET_STATE')
})()
