package org.mbach.breastfeeding;

import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.os.SystemClock;
import android.util.Log;

import java.util.Timer;
import java.util.TimerTask;

/**
 * @author Matthieu BACHELIER
 * @version 1.0
 * @since 2019-02
 */
public class ChronoService extends Service {

    private static final String TAG = "BFChronoService";

    private class Chrono extends TimerTask {
        private long _start = SystemClock.elapsedRealtime();
        private long _pause = 0;
        private long _pauseDuration = 0;
        private boolean _isPaused = false;
        private long _duration = 0;

        synchronized void pause() {
            _pause = SystemClock.elapsedRealtime();
            _isPaused = true;
        }

        synchronized void resume() {
            _pauseDuration += SystemClock.elapsedRealtime() - _pause;
            _isPaused = false;
        }

        synchronized void add(long value) {
            long millis = SystemClock.elapsedRealtime() - _start - _pauseDuration + value;
            if (millis < 0) {
                _start = SystemClock.elapsedRealtime();
                _pause = 0;
                _pauseDuration = 0;
                _duration = 0;
            } else {
                _start -= value;
            }
            // Request immediate update
            if (RNBreastFeedingModule.INSTANCE != null) {
                updateDuration();
                RNBreastFeedingModule.INSTANCE.updateTimer(_duration, !_isPaused);
            }
        }

        synchronized void changeTo(long value) {
            _start = SystemClock.elapsedRealtime() - value;
            // Request immediate update
            if (RNBreastFeedingModule.INSTANCE != null) {
                updateDuration();
                RNBreastFeedingModule.INSTANCE.updateTimer(_duration, !_isPaused);
            }
        }

        synchronized private void updateDuration() {
            _duration = SystemClock.elapsedRealtime() - _start - _pauseDuration;
            double s = (double) _duration / 1000;
            _duration = Math.round(s) * 1000;
        }

        @Override
        public void run() {
            updateDuration();
            if (RNBreastFeedingModule.INSTANCE != null) {
                RNBreastFeedingModule.INSTANCE.updateTimer(_duration, !_isPaused);
            }
        }
    }

    private Timer timer;
    private Chrono chrono;

    @Override
    public void onCreate() {
        super.onCreate();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForeground(RNBreastFeedingModule.NOTIFICATION_ID, RNBreastFeedingModule.INSTANCE.getNotification());
        }
        Log.d(TAG, "onCreate");
    }

    @Override
    public IBinder onBind(Intent intent) {
        Log.d(TAG, "onBind");
        Log.d(TAG, intent.toString());
        return null;
    }

    private Chrono getChrono() {
        if (chrono == null) {
            chrono = new Chrono();
        }
        return chrono;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, intent.toString());
        if (intent.hasExtra(RNBreastFeedingModule.ACTION_START)) {
            Log.d(TAG, "request ACTION_START");
            timer = new Timer(true);
            timer.scheduleAtFixedRate(getChrono(), 0, 1000);
        } else if (intent.hasExtra(RNBreastFeedingModule.ACTION_PAUSE)) {
            Log.d(TAG, "request ACTION_PAUSE");
            getChrono().pause();
            updateNotificationButton(false);
        } else if (intent.hasExtra(RNBreastFeedingModule.ACTION_RESUME)) {
            Log.d(TAG, "request ACTION_RESUME");
            getChrono().resume();
            updateNotificationButton(true);
        } else if (intent.hasExtra(RNBreastFeedingModule.ACTION_STOP)) {
            Log.d(TAG, "request ACTION_STOP");
            timer.cancel();
            timer.purge();
            getChrono().cancel();
            stopSelf();
        } else if (intent.hasExtra(RNBreastFeedingModule.ACTION_ADD_TIME)) {
            Log.d(TAG, "request ACTION_ADD_TIME");
            long value = intent.getLongExtra(RNBreastFeedingModule.ACTION_ADD_TIME, 0);
            getChrono().add(value);
        } else if (intent.hasExtra(RNBreastFeedingModule.ACTION_CHANGE_TO)) {
            Log.d(TAG, "request ACTION_CHANGE_TO");
            long value = intent.getLongExtra(RNBreastFeedingModule.ACTION_CHANGE_TO, 0);
            getChrono().changeTo(value);
        } else {
            Log.d(TAG, "intent extra not found?");
        }
        return START_NOT_STICKY;
    }

    private void updateNotificationButton(boolean isRunning) {
        if (RNBreastFeedingModule.INSTANCE != null) {
            RNBreastFeedingModule.INSTANCE.updateNotificationButton(isRunning);
        }
    }

    /*
    @Override
    public void onTaskRemoved(Intent rootIntent) {
        Log.d(TAG, "onTaskRemoved");
    }
    */
}