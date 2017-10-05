/**
 * This is version 2, simulate the click on the page to prevent amazon detect invalid referral url.
 * 
 */

var searchKey, findKey, startUrl;

process.argv.forEach(function(val, index){
    if(index>1){
        val = val.replace(/=/, "##@##");
        var arrTemp = val.split('##@##');
        if(arrTemp[0].toLowerCase() == '-search'){
            searchKey = arrTemp[1];
        }else if(arrTemp[0].toLowerCase() == '-find'){
            findKey = arrTemp[1];
        }else if(arrTemp[0] == '-url'){
            startUrl = arrTemp[1];
        }
    }
});

if (!searchKey || !findKey){
    console.log('command not right, please include -search and -find to run it \nEXAMPLE: c:\\node\\selenium>node app.js -search="bento box" -find="gotech"');
    process.exit()
}

if (!startUrl){
    startUrl = 'https://www.amazon.com';
}

var webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;

var fs = require('fs');
var prompt = require('prompt');
var cheerio = require('cheerio');

var driver = new webdriver.Builder()
    .forBrowser('firefox')
    .build();

var mysearch = new function() {

    var self = this;

    this.searchKey = '';

    this.findKey = '';

    this.baseUrl = '';

    this.curUrl = '';

    this.isDebug = false;

    // between clicks time range
    this.restTime = 3000;

    this.promptSchema = {
        properties: {
            action: {
                description: 'Are you want to continue search the rest of pages? [y/n]',
                type: 'string',
                required: true
            }
        }
    };

    this.execute = function(option) {

        this.searchKey = option.searchKeyword;
        this.findKey = option.findKeyword;
        this.baseUrl = option.url;

        driver.get(this.baseUrl).then(function(){

            // put in the keyword into search box
            var searchbox = driver.findElement(By.id('twotabsearchtextbox'));
            searchbox.sendKeys(self.searchKey);

            // click on search button
            driver.findElement(By.className('nav-input')).click().then(function(){
                driver.getPageSource().then(function(source){
                    //console.log(source);

                    driver.getCurrentUrl().then(function(url){
                        var info = self.checkPage(source, url);

                        if(info.isKeyExist){
                            console.log("FOUND KEYWORD:"+self.findKey+" at page 1:"+url);
                            //process.exit()
                            self.waitforinput(info.nextPageUrl);

                        } else {
                            if(info.nextPageUrl) {
                                setTimeout(function() {
                                    self.clickNextPage(info.nextPageUrl);
                                }, self.restTime);
                            }
                        }

                    });
                });
            });

        });
    };

    
    this.clickNextPage = function(nextUrl) {

        var nextnum = this.getPageNum(nextUrl);
        self.echo("opening page num:"+nextnum);
        self.echo("opening page url:"+nextUrl);

        driver.findElements(By.linkText(nextnum)).then(function(elements){

            //self.echo(elments);
            elements.forEach(function(element, index){

                element.getAttribute("href").then(function(href){

                    self.echo('cururl:'+href);
                    self.echo('nexurl:'+nextUrl);

                    var isLink = false;
                    if(self.hasAmazonKey(href)) {
                        if(href == 'https://www.amazon.com' + nextUrl){
                            isLink = true;
                        }
                    } else {
                        if(href == nextUrl) {
                            isLink = true;
                        }
                    }

                    if(isLink){
                        self.echo("before click on: "+href);
                        element.click().then(function(){

                            driver.sleep(1500).then(function(){

                                driver.getPageSource().then(function(source){
                                    //self.echo(source);

                                    driver.getCurrentUrl().then(function(url){

                                        var num = self.getPageNum(url);
                                        console.log("check page:" + num + "=>" + url);

                                        var info = self.checkPage(source, url);
                                        if(info.isKeyExist){
                                            console.log("FOUND KEYWORD:"+self.findKey+" AT PAGE :"+num+":"+url);
                                            //process.exit()
                                            
                                            self.waitforinput(info.nextPageUrl);
                                        
                                        } else {
                                            console.log('start next url');
                                            if(info.nextPageUrl) {
                                                setTimeout(function() {
                                                    self.clickNextPage(info.nextPageUrl);
                                                }, self.restTime);
                                            }

                                        }


                                    });
                                });
            

                            });


            

                        });
                    }
                });
            });
        });
        
    };

    this.checkPage = function(html, url) {
        var isKeyExist = this.isKeywordExist(html);

        var nextPageUrl = this.getNextPageLink(html, url);

        return {isKeyExist: isKeyExist, nextPageUrl: nextPageUrl};
    };

    /**
     * check if find keyword exist
     */
    this.isKeywordExist = function(html) {
        //var re = "/" + this.keyword + "/i";
        //return html.match(re);
        html = html.toLowerCase();
        var newhtml = html.replace(/<!--[\s\S]*?-->/g, "");  // remove all html comments
        var val = newhtml.indexOf(this.findKey);
        return val > 0;
    };


    this.hasAmazonKey = function(url) {

        url = url.toLowerCase();
        var val = url.indexOf("amazon");
        return val > 0;
    };

    this.getNextPageLink = function(html, url) {
        //self.echo('getnextpagelink:'+url);
        var newurl, tempnum, addnum, tempurl, finalurl;
        var curPageNum = this.getPageNum(url);
        if(!curPageNum){
            curPageNum = 1;
        }
        var $ = cheerio.load(html);

        if(curPageNum == 2) {
            self.echo("getNextPageLink url:"+url);
            //self.echo(html);
            //this.outputFile(html);
        }

        $(".pagnLink a").each(function(){
            tempurl = $(this).attr('href');
            //self.echo(tempurl);

            tempnum = self.getPageNum(tempurl);
            addnum = parseInt(curPageNum) + 1;
            if(curPageNum == 2) {
                self.echo("getNextPageLink tempurl:"+tempurl);
            }            
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

    this.outputFile = function(html) {
        fs.writeFile("temp.html", html, function(error) {
          if(error) {
            self.echo(error);
          }

          self.echo("file store success");
        });

    };

    this.echo = function(str) {
        if(this.isDebug){
            console.log(str);
        }
    };

    this.waitforinput = function(nexturl) {
        prompt.start();
        //console.log('waitforinput');
        prompt.get(self.promptSchema, function (err, result) {
            if (err) { return onErr(err); }
            if(result.action.toLowerCase() == 'y'){
                setTimeout(function() {
                        self.clickNextPage(nexturl);
                    }, self.restTime);
                prompt.stop();
            }else if(result.action.toLowerCase() == 'n'){
                process.exit();
            }
        });
       
    }

};

var soption = {'url':startUrl, 'searchKeyword':searchKey, 'findKeyword':findKey};
//var soption = {'url':'https://www.amazon.com/', 'searchKeyword':'lunch box', 'findKeyword':'valilife'};

mysearch.execute(soption);

