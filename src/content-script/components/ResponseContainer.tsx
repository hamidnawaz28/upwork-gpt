import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import Collapse from '@mui/material/Collapse'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import { useEffect, useId, useState } from 'react'
import Browser from 'webextension-polyfill'
import { BACKGROUND_SERVICE_WORKER } from '../../common/messaging'
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
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState([])
  const handleExpandClick = () => {
    setExpanded(!expanded)
  }
  const id = useId()
  const copyHandle = () => {
    navigator.clipboard.writeText(data.join('\n'))
  }
  useEffect(() => {
    Browser.runtime.onMessage.addListener(async function (message: any) {
      const { action, data, tabId } = message
      if (action == BACKGROUND_SERVICE_WORKER.SEND_GPT_RESPONSE) {
        let text = data.gptResponse
        text = text.split('\n')
        setData(text)
        setLoading(false)
        setExpanded(true)
      }
    })
  }, [])

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
                alignItems: 'baseline',
                width: '100%',
              }}
            >
              <GptIcon />

              {loading ? (
                <Typography variant="body2" gutterBottom>
                  Getting Response...
                </Typography>
              ) : (
                <ExpandMore
                  expand={expanded}
                  onClick={handleExpandClick}
                  aria-expanded={expanded}
                  aria-label="show more"
                >
                  <ExpandMoreIcon />
                </ExpandMore>
              )}
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
                  GPT Response
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

              {data.map((el) => {
                return (
                  <Typography paragraph key={id}>
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
