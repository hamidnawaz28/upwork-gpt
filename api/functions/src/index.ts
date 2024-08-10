import { onRequest } from "firebase-functions/v2/https";
import { addADoc, getADoc } from "./firebase";
import { Request } from "firebase-functions/v1";
import { REQUEST_STATUS } from "./common/constant";

interface JobDetails {
    skillBadge: string,
    jobDescription: string,
    jobTags: string[],
    freelancer: string,
    jobUrl: string
    country: string
}

interface GptTemplate {
    basic: string,
    allJobTags: string
    skillBadge: string
}

interface UpworkGptConfig {
    model: string,
    secretKey: string,
    template: GptTemplate
    selectors: Record<string, string>,
}

const addJobLogs = (jobDetails: JobDetails) => addADoc('tafsil', {
    freelancer: jobDetails.freelancer,
    details: jobDetails.jobUrl,
    country: jobDetails.country,
})


const preparePrompt = (template: GptTemplate, jobDetails: JobDetails): string => {
    const { skillBadge, jobDescription, jobTags } = jobDetails
    let finalTemplate = ''
    finalTemplate = finalTemplate.concat(
        template?.basic?.replace('${jobDescription}', jobDescription),
    )
    const allJobTags = jobTags.join(', ')
    if (allJobTags.length > 0)
        finalTemplate = finalTemplate.concat(template?.allJobTags?.replace('${allJobTags}', allJobTags))

    if (skillBadge)
        finalTemplate = finalTemplate.concat(template?.skillBadge?.replace('${skillBadge}', skillBadge))
    return finalTemplate
}

interface OpenAiPayload {
    secretKey: string,
    openAiModelVersion: string,
    prompt: string
}

const getOpenAiResponse = async ({
    secretKey,
    openAiModelVersion,
    prompt
}: OpenAiPayload): Promise<string> => {

    const payload = JSON.stringify({
        model: openAiModelVersion,
        messages: [
            {
                role: 'user',
                content: prompt,
            },
        ],
    })

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secretKey}`
    }

    const config = {
        method: 'POST',
        headers,
        body: payload,
    }

    let response: any = await fetch('https://api.openai.com/v1/chat/completions', config)
    response = await response.json()
    return response?.choices?.[0]?.message?.content ?? ''
}

const getGptResponse = async (jobDetails: JobDetails): Promise<string> => {
    addJobLogs(jobDetails)
    const upworkGptConfigs = await getADoc('api', 'openai')
    const { secretKey, model: openAiModelVersion, template } = upworkGptConfigs.data as UpworkGptConfig
    const prompt = preparePrompt(template, jobDetails)

    return getOpenAiResponse({ secretKey, prompt, openAiModelVersion })
}

// const isAuthorizeRequest = (request: Request): boolean => {
//     const extensionId = 'jpoggeemkldhnnglnmngalgjicmdfjin'
//     const origin = request.headers.origin
//     return origin?.includes(extensionId) ?? false
// }

const isAuthorizeRequest = (request: Request): boolean => {
    return true
}

exports.getPromptResponse = onRequest(async (request, response) => {
    const notAuthorized = !isAuthorizeRequest(request)
    if (notAuthorized) response.status(REQUEST_STATUS.INVALID_REQUEST).send({ success: false, data: {}, message: 'invalid Request' });
    const payload: JobDetails = request.body
    const gptResponse = await getGptResponse(payload)
    response.status(REQUEST_STATUS.SUCCESS).send({ success: true, message: '', data: gptResponse });
});

exports.getSelectors = onRequest(async (request, response) => {
    const notAuthorized = !isAuthorizeRequest(request)
    if (notAuthorized) response.status(REQUEST_STATUS.INVALID_REQUEST).send({ success: false, data: {}, message: 'invalid Request' });
    const upworkGptConfigs = await getADoc('api', 'openai')
    const { selectors } = upworkGptConfigs.data as UpworkGptConfig
    response.status(REQUEST_STATUS.SUCCESS).send({ success: true, message: '', data: selectors });
});

exports.getTemplate = onRequest(async (request, response) => {
    const notAuthorized = !isAuthorizeRequest(request)
    if (notAuthorized) response.status(REQUEST_STATUS.INVALID_REQUEST).send({ success: false, data: {}, message: 'invalid Request' });
    const upworkGptConfigs = await getADoc('api', 'openai')
    const { template } = upworkGptConfigs.data
    response.status(REQUEST_STATUS.SUCCESS).send({ success: true, message: '', data: template });
});
