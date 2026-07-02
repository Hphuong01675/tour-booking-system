package org.example.selenium.config;

public final class TestConfig {
    private TestConfig() {
    }

    public static String baseUrl() {
        return normalizeBaseUrl(System.getProperty("baseUrl", "http://localhost:5173/"));
    }

    public static String browser() {
        return System.getProperty("browser", "CHROME");
    }

    public static boolean headless() {
        return Boolean.parseBoolean(System.getProperty("headless", "false"));
    }

    public static long demoPauseSeconds() {
        return Long.parseLong(System.getProperty("demo.pause.seconds", "30"));
    }

    private static String normalizeBaseUrl(String value) {
        if (value.endsWith("/")) {
            return value.substring(0, value.length() - 1);
        }
        return value;
    }
}
