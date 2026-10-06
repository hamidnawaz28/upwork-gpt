// Small DOM helpers and views shared by the popup and the widget on the Upwork page.
// Loaded as a classic script in both places (content scripts cannot be ES modules), so
// everything hangs off one global.
/* exported Copalat */
const Copalat = (() => {
  // el('button', { class: 'btn', text: 'Save', onclick: save }, child, ...)
  // Text always goes in through textContent, never innerHTML.
  const el = (tag, props = {}, ...children) => {
    const node = document.createElement(tag)
    for (const [key, value] of Object.entries(props)) {
      if (value === undefined || value === null || value === false) continue
      if (key === 'class') node.className = value
      else if (key === 'text') node.textContent = value
      else if (key.startsWith('on')) node.addEventListener(key.slice(2), value)
      else if (key in node) node[key] = value
      else node.setAttribute(key, value)
    }
    node.append(...children.flat(Infinity).filter((child) => child || child === 0))
    return node
  }

  // Stroke icons on a 24px grid.
  const ICONS = {
    sparkles:
      'M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z',
    check: 'M5 12.5l4.5 4.5L19 7.5',
    copy: 'M9 9h10v11H9V9zM5 15V4h10',
    insert: 'M12 4v11M7 10l5 5 5-5M5 20h14',
    refresh: 'M20 12a8 8 0 1 1-2.6-5.9M20 4v4h-4',
    close: 'M6 6l12 12M18 6L6 18',
    minus: 'M6 12h12',
    alert: 'M12 8v5M12 16.5v.1M10.3 4.2L3 17a2 2 0 0 0 1.7 3h14.600a2 2 0 0 0 1.700-3L13.700 4.200a2 2 0 0 0-3.400 0z',
    lock: 'M6.5 11V8a5.5 5.5 0 0 1 11 0v3M5 11h14v9H5v-9z',
    arrow: 'M5 12h14M13 6l6 6-6 6',
    user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20a7.5 7.5 0 0 1 15 0',
    history: 'M4 12a8 8 0 1 0 2.6-5.9M4 5v4h4M12 8v4.500l3 1.800',
  }

  const svgNode = (name, attrs) => {
    const node = document.createElementNS('http://www.w3.org/2000/svg', name)
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value)
    return node
  }

  const icon = (name, size = 16) => {
    const svg = svgNode('svg', {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 1.9,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'aria-hidden': 'true',
    })
    svg.append(svgNode('path', { d: ICONS[name] }))
    return svg
  }

  // Google's "G", for the sign-in button.
  const googleMark = () => {
    const svg = svgNode('svg', { width: 18, height: 18, viewBox: '0 0 48 48', 'aria-hidden': 'true' })
    const parts = [
      ['#EA4335', 'M24 9.5c3.5 0 6.6 1.2 9.100 3.600l6.800-6.800C35.800 2.400 30.300 0 24 0 14.600 0 6.500 5.400 2.600 13.200l7.900 6.100C12.400 13.600 17.700 9.500 24 9.500z'],
      ['#4285F4', 'M46.500 24.500c0-1.600-.1-3.100-.4-4.500H24v9h12.700c-.6 3-2.300 5.500-4.800 7.200l7.700 6c4.500-4.200 6.900-10.300 6.900-17.700z'],
      ['#FBBC05', 'M10.500 28.700c-.5-1.500-.8-3.100-.8-4.700s.3-3.200.8-4.700l-7.900-6.100C.9 16.500 0 20.100 0 24s.9 7.500 2.600 10.800l7.900-6.100z'],
      ['#34A853', 'M24 48c6.500 0 11.900-2.100 15.900-5.800l-7.700-6c-2.100 1.400-4.900 2.300-8.200 2.300-6.300 0-11.600-4.100-13.500-9.800l-7.900 6.100C6.500 42.600 14.600 48 24 48z'],
    ]
    for (const [fill, d] of parts) svg.append(svgNode('path', { fill, d }))
    return svg
  }

  // Asks the background service worker to do something and returns its data, or throws
  // with the server's message (plus `code` / `account` when the server sent them).
  const request = async (action, payload) => {
    const response = await chrome.runtime.sendMessage({ action, payload })
    if (!response?.ok) {
      const error = new Error(response?.error || 'Something went wrong. Please try again.')
      error.code = response?.code
      error.account = response?.account
      throw error
    }
    return response.data
  }

  const wordCount = (text) => text.trim().split(/\s+/).filter(Boolean).length

  const usageLabel = (account) =>
    account.active ? `${account.remaining} of ${account.limit} left` : `${account.remaining} of ${account.limit} free left`

  const usagePill = (account) =>
    el('span', { class: account.remaining > 0 ? 'pill' : 'pill pill-empty', text: usageLabel(account) })

  const alertBox = (kind, text) =>
    text &&
    el('div', { class: `alert ${kind}`, role: 'status' }, icon(kind === 'error' ? 'alert' : 'check', 15), el('span', { text }))

  const button = (kind, label, props = {}, iconName) =>
    el('button', { type: 'button', class: `btn ${kind}`, ...props }, iconName && icon(iconName, 15), el('span', { text: label }))

  // Usage as a headline number with a meter, for the popup.
  const usageCard = (account) => {
    const percent = Math.min((account.used / Math.max(account.limit, 1)) * 100, 100)
    const bar = el('span', { class: account.remaining > 0 ? '' : 'empty' })
    bar.style.width = `${percent}%`
    return el(
      'div',
      { class: 'usage' },
      el(
        'div',
        { class: 'usage-top' },
        el('div', {}, el('strong', { text: String(account.remaining) }), el('span', { text: ` of ${account.limit}` })),
        el('span', {
          class: 'muted',
          text: account.active ? 'proposals left this month' : 'free proposals left',
        }),
      ),
      el('div', { class: 'meter' }, bar),
    )
  }

  // Plans the user can move to, plus a link to the Stripe portal once they are a customer.
  const planCards = ({ account, plans, disabled, onChoose, onManage }) => {
    const renews = account.period_end && new Date(account.period_end).toLocaleDateString()
    const offered = plans.filter((plan) => !(account.active && plan.id === account.plan))
    return el(
      'div',
      { class: 'stack tight' },
      el(
        'div',
        { class: offered.length > 1 ? 'plans' : 'plans plans-one' },
        offered.map((plan, index) =>
          el(
            'button',
            {
              type: 'button',
              class: index === 0 ? 'plan plan-featured' : 'plan',
              disabled,
              onclick: () => onChoose(plan.id),
            },
            el('span', { class: 'plan-name', text: plan.name }),
            el(
              'span',
              { class: 'plan-price' },
              el('strong', { text: plan.price }),
              el('span', { text: '/mo' }),
            ),
            el('span', { class: 'plan-quota', text: `${plan.proposals} proposals a month` }),
            el('span', { class: 'plan-cta' }, el('span', { text: account.active ? 'Switch' : 'Choose' }), icon('arrow', 13)),
          ),
        ),
      ),
      account.active &&
        el('div', {
          class: 'muted',
          text: account.cancel_at_period_end ? `Your plan ends on ${renews}.` : `Your plan renews on ${renews}.`,
        }),
      el(
        'div',
        { class: 'row between' },
        el('span', { class: 'muted secure' }, icon('lock', 12), el('span', { text: 'Secure checkout by Stripe' })),
        account.has_customer &&
          el('button', { type: 'button', class: 'link', text: 'Manage subscription', onclick: onManage }),
      ),
    )
  }

  // A labelled set of choices where one is selected: 'chips' wraps, 'segments' is a bar.
  const choiceGroup = (label, kind, options, value, onChange) => {
    const buttons = options.map((option) =>
      el('button', {
        type: 'button',
        class: option.id === value ? 'on' : '',
        text: option.label,
        title: option.hint,
        'aria-pressed': String(option.id === value),
        onclick: () => {
          for (const other of buttons) {
            const selected = other === buttons[options.indexOf(option)]
            other.className = selected ? 'on' : ''
            other.setAttribute('aria-pressed', String(selected))
          }
          onChange(option.id)
        },
      }),
    )
    return el('div', { class: 'field' }, el('span', { class: 'label', text: label }), el('div', { class: kind }, buttons))
  }

  const copyButton = (text) => {
    const label = el('span', { text: 'Copy' })
    return el(
      'button',
      {
        type: 'button',
        class: 'btn ghost small',
        onclick: async () => {
          await navigator.clipboard.writeText(text)
          label.textContent = 'Copied'
          setTimeout(() => (label.textContent = 'Copy'), 1500)
        },
      },
      icon('copy', 13),
      label,
    )
  }

  // Placeholder lines shown while a proposal is being written.
  const skeleton = () =>
    el(
      'div',
      { class: 'skeleton', 'aria-label': 'Writing your proposal' },
      [92, 100, 96, 70, 0, 100, 88, 94, 55].map((width) => {
        const line = el('i', {})
        line.style.width = `${width}%`
        return line
      }),
    )

  return {
    el,
    icon,
    googleMark,
    request,
    wordCount,
    usageLabel,
    usagePill,
    usageCard,
    alertBox,
    button,
    planCards,
    choiceGroup,
    copyButton,
    skeleton,
  }
})()
