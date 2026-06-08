import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAppData } from "../context/AppContext";

interface Props {
  navigation: any;
}

export default function LoginScreen({ navigation }: Props) {
  const { login, authLoading, loginError } = useAppData();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password || authLoading) return;
    try {
      await login(email, password);
      navigation.replace("Main");
    } catch {
      // El mensaje visible queda en el contexto.
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Branding */}
        <View style={styles.brand}>
          <View style={styles.logoCard}>
            <Image
              source={require("../../assets/icono-png.png")}
              style={styles.logoImg}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.welcome}>Bienvenido</Text>
          <Text style={styles.subtitle}>
            Inicia sesion para acceder a las subastas
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Email */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrap}>
              <Feather
                name="mail"
                size={20}
                color="#737373"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="tu@email.com"
                placeholderTextColor="#A3A3A3"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Contrasena</Text>
            <View style={styles.inputWrap}>
              <Feather
                name="lock"
                size={20}
                color="#737373"
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, styles.inputPadRight]}
                placeholder="Tu contrasena"
                placeholderTextColor="#A3A3A3"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword((v) => !v)}
              >
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#737373"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot password */}
          <TouchableOpacity style={styles.forgotWrap}>
            <Text style={styles.forgotText}>Olvidaste tu contrasena?</Text>
          </TouchableOpacity>

          {loginError ? (
            <Text style={styles.errorText}>{loginError}</Text>
          ) : null}

          {/* Login button */}
          <TouchableOpacity
            style={[
              styles.loginBtn,
              (!email || !password || authLoading) && styles.loginBtnDisabled,
            ]}
            onPress={handleLogin}
            disabled={!email || !password || authLoading}
            activeOpacity={0.85}
          >
            {authLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.loginBtnText}>Iniciar Sesion</Text>
                <Feather name="arrow-right" size={16} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          {/* Register link */}
          <View style={styles.registerWrap}>
            <Text style={styles.registerText}>No tienes cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.registerLink}>Registrate</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#EEF2FF" },
  scroll: { flexGrow: 1 },
  brand: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 72,
    paddingBottom: 32,
    paddingHorizontal: 32,
    backgroundColor: "#EEF2FF",
  },
  logoCard: {
    width: 116,
    height: 116,
    borderRadius: 26,
    backgroundColor: "#FFFBEB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  logoImg: { width: 90, height: 90 },
  welcome: { fontSize: 26, fontWeight: "700", color: "#0A0A0A" },
  subtitle: {
    fontSize: 14,
    color: "#737373",
    marginTop: 6,
    textAlign: "center",
  },
  form: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 48,
    gap: 16,
  },
  fieldWrap: { gap: 6 },
  label: { fontSize: 14, fontWeight: "500", color: "#0A0A0A" },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: "#0A0A0A", height: "100%" },
  inputPadRight: { paddingRight: 8 },
  eyeBtn: { padding: 4 },
  forgotWrap: { alignSelf: "flex-end" },
  forgotText: { fontSize: 13, color: "#3E73EE", fontWeight: "500" },
  errorText: { fontSize: 13, color: "#E7000B", textAlign: "center" },
  loginBtn: {
    height: 54,
    backgroundColor: "#3E73EE",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  loginBtnDisabled: { opacity: 0.55 },
  loginBtnText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  registerWrap: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  registerText: { fontSize: 14, color: "#737373" },
  registerLink: { fontSize: 14, fontWeight: "600", color: "#3E73EE" },
});
