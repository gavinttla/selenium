/**
 * This is the first version that request a url directly from browser. It is not a good method since amazon
 * can detect the referral then block the access.
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

//console.log(searchKey + "|" + findKey + "|" + startUrl);
//process.exit()

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

    // between clicks time range
    this.restTime = 2000;

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
                                    self.getLivePage(info.nextPageUrl);
                                }, self.restTime);
                            }
                        }

                    });
                });
            });

        });
    };


    this.getLivePage = function(url) {
        
        var newurl = 'https://www.amazon.com' + url;
        driver.get(newurl).then(function(){
            driver.getPageSource().then(function(source){
                //console.log(source);

                driver.getCurrentUrl().then(function(url){

                    var num = self.getPageNum(url);
                    console.log("check page:" + num + "=>" + url);

                    var info = self.checkPage(source, url);
                    if(info.isKeyExist){
                        console.log("FOUND KEYWORD:"+self.findKey+" AT PAGE :"+num+":"+url);
                        self.waitforinput(info.nextPageUrl);
                    
                    } else {
                        //console.log('start next url');
                        if(info.nextPageUrl) {
                            setTimeout(function() {
                                self.getLivePage(info.nextPageUrl);
                            }, self.restTime);
                        }

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
                        self.getLivePage(nexturl);
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

