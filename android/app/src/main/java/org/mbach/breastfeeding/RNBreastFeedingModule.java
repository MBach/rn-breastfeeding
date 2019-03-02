package org.mbach.breastfeeding;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.support.annotation.NonNull;
import android.support.annotation.RequiresApi;
import android.support.v4.app.NotificationCompat;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.Locale;
import java.util.concurrent.TimeUnit;


/**
 * @author Matthieu BACHELIER
 * @version 1.0
 * @since 2019-02
 */
public class RNBreastFeedingModule extends ReactContextBaseJavaModule {

    private static final String TAG = "BFModule";
    private static final String CHANNEL_ID = "breastfeeding_id";
    private static final String ON_TICK = "onTick";

    private final ReactApplicationContext reactContext;
    private Notification notification;
    static final int NOTIFICATION_ID = 100;
    static RNBreastFeedingModule INSTANCE;

    static final String ACTION_START = "ACTION_START";
    static final String ACTION_PAUSE = "ACTION_PAUSE";
    static final String ACTION_RESUME = "ACTION_RESUME";
    static final String ACTION_STOP = "ACTION_STOP";
    static final String ACTION_CHANGE_TO = "ACTION_CHANGE_TO";
    static final String ACTION_ADD_TIME = "ACTION_ADD_TIME";

    private Long millis = 0L;

    RNBreastFeedingModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        INSTANCE = this;
    }

    /**
     * Starts a service.
     */
    private void startService(String action, Long value) {
        Intent intent = new Intent(reactContext, ChronoService.class);
        intent.putExtra(action, value);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            reactContext.startForegroundService(intent);
        } else {
            reactContext.startService(intent);
        }
    }

    /**
     * @param millis time to display
     */
    void updateTimer(final Long millis, boolean isRunning) {
        if (isRunning) {
            this.millis = millis;
            updateNotificationButton(true);
        }
        WritableMap payload = Arguments.createMap();
        payload.putString("timer", String.valueOf(millis));
        payload.putBoolean("isRunning", isRunning);
        reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(ON_TICK, payload);
    }

    /**
     * @param isRunning check if running
     */
    void updateNotificationButton(boolean isRunning) {
        Intent resultIntent = new Intent(reactContext, ChronoService.class);
        resultIntent.setAction(Intent.ACTION_MAIN);
        resultIntent.addCategory(Intent.CATEGORY_LAUNCHER);
        if (isRunning) {
            resultIntent.putExtra(ACTION_PAUSE, ACTION_PAUSE);
        } else {
            resultIntent.putExtra(ACTION_RESUME, ACTION_RESUME);
        }

        PendingIntent pendingIntent = PendingIntent.getService(reactContext, 42, resultIntent,
                PendingIntent.FLAG_UPDATE_CURRENT);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(reactContext, CHANNEL_ID).setContentTitle(formatTime())
                .setSmallIcon(R.drawable.ic_timer_notification);

        Intent intent = new Intent(reactContext, MainActivity.class);
        PendingIntent pending = PendingIntent.getActivity(reactContext, 666, intent, PendingIntent.FLAG_UPDATE_CURRENT);
        builder.setContentIntent(pending);
        if (isRunning) {
            builder = builder.addAction(0, reactContext.getString(R.string.pause), pendingIntent);
        } else {
            builder = builder.addAction(0, reactContext.getString(R.string.resume), pendingIntent).setContentText(reactContext.getString(R.string.on_hold));
        }

        NotificationManager notificationManager = (NotificationManager) reactContext.getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager != null) {
            notification = builder.build();
            notificationManager.notify(NOTIFICATION_ID, notification);
        } else {
            Log.d(TAG, "notificationManager is null :(");
        }
    }

    @Override
    public String getName() {
        return "RNBreastFeedingModule";
    }

    @RequiresApi(Build.VERSION_CODES.O)
    private void createChannel() {
        NotificationManager notificationManager = (NotificationManager) reactContext.getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager == null) {
            return;
        }
        NotificationChannel notificationChannel = new NotificationChannel(CHANNEL_ID, reactContext.getString(R.string.channel), NotificationManager.IMPORTANCE_LOW);
        notificationChannel.setDescription(reactContext.getString(R.string.description));
        notificationChannel.setSound(null, null);
        notificationChannel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);
        notificationManager.createNotificationChannel(notificationChannel);
    }

    @NonNull
    private String formatTime() {
        return String.format(Locale.getDefault(), "%02d:%02d",
                TimeUnit.MILLISECONDS.toMinutes(millis) -
                        TimeUnit.HOURS.toMinutes(TimeUnit.MILLISECONDS.toHours(millis)),
                TimeUnit.MILLISECONDS.toSeconds(millis) -
                        TimeUnit.MINUTES.toSeconds(TimeUnit.MILLISECONDS.toMinutes(millis)));
    }

    Notification getNotification() {
        if (notification == null) {
            Intent resultIntent = new Intent(reactContext, ChronoService.class);
            resultIntent.putExtra(ACTION_PAUSE, ACTION_PAUSE);
            PendingIntent pendingIntent = PendingIntent.getService(reactContext, 42, resultIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT);
            notification = new NotificationCompat.Builder(this.reactContext, CHANNEL_ID).setContentTitle("00:00")
                    .addAction(0, reactContext.getString(R.string.pause), pendingIntent)
                    .setSmallIcon(R.drawable.ic_timer_notification).build();
            return notification;
        } else {
            return notification;
        }
    }

    @ReactMethod
    public void startTimer() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            createChannel();
        }
        getNotification();
        startService(ACTION_START, null);
    }

    @ReactMethod
    public void pauseTimer() {
        startService(ACTION_PAUSE, null);
    }

    @ReactMethod
    public void resumeTimer() {
        startService(ACTION_RESUME, null);
    }

    @ReactMethod
    public void deleteTimer() {
        startService(ACTION_STOP, null);
    }

    @ReactMethod
    public void addTime(final Double time) {
        startService(ACTION_ADD_TIME, time.longValue());
    }

    @ReactMethod
    public void changeTo(final Double time) {
        startService(ACTION_CHANGE_TO, time.longValue());
    }
}
