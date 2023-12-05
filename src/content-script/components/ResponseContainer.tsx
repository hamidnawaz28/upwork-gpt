import { ContentCopy as ContentCopyIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material'
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Collapse,
  IconButton,
  LinearProgress,
  Typography,
} from '@mui/material'
import { styled } from '@mui/material/styles'
import { useEffect, useId, useState } from 'react'
import { CONTENT_SCRIPT } from '../../common/messaging'

import Browser from 'webextension-polyfill'
import { BACKGROUND_SERVICE_WORKER } from '../../common/messaging'
import { asyncSleep } from '../../common/utils'
import { addADoc, getADoc } from '../../firebase'
import { GptIcon } from './Icons'
const ExpandMore = styled((props: any) => {
  const { expand, ...other } = props
  return <IconButton {...other} />
})(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}))

function ResponseContainer() {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [haveResponse, setHaveResponse] = useState(false)

  const [data, setData] = useState([])
  const handleExpandClick = () => {
    setExpanded(!expanded)
  }
  const id = useId()
  const copyHandle = () => {
    navigator.clipboard.writeText(data.join('\n'))
  }
  const generateBidHandle = async () => {
    setLoading(true)
    setHaveResponse(false)
    const response = await getADoc('api', 'openai')
    const { secretKey, model, template, selectors } = response.data

    const moreButtonRef = document?.querySelector(selectors.moreDescription) as HTMLElement
    if (moreButtonRef) moreButtonRef?.click()
    await asyncSleep(2)

    const jobTitle = document?.querySelector(selectors.title) as HTMLElement
    const skillBadge = document?.querySelector(selectors.skillBadge) as HTMLElement
    const description = document?.querySelector(selectors.description) as HTMLElement
    const jobTags = Array.from(document?.querySelectorAll(selectors.allTags)).map(
      (el: any) => el.innerText,
    )

    const freelancerRef = Array.from(document.querySelectorAll(selectors.freelancerRef))
    let freelancer = ''
    if (freelancerRef.length) {
      freelancer =
        freelancerRef.find((el: any) => el.innerText.includes(`Profile`))?.getAttribute('href') ||
        ''
    }

    const details = {
      jobUrl: window.location.pathname,
      freelancer,
      jobTitle: jobTitle?.innerText || '',
      jobDescription: description?.innerText || '',
      skillBadge: skillBadge?.innerText || '',
      jobTags: jobTags || [],
      secretKey,
      gptModelVersion: model,
      template,
    }

    addADoc('tafsil', {
      freelancer: details.freelancer,
      details: details.jobUrl,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    })
    Browser.runtime.sendMessage({
      action: CONTENT_SCRIPT.GENERATE_BID,
      jobDetails: details,
    })
  }
  const attachResponseLister = async () => {
    Browser.runtime.onMessage.addListener(async function (message: any) {
      const { action, data, tabId } = message
      if (action == BACKGROUND_SERVICE_WORKER.SEND_GPT_RESPONSE) {
        let text = data.gptResponse
        text = text.split('\n')
        setData(text)
        setLoading(false)
        setExpanded(true)
        setHaveResponse(true)
      }
    })
  }
  useEffect(() => {
    attachResponseLister()
  }, [])

  const getInfoToDisplay = () => {
    if (loading && !haveResponse) {
      return (
        <Typography variant="body2" gutterBottom>
          Getting Response...
        </Typography>
      )
    } else if (!loading && haveResponse) {
      return (
        <ExpandMore
          expand={expanded}
          onClick={handleExpandClick}
          aria-expanded={expanded}
          aria-label="show more"
        >
          <ExpandMoreIcon />
        </ExpandMore>
      )
    } else {
      return (
        <Button
          variant="contained"
          sx={{
            fontSize: '0.7rem',
            color: 'white',
            backgroundColor: '#1565c0',
          }}
          onClick={generateBidHandle}
        >
          Generate Bid
        </Button>
      )
    }
  }
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        right: 0,
        zIndex: 100,
        p: 1,
        m: 1,
      }}
    >
      <Card sx={{ maxWidth: 600, minWidth: 250 }}>
        <CardActions>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              <GptIcon />
              {getInfoToDisplay()}
            </Box>
            <Box>
              {loading && (
                <Box sx={{ width: '100%' }}>
                  <LinearProgress color="success" />
                </Box>
              )}
            </Box>
          </Box>
        </CardActions>
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box
            component="div"
            mb={2}
            display="flex"
            flexDirection="column"
            maxHeight={'70vh'}
            sx={{
              overflow: 'hidden',
              overflowY: 'scroll',
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                }}
              >
                <Typography color="text.secondary" variant="body1" gutterBottom>
                  Recommended Cover Letter
                </Typography>

                <ContentCopyIcon
                  onClick={copyHandle}
                  sx={{
                    '&:hover': {
                      cursor: 'pointer',
                    },
                  }}
                />
              </Box>

              {data.map((el, key) => {
                return (
                  <Typography paragraph key={`${id}${key}`}>
                    {el}
                  </Typography>
                )
              })}
            </CardContent>
          </Box>
        </Collapse>
      </Card>
    </Box>
  )
}

export default ResponseContainer
