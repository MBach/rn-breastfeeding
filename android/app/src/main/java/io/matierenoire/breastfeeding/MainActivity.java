package io.matierenoire.breastfeeding;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;
import com.swmansion.gesturehandler.react.RNGestureHandlerEnabledRootView;

/**
 * @author Matthieu BACHELIER
 * @version 1.1
 * @since 2019-02
 */
public class MainActivity extends ReactActivity {

    @Override
    protected String getMainComponentName() {
        return "BreastFeeding";
    }

    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new ReactActivityDelegate(this, getMainComponentName()) {
            @Override
            protected ReactRootView createRootView() {
                return new RNGestureHandlerEnabledRootView(MainActivity.this);
            }
        };
    }
}
