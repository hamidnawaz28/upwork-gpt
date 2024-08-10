

import {
    Button
} from '@mui/material'

export const RssButton = () => {
    const subscribeRssHandle = () => { }
    return <div>
        <Button
            variant="contained"
            sx={{
                fontSize: '0.8rem',
                color: 'white',
                backgroundColor: '#1565c0',
                px: 1
            }}
            onClick={subscribeRssHandle}
        >
            Subscribe WA Alerts
        </Button>
    </div>
}

