var webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;

var driver = new webdriver.Builder()
    .forBrowser('firefox')
    .build();

driver.get('https://www.amazon.com/');



var searchbox = driver.findElement(By.id('twotabsearchtextbox'));
searchbox.sendKeys('lunch box');

//driver.findElement(By.className('nav-input')).click();

//console.log(driver.findElement(By.tagName('body')).getText());




driver.quit();