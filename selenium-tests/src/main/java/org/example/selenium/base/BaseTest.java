package org.example.selenium.base;
import org.example.selenium.config.TestConfig;
import org.example.selenium.constants.BrowserType;
import org.example.selenium.factory.abstractFactory.DriverManagerFactoryAbstract;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.testng.ITestResult;
import org.testng.annotations.AfterClass;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Optional;
import org.testng.annotations.Parameters;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class BaseTest {
    private static final ThreadLocal<WebDriver> DRIVER = new ThreadLocal<>();
    private static final Path SCREENSHOT_DIR = Path.of("target", "screenshots");
    private static final DateTimeFormatter FILE_TIME_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");

    @BeforeClass(alwaysRun = true)
    @Parameters("browser")
    public void startDriver(@Optional("CHROME") String browser) {
        String configuredBrowser = System.getProperty("browser", browser);
        BrowserType browserType = BrowserType.valueOf(configuredBrowser.toUpperCase());
        WebDriver driver = DriverManagerFactoryAbstract
                .getManager(browserType)
                .createDriver();

        DRIVER.set(driver);
    }

    @AfterClass(alwaysRun = true)
    public void quitDriver() {
        if (getDriver() != null) {
            getDriver().quit();
        }
        DRIVER.remove();
    }

    protected WebDriver getDriver() {
        return DRIVER.get();
    }

    public static Path captureScreenshot(ITestResult result) throws IOException {
        Files.createDirectories(SCREENSHOT_DIR);

        File sourceFile = ((TakesScreenshot) DRIVER.get()).getScreenshotAs(OutputType.FILE);
        Path screenshotPath = SCREENSHOT_DIR.resolve(buildScreenshotName(result));
        Files.copy(sourceFile.toPath(), screenshotPath, StandardCopyOption.REPLACE_EXISTING);

        return screenshotPath;
    }

    private static String buildScreenshotName(ITestResult result) {
        String testClass = result.getTestClass().getRealClass().getSimpleName();
        String testMethod = result.getMethod().getMethodName();
        String timestamp = LocalDateTime.now().format(FILE_TIME_FORMAT);

        return testClass + "_" + testMethod + "_" + timestamp + ".png";
    }
}
