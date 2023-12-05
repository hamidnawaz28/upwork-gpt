import Browser from 'webextension-polyfill'
import { BACKGROUND_SERVICE_WORKER, CONTENT_SCRIPT } from '../common/messaging'

Browser.runtime.onMessage.addListener(async (request, data) => {
  const { action, jobDetails } = request
  const { tab } = data
  const tabId = tab?.id || 0
  const { skillBadge, jobDescription, jobTags, gptModelVersion, secretKey, template } = jobDetails

  let finalTemplate = ''
  finalTemplate = finalTemplate.concat(
    template?.basic?.replace('${jobDescription}', jobDescription),
  )
  const allJobTags = jobTags.join(', ')
  if (allJobTags.length > 0)
    finalTemplate = finalTemplate.concat(template?.allJobTags?.replace('${allJobTags}', allJobTags))
  if (skillBadge)
    finalTemplate = finalTemplate.concat(template?.skillBadge?.replace('${skillBadge}', skillBadge))

  if (action === CONTENT_SCRIPT.GENERATE_BID) {
    const payload = JSON.stringify({
      model: gptModelVersion,
      messages: [
        {
          role: 'user',
          content: finalTemplate,
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
