// Widget on the Upwork "submit a proposal" page: sign in, write the proposal with AI,
// insert it into the form. Rendered in a shadow root so the page's styles stay out.
;(() => {
  const {
    el,
    icon,
    googleMark,
    request,
    wordCount,
    usagePill,
    alertBox,
    button,
    planCards,
    choiceGroup,
    copyButton,
    skeleton,
  } = Copalat

  const state = {
    app: null, // { user, account, selectors, config } from the background
    expanded: true,
    loading: false,
    generating: false,
    error: '',
    notice: '',
    proposal: null,
    tone: '',
    length: '',
    instructions: '',
  }
  // Page fields found when the proposal was generated, used by the Insert buttons.
  let fields = { coverLetter: undefined, questions: [] }
  // True only for the render right after opening or minimizing, so the entrance animation
  // does not replay every time the contents change.
  let entering = true

  // ---------- reading and filling the Upwork page ----------

  const sleep = (seconds) => new Promise((resolve) => setTimeout(resolve, seconds * 1000))

  // Selectors come from the server, so an empty or invalid one must not break the page.
  const queryAll = (selector) => {
    if (!selector) return []
    try {
      return [...document.querySelectorAll(selector)]
    } catch {
      return []
    }
  }

  const textOf = (selector) => queryAll(selector)[0]?.innerText?.trim() || ''

  const labelOf = (field) => {
    const labelledBy = (field.getAttribute('aria-labelledby') || '')
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.innerText || '')
      .join(' ')
      .trim()
    if (labelledBy) return labelledBy
    if (field.labels?.length) return field.labels[0].innerText.trim()
    const group = field.closest('.form-group, fieldset, [class*="form-group"], [class*="question"]')
    return group?.querySelector('label')?.innerText?.trim() || field.getAttribute('aria-label') || ''
  }

  // The proposal form's cover letter box and the client's screening question boxes.
  const findFormFields = (selectors) => {
    const textareas = [...document.querySelectorAll('textarea')].filter((field) => field.offsetParent !== null)
    const coverLetter =
      queryAll(selectors.coverLetter)[0] ||
      textareas.find((field) => /cover letter/i.test(labelOf(field))) ||
      textareas[0]
    const questions = textareas
      .filter((field) => field !== coverLetter)
      .map((field) => ({ field, label: labelOf(field) }))
      .filter(({ label }) => label.length > 5)
      .slice(0, 6)
    return { coverLetter, questions }
  }

  // Fills a field the way typing would, so the page's own framework notices the new value.
  const insertText = (field, text) => {
    if (!field || !field.isConnected) return false
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
    setter?.call(field, text)
    field.dispatchEvent(new Event('input', { bubbles: true }))
    field.dispatchEvent(new Event('change', { bubbles: true }))
    field.focus()
    return true
  }

  // The job's title, so saved proposals can be told apart. Uses the configured selector,
  // then the nearest heading above the description that is not a section label, then the
  // first line of the description.
  const jobTitle = (selectors, description) => {
    const configured = textOf(selectors.title)
    if (configured) return configured

    const sectionLabel = /^(job details|submit a proposal|terms|cover letter|additional details|skills and expertise)$/i
    let scope = queryAll(selectors.description)[0]?.parentElement
    for (let depth = 0; scope && depth < 5; depth += 1, scope = scope.parentElement) {
      const heading = [...scope.querySelectorAll('h1, h2, h3, h4')]
        .map((node) => node.innerText?.trim() || '')
        .find((text) => text.length > 8 && text.length < 200 && !sectionLabel.test(text))
      if (heading) return heading
    }
    const firstLine = description.split('\n')[0].trim()
    return firstLine.length > 80 ? `${firstLine.slice(0, 77)}...` : firstLine
  }

  const prepareJobData = async (selectors) => {
    const more = queryAll(selectors.moreDescription)[0]
    if (more) {
      more.click()
      await sleep(1)
    }
    const { coverLetter, questions } = findFormFields(selectors)
    fields = { coverLetter, questions: questions.map(({ field }) => field) }
    const description = textOf(selectors.description)
    return {
      url: window.location.pathname,
      title: jobTitle(selectors, description),
      description,
      skillBadge: textOf(selectors.skillBadge),
      skills: queryAll(selectors.allTags)
        .map((tag) => tag.innerText?.trim())
        .filter(Boolean),
      questions: questions.map(({ label }) => label),
    }
  }

  // ---------- actions ----------

  const run = async (task) => {
    Object.assign(state, { loading: true, error: '', notice: '' })
    render()
    try {
      await task()
    } catch (error) {
      state.error = error.message
    }
    Object.assign(state, { loading: false, generating: false })
    render()
  }

  const loadState = async () => {
    state.app = await request('GET_STATE')
  }

  const signIn = () =>
    run(async () => {
      state.app = await request('SIGN_IN')
    })

  const generate = () =>
    run(async () => {
      state.generating = true
      render()
      const job = await prepareJobData(state.app.selectors)
      const { tone, length, instructions } = state
      try {
        state.proposal = await request('GENERATE', { job, options: { tone, length, instructions } })
        state.app.account = state.proposal.account
      } catch (error) {
        // Out of proposals: the server sends the up to date account so the plans show.
        if (error.code === 'limit' && error.account) state.app.account = error.account
        if (error.code === 'auth') await loadState()
        throw error
      }
    })

  const checkout = (plan) =>
    run(async () => {
      await request('CHECKOUT', { plan })
      state.notice = 'Finish the payment in the new tab. Your plan is activated as soon as you come back.'
    })

  const manage = () => run(() => request('PORTAL'))

  const insert = (field, text) => {
    const done = insertText(field, text)
    state.notice = done ? 'Inserted. Review it before you submit.' : ''
    state.error = done ? '' : 'Could not find that field on this page. Use Copy instead.'
    render()
  }

  const toggle = () => {
    state.expanded = !state.expanded
    entering = true
    render()
  }

  // ---------- views ----------

  const signInView = (config) => [
    el('div', { class: 'headline', text: 'Write this proposal in seconds' }),
    el(
      'ul',
      { class: 'welcome' },
      [
        'A cover letter written for this exact job',
        'Answers to the client’s screening questions',
        `Your first ${config.freeTrial} proposals are free, no card`,
      ].map((text) => el('li', {}, icon('check', 14), el('span', { text }))),
    ),
    el(
      'button',
      { type: 'button', class: 'btn ghost wide', disabled: state.loading, onclick: signIn },
      googleMark(),
      el('span', { text: 'Continue with Google' }),
    ),
  ]

  const upgradeView = (account, config) => [
    el('div', {
      class: 'headline',
      text: account.active ? 'You’ve used this month’s proposals' : 'Your free proposals are used up',
    }),
    el('div', {
      class: 'muted',
      text: account.active
        ? 'Switch plan for more proposals, or wait for your next billing period.'
        : 'Pick a plan to keep writing proposals that get opened.',
    }),
    planCards({ account, plans: config.plans, disabled: state.loading, onChoose: checkout, onManage: manage }),
  ]

  const generateView = (account, config) => [
    choiceGroup('Tone', 'chips', config.tones, state.tone || account.settings.tone, (value) => (state.tone = value)),
    choiceGroup(
      'Length',
      'segments',
      config.lengths,
      state.length || account.settings.length,
      (value) => (state.length = value),
    ),
    el(
      'label',
      { class: 'field' },
      el('span', { class: 'label', text: 'Anything to mention? (optional)' }),
      el('input', {
        type: 'text',
        maxLength: 500,
        placeholder: 'e.g. I built a similar store last month',
        value: state.instructions,
        oninput: (event) => (state.instructions = event.target.value),
      }),
    ),
    button(
      'primary wide',
      state.generating ? 'Writing your proposal…' : state.proposal ? 'Regenerate' : 'Generate proposal',
      { disabled: state.loading, onclick: generate },
      state.proposal ? 'refresh' : 'sparkles',
    ),
    !account.settings.about &&
      !state.proposal &&
      el('div', {
        class: 'hint',
        text: 'Tip: add your skills and experience in the Copalat toolbar popup, so proposals are written from your real background.',
      }),
  ]

  const resultCard = (title, meta, text, onInsert) =>
    el(
      'div',
      { class: 'result' },
      el(
        'div',
        { class: 'result-head' },
        el('div', { class: 'result-title truncate', title }, title, meta && el('small', { text: meta })),
        button('dark small', 'Insert', { onclick: onInsert }, 'insert'),
        copyButton(text),
      ),
      el('p', { class: 'proposal-text', text }),
    )

  const proposalView = (proposal) => [
    resultCard('Cover letter', `${wordCount(proposal.coverLetter)} words`, proposal.coverLetter, () =>
      insert(fields.coverLetter, proposal.coverLetter),
    ),
    proposal.answers.map((item, index) =>
      resultCard(item.question || `Question ${index + 1}`, '', item.answer, () =>
        insert(fields.questions[index], item.answer),
      ),
    ),
  ]

  const bodyView = () => {
    const { app } = state
    if (!app) return state.loading ? skeleton() : []
    const { account, config } = app
    return [
      !app.user && signInView(config),
      account && account.remaining <= 0 && upgradeView(account, config),
      account && account.remaining > 0 && generateView(account, config),
      state.generating ? skeleton() : state.proposal && proposalView(state.proposal),
    ]
  }

  // ---------- mount ----------

  const host = document.createElement('div')
  host.id = 'copalat-root'
  const shadow = host.attachShadow({ mode: 'open' })
  const styles = el('link', { rel: 'stylesheet', href: chrome.runtime.getURL('lib/ui.css') })
  // Hidden until the stylesheet has loaded, so the widget never flashes unstyled.
  const root = el('div', { class: 'copalat', hidden: true })
  styles.addEventListener('load', () => (root.hidden = false))
  shadow.append(styles, root)

  const logo = () => el('img', { class: 'logo', src: chrome.runtime.getURL('logo.png'), alt: '' })

  // Collapsed, the widget is a small pill that stays out of the way of the form.
  const launcher = (account) =>
    el(
      'button',
      { type: 'button', class: entering ? 'launcher enter' : 'launcher', title: 'Open Copalat', 'aria-expanded': 'false', onclick: toggle },
      logo(),
      el('span', { text: 'Copalat' }),
      account && usagePill(account),
    )

  const panel = (account) =>
    el(
      'div',
      { class: entering ? 'widget enter' : 'widget' },
      el(
        'div',
        { class: 'widget-header row' },
        logo(),
        el('div', { class: 'title grow', text: 'Copalat' }),
        account && usagePill(account),
        el(
          'button',
          { type: 'button', class: 'icon-btn', title: 'Minimize', 'aria-expanded': 'true', onclick: toggle },
          icon('minus', 16),
        ),
      ),
      el('div', { class: 'progress', hidden: !state.loading }),
      el(
        'div',
        { class: 'widget-body stack' },
        alertBox('error', state.error),
        alertBox('success', state.notice),
        bodyView(),
      ),
    )

  function render() {
    const account = state.app?.account
    // Re-rendering must not throw the user back to the top of a long proposal.
    const scrolled = root.querySelector('.widget-body')?.scrollTop || 0
    root.replaceChildren(state.expanded ? panel(account) : launcher(account))
    const body = root.querySelector('.widget-body')
    if (body) body.scrollTop = scrolled
    entering = false
  }

  document.body.append(host)
  document.querySelector('.up-truncation-label')?.click()
  render()
  run(loadState)

  // Coming back from the Stripe tab or the popup: the plan or sign in may have changed.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !state.loading) loadState().then(render, () => {})
  })
})()
