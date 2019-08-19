import React from 'react'
import { GoogleSignin, statusCodes } from 'react-native-google-signin'
import auth, { firebase } from '@react-native-firebase/auth'

const migrateFromAnonToAuthed = (anonUid, res) => {
  console.warn('migrateFromAnonToAuthed', anonUid, res)
}

const signIn = async callback => {
  if (auth().currentUser && !auth().currentUser.isAnonymous) {
    console.warn('already signed in 1', auth().currentUser.uid)
    return
  }
  try {
    let anonUid = null
    if (auth().currentUser && auth().currentUser.isAnonymous) {
      anonUid = auth().currentUser.uid
      console.warn('anonUid', anonUid)
    }
    const { idToken, accessToken } = await GoogleSignin.signIn()
    const credential = firebase.auth.GoogleAuthProvider.credential(idToken, accessToken)
    const res = await auth().signInWithCredential(credential)
    if (res && res.additionalUserInfo) {
      if (anonUid) {
        migrateFromAnonToAuthed(anonUid, res)
      }
      if (callback) {
        callback(res.additionalUserInfo.profile.name)
      }
    }
  } catch (error) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      console.log('statusCodes.SIGN_IN_CANCELLED')
    } else if (error.code === statusCodes.IN_PROGRESS) {
      console.log('statusCodes.IN_PROGRESS')
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      console.log('statusCodes.PLAY_SERVICES_NOT_AVAILABLE')
    } else {
      console.log(error)
    }
  }
}

export { signIn, migrateFromAnonToAuthed }
