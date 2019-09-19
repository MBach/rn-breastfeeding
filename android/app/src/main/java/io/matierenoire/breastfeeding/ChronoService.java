package io.matierenoire.breastfeeding;

import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

import java.util.HashMap;
import java.util.Map;


/**
 * @author Matthieu BACHELIER
 * @version 1.0
 * @since 2019-02
 */
public class ChronoService extends Service {

    private static final String TAG = "BFChronoService";
    private Map<String, RNTimer> timers = new HashMap<>();

    @Override
    public void onCreate() {
        super.onCreate();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, intent.toString());
        if (!intent.hasExtra(RNBreastFeedingModule.TIMER_ID)) {
            return START_NOT_STICKY;
        }
        String timerId = intent.getStringExtra(RNBreastFeedingModule.TIMER_ID);
        RNTimer timer = timers.get(timerId);

        if (intent.hasExtra(RNBreastFeedingModule.ACTION_PAUSE_RESUME)) {
            Log.d(TAG, "request ACTION_PAUSE_RESUME");
            if (timer == null) {
                timer = new RNTimer(timerId);
                timers.put(timerId, timer);
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForeground(RNBreastFeedingModule.NOTIFICATION_ID, RNBreastFeedingModule.INSTANCE.getNotification(timerId));
            }
            for (Map.Entry<String, RNTimer> entry : timers.entrySet()) {
                RNTimer t = entry.getValue();
                if (entry.getKey().equals(timerId)) {
                    // Toggle current timer
                    t.pauseResumeTimer();
                } else {
                    // Pause other timers
                    t.pauseTimer();
                }
            }
            if (RNBreastFeedingModule.INSTANCE != null) {
                RNBreastFeedingModule.INSTANCE.updateNotificationButton(timerId, timer.duration(), timer.isRunning());
            }
        } else if (intent.hasExtra(RNBreastFeedingModule.ACTION_STOP)) {
            Log.d(TAG, "request ACTION_STOP");
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForeground(RNBreastFeedingModule.NOTIFICATION_ID, RNBreastFeedingModule.INSTANCE.getNotification(timerId));
            }
            for (Map.Entry<String, RNTimer> entry : timers.entrySet()) {
                RNTimer t = entry.getValue();
                t.cancel();
            }
            stopSelf();
            if (RNBreastFeedingModule.INSTANCE != null) {
                RNBreastFeedingModule.INSTANCE.clearNotification();
            }
        } else if (intent.hasExtra(RNBreastFeedingModule.ACTION_ADD_TIME)) {
            Log.d(TAG, "request ACTION_ADD_TIME");
            if (timer != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    startForeground(RNBreastFeedingModule.NOTIFICATION_ID, RNBreastFeedingModule.INSTANCE.getNotification(timerId));
                }
                timer.add(intent.getLongExtra(RNBreastFeedingModule.ACTION_ADD_TIME, 0));
            }
        } else if (intent.hasExtra(RNBreastFeedingModule.ACTION_CHANGE_TO)) {
            Log.d(TAG, "request ACTION_CHANGE_TO");
            if (timer != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    startForeground(RNBreastFeedingModule.NOTIFICATION_ID, RNBreastFeedingModule.INSTANCE.getNotification(timerId));
                }
                timer.changeTo(intent.getLongExtra(RNBreastFeedingModule.ACTION_CHANGE_TO, 0));
            }
        } else {
            Log.w(TAG, "intent extra not found?");
            stopSelf();
        }
        return START_NOT_STICKY;
    }


}