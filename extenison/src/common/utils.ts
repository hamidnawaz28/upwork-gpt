import Browser from "webextension-polyfill"
import { BACKGROUND_SERVICE_WORKER, CONTENT_SCRIPT } from "./messaging"

function asyncSleep(sec: any) {
  return new Promise((resolve) => setTimeout(resolve, sec * 1000))
}

const clickButton = (selector: string) => {
  const buttonRef = document?.querySelector(selector) as HTMLElement
  if (buttonRef) buttonRef?.click()
}

const prepareUserData = async () => {
  const selectors = await Browser.runtime.sendMessage({
    action: CONTENT_SCRIPT.GET_SELECTORS,
  })

  clickButton(selectors.moreDescription)

  await asyncSleep(2)

  const jobTitle = document?.querySelector(selectors.title) as HTMLElement
  const skillBadge = document?.querySelector(selectors.skillBadge) as HTMLElement
  const description = document?.querySelector(selectors.description) as HTMLElement
  const jobTags = Array.from(document?.querySelectorAll(selectors.allTags))?.map(
    (el: any) => el?.innerText
  )

  const freelancerRef = Array.from(document.querySelectorAll(selectors.freelancerRef))
  let freelancer = freelancerRef?.find((el: any) => el?.innerText.includes(`Profile`))?.getAttribute('href') ?? ""

  return {
    jobUrl: window.location.pathname,
    freelancer,
    jobTitle: jobTitle?.innerText || '',
    jobDescription: description?.innerText || '',
    skillBadge: skillBadge?.innerText || '',
    jobTags: jobTags || [],
    country: ""
  }
}

const subscribeOpenAiResponseListner = async (callBack: any) => Browser.runtime.onMessage.addListener(async function (message: any) {
  const { action, data } = message
  if (action == BACKGROUND_SERVICE_WORKER.GET_OPENAI_RESPONSE) callBack(data)
})

export {
  subscribeOpenAiResponseListner,
  asyncSleep,
  clickButton,
  prepareUserData
}
