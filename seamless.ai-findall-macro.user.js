// ==UserScript==
// @name         Seamless.AI Find All Macro
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Automatically finds all, then goes to next page.
// @author       Mason
// @match        https://login.seamless.ai/search/contacts*
// ==/UserScript==
const later = (delay, value) => new Promise(resolve => setTimeout(resolve, delay, value));
var injected = false;

function inject(){
    if(window.location.href.includes('search/contacts?') && !injected){
        injected = true;
        injectButton();
    }
}

window.addEventListener('locationchange', function() {
    inject();
}
window.addEventListener('load', function() {
'use strict';
    inject();
});

function isLoadingTable(){
    var xpath = "//div[contains(@class, 'rs-placeholder')]";
    return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue != undefined;
}
function getNextBatchButton(){
    var xpath = "//button[text()='Search Next 10 Companies']";
    return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}
console.log('Next Batch Button:')
console.log(getNextBatchButton());
function getFindAllButton(){
    var xpath = "//button[text()='Find All']";
    return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}
console.log('Find All Button:')
console.log(getFindAllButton());
function getNextButton(){
    var xpath= "button[last()]";
    var parentdiv = getMenuDiv();
    if(parentdiv == undefined){
        return parentdiv;
    }
    return document.evaluate(xpath, parentdiv, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}
console.log('Next Button:')
console.log(getNextButton());
function getMenuDiv(){
    var findAll = getFindAllButton();
    if(findAll == undefined) return undefined;
    return findAll.parentElement;
}
console.log('Parent Div:')
console.log(getMenuDiv());

function autoBtnEnable(btn){
    btn.classList.remove("rs-btn-disabled");
    btn.disabled = false;
}
function autoBtnDisable(btn){
    btn.classList.add("rs-btn-disabled");
    btn.disabled = true;
}
async function injectButton(){
    var div = getMenuDiv();
    while( (div = getMenuDiv()) == undefined){
        await later(500);
    }
    var newbtn = getFindAllButton().cloneNode(true);
    newbtn.style.backgroundColor = "rgb(30, 204, 10)";
    newbtn.innerHTML = newbtn.innerHTML.replaceAll('Find All', "Auto Find");
    newbtn.onclick = async function(){
        autoBtnDisable(newbtn);
        await run();
        autoBtnEnable(newbtn);

    }
    div.insertBefore(newbtn, div.children[1]);
    autoBtnEnable(newbtn);
    return newbtn;

}

async function runBatch(){
    console.log('Starting batch!')
    var findallbtn = getFindAllButton();
    var nextbtn = getNextButton();
    function hasNextPage(){
        nextbtn = getNextButton();
        if(nextbtn == undefined){
            return false;
        }
        return nextbtn.disabled == false;
    }
    async function waitForTableLoadingFinish(){
        console.log('waiting for table to load');
        var timer = 0;
        while(true)
        {
            if(timer >= 600){
                console.log('waiting for table to load timed out!');
                return false;
            }
            if(isLoadingTable()){
                timer += 1;
                await later(100);
            }
            else{
                console.log('table loaded!');
                return true;
            }
        }
    }
    async function waitForFindAllReady(timeout = 30) {
        console.log('waiting for findall button to be ready!');
        var timer = 0;
        while(true)
        {
            if(timer >= timeout){
                console.log('waiting for findall button timed out!');
                return false;
            }
            if(findallbtn == undefined || findallbtn.disabled){
                timer += 1;
                await later(1000);
            }
            else{
                console.log('findall button ready!');
                return true;
            }
            findallbtn = getFindAllButton();
        }

    }
    function nextPage(){
        console.log('clicking next page...')
        nextbtn.click();
    }
    function findAll(){
        console.log('finding all!');
        findallbtn.click();
    }


    await waitForTableLoadingFinish();
    var rdy = await waitForFindAllReady(1);
    if(rdy){
        findAll();
    }
    while(hasNextPage()){
        await later(1000);
        nextPage();
        await waitForTableLoadingFinish();
        var ready = await waitForFindAllReady(1);
        if(ready) findAll();
    }
    console.log("Finished batch!");
    //At end of page
}

async function run(){
    await runBatch();
    await later(1000);
    while(getNextBatchButton() != undefined){
        console.log("Clicking next batch button");
        getNextBatchButton().click();
        await runBatch();
        await later(1000);
    }
    console.log('Macro finished');
}
