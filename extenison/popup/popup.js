// Toolbar popup: sign in, plan and usage, the freelancer profile used to personalise
// proposals, and recent proposals.
;(() => {
  const { el, icon, googleMark, request, alertBox, button, usageCard, planCards, choiceGroup, copyButton, skeleton } =
    Copalat
  const root = document.getElementById('root')

  const state = {
    app: null, // { user, account, selectors, config } from the background
    settings: null, // editable copy of account.settings
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
    state.history = app.user ? (await request('GET_HISTORY')).proposals : []
  }

  const load = (action) => run(async () => applyState(await request(action)))
  const checkout = (plan) => run(() => request('CHECKOUT', { plan }))
  const manage = () => run(() => request('PORTAL'))
  const save = () =>
    run(async () => {
      await request('SAVE_SETTINGS', state.settings)
      state.notice = 'Saved. New proposals will use this profile.'
    })

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

  const profileView = (config) => {
    const { settings } = state
    return [
      el('div', { class: 'subtitle' }, icon('user', 13), el('span', { text: 'Your profile' })),
      el(
        'label',
        { class: 'field' },
        el('textarea', {
          rows: 5,
          maxLength: 3000,
          'aria-label': 'Skills, experience and results',
          placeholder:
            'Your skills, experience and results. e.g. Shopify developer, 6 years. Built 40+ stores, speed optimisation, custom themes.',
          value: settings.about,
          oninput: (event) => (settings.about = event.target.value),
        }),
        el('span', {
          class: 'hint',
          text: 'Proposals only claim what you write here. Nothing is invented.',
        }),
      ),
      choiceGroup('Default tone', 'chips', config.tones, settings.tone, (value) => (settings.tone = value)),
      choiceGroup('Default length', 'segments', config.lengths, settings.length, (value) => (settings.length = value)),
      button('dark wide', 'Save profile', { disabled: state.loading, onclick: save }),
    ]
  }

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
    profileView(config),
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
