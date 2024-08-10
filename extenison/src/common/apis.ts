

export interface JobDetails {
    skillBadge: string,
    jobDescription: string,
    jobTags: string[],
    gptModelVersion: string,
    freelancer: string,
    jobUrl: string
    country: string
}
interface ResponseTemplate {
    success: boolean
    message: string
    data: any
}

export const getRequest = async (url: string) => {
    return await fetch(url).then(response => response.json())
}

const postRequest = async <T>(url: string, body: T) => {
    return await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": 'application/json',
        },
        body: JSON.stringify(body),
    }).then(response => response.json())
}

const getUrl = (endpoint: string) => `https://us-central1-upwork-extension-9ce91.cloudfunctions.net/${endpoint}`

const getPromptResponse = async (jobDetails: JobDetails): Promise<ResponseTemplate> => await postRequest(getUrl("getPromptResponse"), jobDetails)
const getSelectors = async (): Promise<ResponseTemplate> => await getRequest(getUrl("getSelectors"))
const getTemplate = async (): Promise<ResponseTemplate> => await getRequest(getUrl("getTemplate"))

export {
    getPromptResponse,
    getSelectors,
    getTemplate
}
