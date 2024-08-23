
const STORE_NAME = 'copalat'
import Browser from 'webextension-polyfill'
import { MESSAGES } from './messaging'

const syncRef = Browser.storage.sync
const localRef = Browser.storage.local

async function setSyncStorage(data: any) {
    await syncRef.set({ [STORE_NAME]: data })
}

async function getSyncStorage() {
    const data = await syncRef.get()
    return data[STORE_NAME]
}

async function setLocalStorage(data: any) {
    await localRef.set({ [STORE_NAME]: data })
}

async function getLocalStorage() {
    const data = await localRef.get()
    return data[STORE_NAME]
}



// used to send message from popup and options popup to content script and background script
async function tabMesage(data: any) {
    const tabsData: any = await Browser.tabs.query({ active: true })
    return await Browser.tabs.sendMessage(tabsData[0].id, { ...data })
}

// send message for any other scenerio except the above one
async function runTimeMessage(data: any) {
    return await Browser.runtime.sendMessage(data)
}

async function updateCurrentPageUrl(url: string) {
    if (!url) return
    const tabsData: any = await Browser.tabs.query({ active: true })
    Browser.tabs.update(tabsData[0].id, { url: url })
}

async function updateActiveTabUrl(url: string) {
    const tabsData: any = await Browser.tabs.query({
        active: true,
    })

    await Browser.tabs.update(tabsData[0]?.id, { url })
    await waitTillTabLoads(tabsData[0]?.id)
}

async function activeTabProps() {
    const tabsData: any = await Browser.tabs.query({
        active: true,
    })
    return await tabsData[0]
}

async function waitForActiveTabLoads() {
    const tabsData: any = await Browser.tabs.query({
        active: true,
    })
    return await waitTillTabLoads(tabsData[0]?.id)
}

async function waitForActiveTabLoadsRunTime() {
    await runTimeMessage({
        message: MESSAGES.WAIT_FOR_ACTIVE_TAB_LOADS,
    })
}

async function waitTillTabLoads(tabId: number) {
    await asyncSleep(0.5)
    const tab = await Browser.tabs.get(tabId)

    if (tab.status == 'loading') {
        await waitTillTabLoads(tabId)
    } else return tabId
}

function asyncSleep(sec: any) {
    return new Promise((resolve) => setTimeout(resolve, sec * 1000))
}




const updateData = async (data: Record<string, unknown>) => {
    const localData = await getLocalStorage()

    const updatedData = {
        ...localData,
        ...data,
    }
    await setLocalStorage(updatedData)
}

export {
    updateData,
    setSyncStorage,
    getSyncStorage,
    setLocalStorage,
    getLocalStorage,
    tabMesage,
    runTimeMessage,
    updateCurrentPageUrl,
    updateActiveTabUrl,
    waitForActiveTabLoads,
    asyncSleep,
    activeTabProps,
    waitForActiveTabLoadsRunTime
}
