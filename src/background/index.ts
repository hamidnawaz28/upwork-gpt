import Browser from 'webextension-polyfill'
import { BACKGROUND_SERVICE_WORKER, CONTENT_SCRIPT } from '../common/messaging'
import { getADoc } from '../firebase'

Browser.runtime.onMessage.addListener(async (request, data) => {
  const { action, jobDetails } = request
  const { tab } = data
  const tabId = tab?.id || 0
  const { skillBadge, jobDescription, jobTags } = jobDetails
  const response = await getADoc('api', 'openai')

  // When unable to get the access key, throw an error on frontend
  if (!response.success) {
    await Browser.tabs.sendMessage(tabId, {
      action: BACKGROUND_SERVICE_WORKER.SEND_GPT_RESPONSE,
      data: { gptResponse: 'Unable to get the config' },
      tabId,
    })
    return
  }
  const { secretKey, model } = response.data
  if (action === CONTENT_SCRIPT.GENERATE_BID) {
    const payload = JSON.stringify({
      model: model,
      messages: [
        {
          role: 'user',
          content: `
      generate bid for the project where,
      specialization area is : ${skillBadge}, 
      skills required : ${jobTags.join(' ')} and
      job description: ${jobDescription}
      `,
        },
      ],
    })
    const myHeaders = new Headers()
    myHeaders.append('Content-Type', 'application/json')
    myHeaders.append('Authorization', `Bearer ${secretKey}`)

    const config = {
      method: 'POST',
      headers: myHeaders,
      body: payload,
    }
    let response: any = await fetch('https://api.openai.com/v1/chat/completions', config)
    response = await response.json()

    // Where is error from openai throw it to the front
    if (response.error) {
      await Browser.tabs.sendMessage(tabId, {
        action: BACKGROUND_SERVICE_WORKER.SEND_GPT_RESPONSE,
        data: { gptResponse: `openai error: ${response.error.code}` },
        tabId,
      })
      return
    } else {
      const data = {
        gptResponse: `${response?.choices?.[0]?.message?.content}` || '',
      }

      await Browser.tabs.sendMessage(tabId, {
        action: BACKGROUND_SERVICE_WORKER.SEND_GPT_RESPONSE,
        data,
        tabId,
      })
      return
    }
  }
})
