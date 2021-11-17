// ==UserScript==
// @name         Seamless.AI Find All Macro
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Automatically finds all, then goes to next page.
// @author       Mason
// @match        https://login.seamless.ai/*
// ==/UserScript==
const later = (delay, value) => new Promise(resolve => setTimeout(resolve, delay, value));
var running = false;

(function (old) {
    window.history.pushState = async function () {
        old.apply(window.history, arguments);
        await injectonceasync();
    }
})(window.history.pushState);

function inject(){
    console.log('attemping to inject button');
    if(getInjectedButton() == undefined && getMenuDiv() != undefined){
        console.log('button injected');
        injectButton();
        if(running){
            autoBtnDisable(getInjectedButton());
        }
        return true;
    }
    return false;
}
var injecting = false;
async function injectonceasync(){

    while(true){
        if(!window.location.href.includes('search/contacts?')){
            return;
        }
        await later(200);
        if(inject()){
            return;
        }
        else{
            await later(100);
        }

    }

}
async function injectasync(){
    console.log('attemping to inject button');
    while(true){
        if(inject()){
        }
        else{
            await later(100);
        }

    }

}

window.addEventListener('load', async function() {
'use strict';
    await injectonceasync();
});

async function waitFor(cond, timeout = 30000){
    var timer = 0;
    var poll = 100;
    while(true)
    {
        if(timer >= timeout){
            return false;
        }
        if(!cond()){
            timer += poll;
            await later(poll);
        }
        else{
            return true;
        }
    }
}

function isNoResults(){
    var xpath = "//div[text()='No results']";
    return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue != undefined;
}

function hasTable(){
    var xpath = "//table";
    return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue != undefined;
}
function isLoadingTable(){
    if(!hasTable()){
        return false;
    }
    var xpath = "//div[contains(@class, 'rs-placeholder')]";
    return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue != undefined;
}
function hasNextBatch(){
    return getNextBatchButton() != undefined
}
function getNextBatchButton(){
    var xpath = "//button[text()='Search Next 10 Companies']";
    return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}
function getFindAllButton(){
    var xpath = "//button[text()='Find All']";
    return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}
function getInjectedButton(){
    return document.evaluate("//button[contains(@class, 'macro-autofind-btn')]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}
function hasNextPage(){
    var nextbtn = getNextButton();
    if(nextbtn == undefined){
        return false;
    }
    return nextbtn.disabled == false;
}
function getNextButton(){
    var xpath= "button[last()]";
    var parentdiv = getMenuDiv();
    if(parentdiv == undefined){
        return parentdiv;
    }
    return document.evaluate(xpath, parentdiv, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}
function getMenuDiv(){
    var findAll = getFindAllButton();
    if(findAll == undefined) return undefined;
    return findAll.parentElement;
}
function autoBtnEnable(btn){
    btn.childNodes[1].data = "Auto Find";
    btn.classList.remove("rs-btn-disabled");
    btn.disabled = false;
    btn.onclick = async function(){
        autoBtnDisable(btn);
        await main();
    };
}
function autoBtnDisable(btn){
    btn.childNodes[1].data = "Stop";
    btn.onclick = async function() {
        running = false;
        btn.childNodes[1].data = "Stopping...";
        btn.disabled = true;
        btn.classList.add("rs-btn-disabled");
    };
    //btn.disabled = true;
}
async function injectButton(){
    var div = getMenuDiv();
    while( (div = getMenuDiv()) == undefined){
        await later(500);
    }
    var newbtn = getFindAllButton().cloneNode(true);
    newbtn.classList.add('macro-autofind-btn');
    newbtn.style.backgroundColor = "rgb(30, 204, 10)";
    div.insertBefore(newbtn, div.children[1]);
    autoBtnEnable(newbtn);
    return newbtn;

}

async function main(){
    running = true;
    while(running){
        console.log('==Checking for table==');
        if(hasTable()){
            console.log('Found table waiting for it to finish loading...');
            //Wait for table to load
            await waitFor(() => !isLoadingTable(), 60000);
            console.log('Now waiting for the findall button to be ready...');
            //Wait for find all button to be ready
            var findall_ready = await waitFor(() => getFindAllButton() != undefined && !getFindAllButton().disabled, 1000);
            if(findall_ready){
                console.log('Clicked findall button');
                getFindAllButton().click();
                await later(2500);

            }
            else{
                console.log('Findall button not found / timed out');
            }
        }
        await later(500);
        console.log('==Checking for next page==');
        if(hasNextPage()){
            console.log('Clicked next page');
            getNextButton().click();
            continue;
        }
        await later(500);
        console.log('==Checking for next batch==');
        if(hasNextBatch()){
            console.log('Clicked next batch');
            getNextBatchButton().click();
            continue;
        }
        await later(500);
    }
    console.log('Macro stopped!');

    autoBtnEnable(getInjectedButton());

}
