package org.mbach.breastfeeding;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.support.annotation.RequiresApi;
import android.support.v4.app.NotificationCompat;
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
        //if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        //    startForeground(RNBreastFeedingModule.NOTIFICATION_ID, RNBreastFeedingModule.INSTANCE.getNotification());
        //}
        Log.d(TAG, "onCreate");
    }

    @Override
    public IBinder onBind(Intent intent) {
        Log.d(TAG, "onBind");
        Log.d(TAG, intent.toString());
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
                Log.d(TAG, "creating timer");
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    createChannel();
                    startForeground(RNBreastFeedingModule.NOTIFICATION_ID, RNBreastFeedingModule.INSTANCE.getNotification());
                }
                timer = new RNTimer(timerId);
                timers.put(timerId, timer);
            }
            for (Map.Entry<String, RNTimer> entry : timers.entrySet()) {
                RNTimer t = entry.getValue();
                if (entry.getKey().equals(timerId)) {
                    // Toggle current timer
                    t.pauseResumeTimer();
                    Log.d(TAG, "pauseResumeTimer()");
                } else {
                    // Pause other timers
                    Log.d(TAG, "Pause other timers" + entry.getKey());
                    t.pauseTimer();
                }
            }
        } else if (intent.hasExtra(RNBreastFeedingModule.ACTION_STOP)) {
            Log.d(TAG, "request ACTION_STOP");
            for (Map.Entry<String, RNTimer> entry : timers.entrySet()) {
                RNTimer t = entry.getValue();
                t.cancel();
            }
            stopSelf();
        } else if (intent.hasExtra(RNBreastFeedingModule.ACTION_ADD_TIME)) {
            Log.d(TAG, "request ACTION_ADD_TIME");
            if (timer != null) {
                timer.add(intent.getLongExtra(RNBreastFeedingModule.ACTION_ADD_TIME, 0));
            }
        } else if (intent.hasExtra(RNBreastFeedingModule.ACTION_CHANGE_TO)) {
            Log.d(TAG, "request ACTION_CHANGE_TO");
            if (timer != null) {
                timer.changeTo(intent.getLongExtra(RNBreastFeedingModule.ACTION_CHANGE_TO, 0));
            }
        } else {
            Log.d(TAG, "intent extra not found?");
        }
        return START_NOT_STICKY;
    }

    @RequiresApi(Build.VERSION_CODES.O)
    private void createChannel() {
        NotificationManager notificationManager = (NotificationManager) this.getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager == null) {
            return;
        }
        NotificationChannel notificationChannel = new NotificationChannel(RNBreastFeedingModule.CHANNEL_ID, getString(R.string.channel), NotificationManager.IMPORTANCE_LOW);
        notificationChannel.setDescription(getString(R.string.description));
        notificationChannel.setSound(null, null);
        notificationChannel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);
        notificationManager.createNotificationChannel(notificationChannel);
    }

    private void updateNotificationButton(boolean isRunning) {
        if (RNBreastFeedingModule.INSTANCE != null) {
            RNBreastFeedingModule.INSTANCE.updateNotificationButton(isRunning);
        }
    }
}