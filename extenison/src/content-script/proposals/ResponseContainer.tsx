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
import { useEffect, useState } from 'react'
import { CONTENT_SCRIPT } from '../../common/messaging'
import Browser from 'webextension-polyfill'
import { prepareUserData, subscribeOpenAiResponseListner } from '../../common/utils'
import { GptIcon } from '../../common/Icons'
import { ChildrenInterface } from '../../common/types'

function ResponseContainer() {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [haveResponse, setHaveResponse] = useState(false)
  const [data, setData] = useState([])

  const handleExpandClick = () => setExpanded(!expanded)

  const handleBidGeneration = async () => {
    setLoading(true)
    setHaveResponse(false)

    const userData = await prepareUserData()
    Browser.runtime.sendMessage({
      action: CONTENT_SCRIPT.GENERATE_OPENAI_BID,
      jobDetails: userData,
    })
  }


  const GetInfoToDisplay = () => {
    return <Box>
      {
        loading && !haveResponse ? <ResponseWaitView />
          : !loading && haveResponse ? <BidExpandView expanded={expanded} handleExpandClick={handleExpandClick} />
            : <GenerateBidButtonView handleBidGeneration={handleBidGeneration} />
      }
    </Box>
  }

  const subscribeOpenAiResponseListnerCallBack = async (data: any) => {
    let text = data.gptResponse
    text = text.split('\n')
    setData(text)
    setLoading(false)
    setExpanded(true)
    setHaveResponse(true)
  }

  useEffect(() => {
    subscribeOpenAiResponseListner(subscribeOpenAiResponseListnerCallBack)
  }, [])

  return (
    <MainWrap>
      <ActionWrapper>
        <ActionBarContainer>
          <GptIcon />
          <GetInfoToDisplay />
        </ActionBarContainer>
        <ProgressBarWrapper loading={loading} />
      </ActionWrapper>
      <CollapseWrapper expanded={expanded}  >
        <ContentWrapper>
          <ContentContainer data={data} />
        </ContentWrapper>
      </CollapseWrapper>
    </MainWrap>
  )
}


const ActionBarContainer = ({ children }: any) => {
  return <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between'
    }}
  >
    {children}
  </Box >
}


const ProgressBarWrapper = ({ loading }: any) => {
  return <Box>
    {
      loading && (
        <Box sx={{ width: '100%' }}>
          <LinearProgress color="success" />
        </Box>
      )
    }
  </Box>
}


const ResponseWaitView = () => {
  return <Typography variant="body2" gutterBottom>
    Getting Response...
  </Typography>
}

const BidExpandView = ({ expanded, handleExpandClick }: any) => {
  return <ExpandMore
    expand={expanded}
    onClick={handleExpandClick}
    aria-expanded={expanded}
    aria-label="show more"
    sx={{
      "&:hover": {
        cursor: 'pointer'
      }
    }}
  >
    <ExpandMoreIcon />
  </ExpandMore>
}


const GenerateBidButtonView = ({ handleBidGeneration }: any) => {
  return <Button
    variant="contained"
    sx={{
      fontSize: '0.7rem',
      color: 'white',
      backgroundColor: '#1565c0',
    }}
    onClick={handleBidGeneration}
  >
    Generate Bid
  </Button>
}


const ActionWrapper = ({ children }: ChildrenInterface) => {
  return <CardActions>
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
      }}
    >
      {children}
    </Box>
  </CardActions>
}


const ExpandMore = styled((props: any) => {
  const { expand, ...other } = props
  return <IconButton {...other} />
})
  (({ theme, expand }) => ({
    transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
    marginLeft: 'auto',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest,
    }),
  }))


const CollapseWrapper = ({ expanded, children }: any) => {
  return <Collapse in={expanded} timeout="auto" unmountOnExit>
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
      {children}
    </Box>
  </Collapse>
}


const MainWrap = ({ children }: ChildrenInterface) => {
  return <Box
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
      {children}
    </Card>
  </Box>
}


const ContentWrapper = ({ children }: ChildrenInterface) => {
  return <CardContent>
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        bgcolor: 'background.paper',
        borderRadius: 1,
      }}
    >
      {children}
    </Box>
  </CardContent>
}

const ContentContainer = ({ data }: any) => {
  return <>
    <FlexWrapper>
      <Typography
        color="text.secondary"
        variant="body1"
        gutterBottom
      >
        Recommended Cover Letter
      </Typography>
      <CopyIcon data={data} />
    </FlexWrapper>
    <ParagraphContainer data={data} />
  </>
}

const FlexWrapper = ({ children }: ChildrenInterface) => {
  return <Box sx={{
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'row',
  }}>{children}</Box>
}

const CopyIcon = ({ data }: any) => {
  const copyHandle = () => navigator.clipboard.writeText(data.join('\n'))
  return <ContentCopyIcon
    onClick={copyHandle}
    sx={{
      '&:hover': {
        cursor: 'pointer',
      },
    }}
  />
}


const ParagraphContainer = ({ data }: any) => {
  return <Box>
    {
      data.map((line: string, key: number) => {
        return (
          <Typography paragraph key={key}>
            {line}
          </Typography>
        )
      })
    }
  </Box>
}


export default ResponseContainer
