
export const getProfileUserName = () => {
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

const windowRef = window as any

// https://www.upwork.com/freelancers/*
export const userDataFromFreelancers = () => windowRef?.__NUXT__?.state
