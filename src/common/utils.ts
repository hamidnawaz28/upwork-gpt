import Browser from 'webextension-polyfill'

const alterPageData = async (tabId: number | undefined, newData: any) => {
  const chromeStorage = await Browser.storage.sync.get()
  let autoRefreshData = chromeStorage?.autoRefreshData || []
  autoRefreshData = autoRefreshData.map((data: any) => {
    if (data.tabId == tabId) {
      return {
        ...data,
        ...newData,
      }
    }
    return data
  })

  const pageData = {
    autoRefreshData,
  }
  await Browser.storage.sync.set(pageData)
}
export function asyncSleep(sec: any) {
  return new Promise((resolve) => setTimeout(resolve, sec * 1000))
}

const getPageData = async (tabId: number | undefined) => {
  const data = await Browser.storage.sync.get()
  const autoRefreshData = data?.autoRefreshData || []
  return autoRefreshData.find((data: any) => data.tabId == tabId)
}

const updateTabsStorage = async (tabId: number | undefined, add = true) => {
  const refreshData = {
    tabId: tabId,
    running: false,
    intervalValue: 10,
    intervalObject: null,
    timeRef: null,
  }
  const prevData = await Browser.storage.sync.get()
  const prevPagesData = prevData?.autoRefreshData || []
  let pageData: any = {}
  if (add) {
    pageData = {
      autoRefreshData: [...prevPagesData, { ...refreshData }],
    }
  } else {
    const filteredData = prevPagesData.filter((data: any) => data.tabId != tabId)
    pageData = {
      autoRefreshData: [...filteredData],
    }
  }
  await Browser.storage.sync.set(pageData)
}
export { alterPageData, getPageData, updateTabsStorage }
