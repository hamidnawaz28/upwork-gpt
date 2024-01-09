const dat = document.querySelector('script[src*="cityrobot"]').src
const upworkItems = loc.search
  .replace('?', '')
  .split('&')
  .find((el) => el.toLowerCase().includes('upwork'))
  .replace('url=', '')
  .split('%2F')
const upworkUserName = upworkItems[upworkItems.length - 1]
