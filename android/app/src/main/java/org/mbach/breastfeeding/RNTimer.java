package org.mbach.breastfeeding;

import android.os.SystemClock;

import java.util.Timer;
import java.util.TimerTask;

public class RNTimer extends Timer {

    private class Chrono extends TimerTask {
        private long _start = SystemClock.elapsedRealtime();
        private long _pause = SystemClock.elapsedRealtime();
        private long _pauseDuration = 0;
        private boolean _isPaused = true;
        private long _duration = 0;
        private final String timerId;

        Chrono(String timerId) {
            this.timerId = timerId;
        }

        void pause() {
            if (!_isPaused) {
                _pause = SystemClock.elapsedRealtime();
                _isPaused = true;
                requestImmediateUpdate();
            }
        }

        void resume() {
            _pauseDuration += SystemClock.elapsedRealtime() - _pause;
            _isPaused = false;
            requestImmediateUpdate();
        }

        void requestImmediateUpdate() {
            if (RNBreastFeedingModule.INSTANCE != null) {
                updateDuration();
                RNBreastFeedingModule.INSTANCE.updateTimer(timerId, _duration, !_isPaused);
            }
        }

        boolean isPaused() {
            return _isPaused;
        }

        void add(long value) {
            long millis = SystemClock.elapsedRealtime() - _start - _pauseDuration + value;
            if (millis < 0) {
                _start = SystemClock.elapsedRealtime();
                _pause = 0;
                _pauseDuration = 0;
                _duration = 0;
            } else {
                _start -= value;
            }
            requestImmediateUpdate();
        }

        void changeTo(long value) {
            _start = SystemClock.elapsedRealtime() - value;
            requestImmediateUpdate();
        }

        private void updateDuration() {
            _duration = SystemClock.elapsedRealtime() - _start - _pauseDuration;
            double s = (double) _duration / 1000;
            _duration = Math.round(s) * 1000;
        }

        @Override
        public void run() {
            updateDuration();
            if (RNBreastFeedingModule.INSTANCE != null) {
                RNBreastFeedingModule.INSTANCE.updateTimer(timerId, _duration, !_isPaused);
            }
        }
    }

    private Chrono chrono;

    RNTimer(String timerId) {
        super(true);
        chrono = new Chrono(timerId);
        scheduleAtFixedRate(chrono, 0, 1000);
    }

    @Override
    public void cancel() {
        super.cancel();
        super.purge();
        chrono.cancel();
    }

    void pauseResumeTimer() {
        if (chrono.isPaused()) {
            chrono.resume();
        } else {
            chrono.pause();
        }
    }

    void pauseTimer() {
        chrono.pause();
    }

    void add(long value) {
        chrono.add(value);
    }

    void changeTo(long value) {
        chrono.changeTo(value);
    }

    boolean isRunning() {
        return !chrono.isPaused();
    }
}
