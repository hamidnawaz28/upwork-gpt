import { doc, getDoc, setDoc } from 'firebase/firestore'
import db from './firestore'
const addADoc = async (collection: string, data: any) => {
  const docId = Date.now().toString()
  await setDoc(doc(db, collection, docId), data)
  return docId
}

const editADoc = async (collection: string, documentId: string, data: any) => {
  await setDoc(doc(db, collection, documentId), data)
}

const getADoc = async (collection: string, documentId: string) => {
  const docSnap = await getDoc(doc(db, collection, documentId))
  if (docSnap.exists()) {
    return { success: true, data: docSnap.data() }
  } else {
    return { success: false, data: {} }
  }
}
export { addADoc, editADoc, getADoc }
