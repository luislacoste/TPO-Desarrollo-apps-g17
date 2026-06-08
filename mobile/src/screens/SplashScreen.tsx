import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Dimensions,
  Image,
} from "react-native";

const { width } = Dimensions.get("window");

interface Props {
  navigation: any;
}

export default function SplashScreen({ navigation }: Props) {
  const ring1Scale = useRef(new Animated.Value(0)).current;
  const ring2Scale = useRef(new Animated.Value(0)).current;
  const ring3Scale = useRef(new Animated.Value(0)).current;
  const ring1Opacity = useRef(new Animated.Value(0)).current;
  const ring2Opacity = useRef(new Animated.Value(0)).current;
  const ring3Opacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(-80)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const nameOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(10)).current;
  const spinnerOpacity = useRef(new Animated.Value(0)).current;
  const spinnerRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Ring 1
    Animated.parallel([
      Animated.timing(ring1Scale, {
        toValue: 1,
        duration: 1400,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(ring1Opacity, {
        toValue: 1,
        duration: 1400,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Ring 2
    Animated.parallel([
      Animated.timing(ring2Scale, {
        toValue: 1,
        duration: 1800,
        delay: 500,
        useNativeDriver: true,
      }),
      Animated.timing(ring2Opacity, {
        toValue: 0.7,
        duration: 1800,
        delay: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Ring 3
    Animated.parallel([
      Animated.timing(ring3Scale, {
        toValue: 1,
        duration: 2200,
        delay: 800,
        useNativeDriver: true,
      }),
      Animated.timing(ring3Opacity, {
        toValue: 0.4,
        duration: 2200,
        delay: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Logo drop + bounce
    Animated.sequence([
      Animated.delay(600),
      Animated.parallel([
        Animated.spring(logoTranslateY, {
          toValue: 0,
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // App name reveal
    Animated.sequence([
      Animated.delay(2800),
      Animated.timing(nameOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Tagline
    Animated.sequence([
      Animated.delay(3600),
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(taglineTranslateY, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Spinner fade in
    Animated.sequence([
      Animated.delay(4200),
      Animated.timing(spinnerOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Spinner rotation loop
    const spinLoop = () => {
      spinnerRotation.setValue(0);
      Animated.timing(spinnerRotation, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) spinLoop();
      });
    };
    const spinTimer = setTimeout(spinLoop, 4300);

    // Navigate after 5.5s
    const navTimer = setTimeout(() => {
      navigation.replace("Login");
    }, 5500);

    return () => {
      clearTimeout(navTimer);
      clearTimeout(spinTimer);
    };
  }, [navigation]);

  const spinDeg = spinnerRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      {/* Ring 1 */}
      <Animated.View
        style={[
          styles.ring,
          { width: 220, height: 220, borderRadius: 110 },
          { transform: [{ scale: ring1Scale }], opacity: ring1Opacity },
        ]}
      />
      {/* Ring 2 */}
      <Animated.View
        style={[
          styles.ring,
          { width: 360, height: 360, borderRadius: 180 },
          { transform: [{ scale: ring2Scale }], opacity: ring2Opacity },
        ]}
      />
      {/* Ring 3 */}
      <Animated.View
        style={[
          styles.ring,
          { width: 520, height: 520, borderRadius: 260 },
          { transform: [{ scale: ring3Scale }], opacity: ring3Opacity },
        ]}
      />

      {/* Logo + text */}
      <View style={styles.logoWrap}>
        <Animated.View
          style={[
            styles.logoCircle,
            {
              transform: [{ translateY: logoTranslateY }],
              opacity: logoOpacity,
            },
          ]}
        >
          <Image
            source={require("../../assets/icono-png.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.Text style={[styles.appName, { opacity: nameOpacity }]}>
          SUBASTAR
        </Animated.Text>
        <Animated.Text
          style={[
            styles.tagline,
            {
              opacity: taglineOpacity,
              transform: [{ translateY: taglineTranslateY }],
            },
          ]}
        >
          SUBASTAS EN TIEMPO REAL
        </Animated.Text>
      </View>

      {/* Spinner */}
      <Animated.View
        style={[
          styles.spinner,
          { opacity: spinnerOpacity, transform: [{ rotate: spinDeg }] },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#146C94",
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "rgba(175, 211, 226, 0.25)",
  },
  logoWrap: {
    alignItems: "center",
    gap: 16,
    zIndex: 1,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoLetter: {
    fontSize: 56,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  logoImage: {
    width: 86,
    height: 86,
  },
  appName: {
    color: "#F6F1F1",
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 8,
  },
  tagline: {
    color: "#AFD3E2",
    fontSize: 11,
    letterSpacing: 4,
    textAlign: "center",
  },
  spinner: {
    position: "absolute",
    bottom: 60,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: "rgba(175, 211, 226, 0.25)",
    borderTopColor: "#AFD3E2",
  },
});
