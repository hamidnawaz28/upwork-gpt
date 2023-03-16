// await Browser.storage.local.get('hideShortcutsTip')
// Browser.storage.local.set({ hideShortcutsTip: true })
// Browser.runtime.sendMessage({ type: 'OPEN_OPTIONS_PAGE' })
// Browser.tabs.create({ url: 'chrome://extensions/shortcuts' })

// Runs on extension installation
// Browser.runtime.onInstalled.addListener((details) => {
//   if (details.reason === 'install') {
//     Browser.runtime.openOptionsPage()
//   }
// })

// Find when it runs
// Browser.runtime.onConnect.addListener((port) => {
//   port.onMessage.addListener(async (msg) => {
//     port.postMessage({ error: err.message })
//   })
// })
