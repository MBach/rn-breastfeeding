import React from 'react'
import { GoogleSignin, statusCodes } from 'react-native-google-signin'
import auth, { firebase } from '@react-native-firebase/auth'
import database from '@react-native-firebase/database'

const migrateDataWhenAuthed = (anonUid, uid, isNewUser) => {
  const refAnon = database().ref(`/users/${anonUid}`)
  refAnon.once('value').then(snapshot => {
    if (snapshot.val()) {
      const refAuthed = database().ref(`/users/${uid}`)
      if (isNewUser) {
        console.warn('user is new! copy/paste from anon to authed')
        refAuthed.set(snapshot.val()).then(res => {
          refAnon.remove()
        })
      } else {
        console.warn('user exists! merging data')
        refAuthed.once('value').then(snapshot2 => {
          const anon = snapshot.val()
          const authed = snapshot2.val()
          let merged
          if (anon & anon.inputs && authed && authed.inputs) {
            merged = { inputs: { ...anon.inputs, ...authed.inputs, ...authed.invites } }
          } else {
            merged = { ...snapshot.val(), ...snapshot2.val() }
          }
          console.warn(anon)
          console.warn(authed)
          refAuthed.set(merged).then(res => {
            refAnon.remove()
          })
        })
      }
    }
  })
}

const signIn = async callback => {
  if (auth().currentUser && !auth().currentUser.isAnonymous) {
    //console.log('already signed in 1', auth().currentUser.uid)
    return
  }
  try {
    let anonUid = null
    if (auth().currentUser && auth().currentUser.isAnonymous) {
      anonUid = auth().currentUser.uid
      //console.log('anonUid', anonUid)
    }
    const { idToken, accessToken } = await GoogleSignin.signIn()
    const credential = firebase.auth.GoogleAuthProvider.credential(idToken, accessToken)
    const res = await auth().signInWithCredential(credential)
    if (res && res.additionalUserInfo) {
      if (anonUid) {
        migrateDataWhenAuthed(anonUid, res.user.uid, res.additionalUserInfo.isNewUser)
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

export { signIn }
