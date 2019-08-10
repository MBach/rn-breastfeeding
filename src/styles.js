import { DarkTheme, DefaultTheme } from 'react-native-paper'

const lightPalette = {
  primaryColor: '#c51162',
  primaryLight: '#fd558f',
  primaryDarkColor: '#8e0038',
  primaryTextColor: '#ffffff',
  secondaryColor: '#546e7a',
  secondaryLight: '#819ca9',
  secondaryDarkColor: '#29434e',
  secondaryTextColor: '#ffffff',
  rippleColor: 'rgba(142, 0, 56, .32)',
  separator: '#cccccc',
  headerTextColor: '#ffffff',
  sectionTextColor: '#717171',
  buttonColor: '#c51162'
}

const darkPalette = {
  primaryColor: '#880e4f',
  primaryLight: '#bc477b',
  primaryDarkColor: '#560027',
  secondaryColor: '#546e7a',
  secondaryLight: '#819ca9',
  secondaryDarkColor: '#29434e',
  secondaryTextColor: '#ffffff',
  rippleColor: 'rgba(142, 0, 56, .32)',
  separator: '#444444',
  headerTextColor: '#dddddd',
  sectionTextColor: '#9B9B9B',
  buttonColor: '#c51162'
}

export const lightTheme = {
  ...DefaultTheme,
  roundness: 2,
  colors: {
    ...DefaultTheme.colors,
    primary: lightPalette.primaryColor,
    secondary: lightPalette.secondaryColor,
    accent: lightPalette.primaryColor,
    primaryDarkColor: lightPalette.primaryDarkColor
  },
  palette: lightPalette
}

export const darkTheme = {
  ...DarkTheme,
  roundness: 2,
  colors: {
    ...DarkTheme.colors,
    primary: darkPalette.primaryColor,
    secondary: darkPalette.secondaryColor,
    accent: darkPalette.primaryColor,
    primaryDarkColor: darkPalette.primaryDarkColor
  },
  palette: darkPalette
}
