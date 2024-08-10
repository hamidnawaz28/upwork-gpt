import { getApp, getApps, initializeApp } from 'firebase/app'
import { firebaseConfig } from '../common/constant'
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

export default app
