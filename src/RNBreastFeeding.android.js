import { NativeModules } from 'react-native'
const { RNBreastFeedingModule } = NativeModules

const RNBreastFeeding = {
  addTime: RNBreastFeedingModule.addTime,
  changeTo: RNBreastFeedingModule.changeTo,
  deleteTimer: RNBreastFeedingModule.deleteTimer,
  pauseTimer: RNBreastFeedingModule.pauseTimer,
  resumeTimer: RNBreastFeedingModule.resumeTimer,
  startTimer: RNBreastFeedingModule.startTimer
}

export default RNBreastFeeding
