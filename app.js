var webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;

var fs = require('fs');
var cheerio = require('cheerio');

var driver = new webdriver.Builder()
    .forBrowser('firefox')
    .build();

/*
driver.get('https://www.amazon.com/').then(function(){

});

var searchbox = driver.findElement(By.id('twotabsearchtextbox'));
searchbox.sendKeys('lunch box');

//driver.findElement(By.className('nav-input')).click();

//console.log(driver.findElement(By.tagName('body')).getText());

driver.quit();
*/



var mysearch = new function() {

    var self = this;

    this.keyword = '';

    this.baseUrl = '';

    this.curUrl = '';

    this.init = function(option) {

        this.keyword = option.keyword;
        this.baseurl = option.url;

        driver.get('https://www.amazon.com/').then(function(){
            var searchbox = driver.findElement(By.id('twotabsearchtextbox'));
            searchbox.sendKeys('lunch box');

            driver.findElement(By.className('nav-input')).click().then(function(){
                driver.getPageSource().then(function(source){
                    //console.log(source);

                    driver.getCurrentUrl().then(function(url){
                        var info = self.checkPage(source, url);
                        if(info.nextPageUrl) {
                            
                            setTimeout(function() {

                                self.getLivePage(info.nextPageUrl);

                            }, 2000);


                        }
                    });

                    //self.checkPage(source, driver.getCurrentUrl())
                    /*
                    fs.writeFile("temp.html", source, function(error) {
                        if(error) {
                            console.log(error);
                        }
                        console.log("store success");
                    });
                    */
                    
                });
            });

        });

        //this.getLivePage(this.baseurl);
    };



    this.getLivePage = function(url) {
        
        var newurl = 'https://www.amazon.com' + url;
        driver.get(newurl).then(function(){
            driver.getPageSource().then(function(source){
                //console.log(source);

                driver.getCurrentUrl().then(function(url){
                    console.log("checkurl:"+url);

                    var info = self.checkPage(source, url);
                    if(info.nextPageUrl) {
                        
                        setTimeout(function() {

                            self.getLivePage(info.nextPageUrl);

                        }, 2000);


                    }
                });

                
            });

        });

    }


    this.checkPage = function(html, url) {
        var isKeyExist = this.isKeywordExist(html);

        var nextPageUrl = this.getNextPageLink(html, url);

        return {isKeyExist: isKeyExist, nextPageUrl: nextPageUrl};
    };


    this.isKeywordExist = function(html) {
        var re = "/" + this.keyword + "/i";
        return html.match(re);
    };

    this.getNextPageLink = function(html, url) {
        //console.log('getnextpagelink:'+url);
        var newurl, tempnum, addnum, tempurl, finalurl;
        var curPageNum = this.getPageNum(url);
        if(!curPageNum){
            curPageNum = 1;
        }
        var $ = cheerio.load(html);

        $(".pagnLink a").each(function(){
            tempurl = $(this).attr('href');
            //console.log(tempurl);
            tempnum = self.getPageNum(tempurl);
            addnum = parseInt(curPageNum) + 1;
            if(addnum == parseInt(tempnum)){
                finalurl = tempurl;
            } 
        });

        return finalurl;

    };

    this.getPageNum = function(url) {
        var re = /page=(\d+)/i;
        var found = url.match(re);

        if(found){
            return found[1];
        }else{
            return false;
        }
    };

};


var soption = {'url':'https://www.amazon.com/', 'keyword':'freshware'};

mysearch.init(soption);

