import Browser from 'webextension-polyfill'
import { BACKGROUND_SERVICE_WORKER, CONTENT_SCRIPT } from '../common/messaging'

Browser.runtime.onMessage.addListener(async (request, data) => {
  const { action, jobDetails } = request
  const { tab } = data
  const tabId = tab?.id || 0
  const { skillBadge, jobDescription, jobTags } = jobDetails
  if (action === CONTENT_SCRIPT.GENERATE_BID) {
    const payload = JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `
      generate bid for the project where,
      specialization areas : ${skillBadge}, 
      skills required : ${jobTags.join(' ')} and
      job description: ${jobDescription}
      `,
        },
      ],
    })
    const myHeaders = new Headers()
    myHeaders.append('Content-Type', 'application/json')
    myHeaders.append('Authorization', `Bearer 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`)

    const config = {
      method: 'POST',
      headers: myHeaders,
      body: payload,
    }
    let response: any = await fetch('https://api.openai.com/v1/chat/completions', config)
    response = await response.json()
    const data = {
      gptResponse: `${response?.choices?.[0]?.message?.content}` || '',
    }

    await Browser.tabs.sendMessage(tabId, {
      action: BACKGROUND_SERVICE_WORKER.SEND_GPT_RESPONSE,
      data,
      tabId,
    })
  }
})
