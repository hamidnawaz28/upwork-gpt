
import { getRequest } from "../../common/apis"
const getProfileUserName = () => {
    const profileUserRef = document?.querySelector('script[src*="cityrobot"]') as HTMLElement
    const profileUrl = profileUserRef?.getAttribute('src') ?? ''
    const upworkItems = profileUrl
        ?.replace('?', '')
        ?.split('&')
        ?.find((el) => el.toLowerCase().includes('www.upwork.com'))
        ?.replace('url=', '')
        ?.split('%2F') ?? []
    return upworkItems[upworkItems.length - 1]
}

const getClientInfo = async () => await getRequest("https://geolocation-db.com/jsonp/")

// TODO: add real logic
const isLogedIn = () => false

export {
    getClientInfo,
    getProfileUserName,
    isLogedIn
}
