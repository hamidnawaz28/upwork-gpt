const boundary = '-------314159265358979323846'
const contentType = `multipart/mixed; boundary="${boundary}"`

export const getAuthToken = async () => {
  return await chrome.identity.getAuthToken({ interactive: true })
}
