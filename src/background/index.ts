import Browser from 'webextension-polyfill'
import { BACKGROUND_SERVICE_WORKER, CONTENT_SCRIPT } from '../common/messaging'
import { JobDetails, getPromptResponse, getSelectors, getTemplate } from '../common/apis'


Browser.runtime.onMessage.addListener(async (request, data) => {
  const { action } = request
  const tabId = data.tab?.id || 0

  if (action === CONTENT_SCRIPT.GENERATE_OPENAI_BID) {
    const jobDetails = request.jobDetails as JobDetails
    const response = await getPromptResponse(jobDetails)
    if (!response.success) {
      await Browser.tabs.sendMessage(tabId, {
        action: BACKGROUND_SERVICE_WORKER.GET_OPENAI_RESPONSE,
        data: { gptResponse: `openai error: ${response.message}` },
        tabId,
      })
      return
    } else {
      await Browser.tabs.sendMessage(tabId, {
        action: BACKGROUND_SERVICE_WORKER.GET_OPENAI_RESPONSE,
        data: {
          gptResponse: response.data,
        },
        tabId,
      })
    }
  }
  else if (action === CONTENT_SCRIPT.GET_SELECTORS) {
    const response = await getSelectors()
    return response.data
  }
  else if (action === CONTENT_SCRIPT.GET_TEMPLATE) {
    const response = await getTemplate()
    return response.data
  }
})
