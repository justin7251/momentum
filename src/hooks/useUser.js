import { useState, useEffect } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

export function useUser(uid) {
  const [userData, setUserData] = useState(null)

  useEffect(() => {
    if (!uid) return
    const ref = doc(db, 'users', uid)
    return onSnapshot(ref, async snap => {
      if (!snap.exists()) {
        await setDoc(ref, { isPro: false, createdAt: new Date().toISOString() })
      } else {
        setUserData(snap.data())
      }
    })
  }, [uid])

  return userData
}