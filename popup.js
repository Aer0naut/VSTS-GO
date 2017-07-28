var accesstoken;
var domain;
var collection;
var vstsApiVersion = "?api-version=3.0";
var vstsApiUrl = "_apis/wit/workItems/";
var err = new errMsg();

//Analytics------------------------
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-102907431-1']);
_gaq.push(['_trackPageview']);

//Inserting by script to avoid security restraints in chrome extensions
(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();
//Analytics---------------------------------------

//loads user configuration values and sets up click event, 
//or dislplays option to configure
function loadConfig(){
    chrome.storage.sync.get([
        'userDomain',
        'userCollection',
        'userAccessToken'
        ], 
        function(items) {
            domain = items.userDomain;
            collection = items.userCollection;
            accesstoken = items.userAccessToken;

            if(configIsValid()){ 
                //set eventlisteners by script to avoid security issues
                document.querySelector('button').addEventListener('click', GetItem);
                document.getElementById("workItemId").addEventListener("keyup", function(event) {
                    event.preventDefault();
                    if (event.keyCode == 13) {
                        document.getElementById("goButton").click();
                    } 
                });
            }
            else{
                err.invalidConfiguration();
            }
        }   
    );
}

function formVstsApiUrl(wId){
   var fullVstsApiUrl = domain+"/"+collection+"/"+vstsApiUrl+wId+vstsApiVersion;
   return fullVstsApiUrl;
}

function formWorkItemURL(teamProject,id){
    var fullWorkItemURL = domain + "/" + encodeURI(collection +"/"+ teamProject) + "/_workitems?id=" + id;
    return fullWorkItemURL;
}

function configIsValid(){
    if(!(accesstoken&&domain&&collection)){
        return false;
    }
return true;
}

function idIsValid(id){
    if(id && id>1 && id<999999999){
        return true;
    }
return false;
}

//object for errormessages in the popup
function errMsg(){

    this.invalidConfiguration = function()
    {
        document.body.innerHTML = '<div class="error-Configure">'+
        '<h2>Please configure</h2>'+
        '<button id="go-to-options">Options</button>'+
        '</div>';
        document.querySelector('#go-to-options').addEventListener('click', function() {
            if (chrome.runtime.openOptionsPage) {
                // New way to open options pages, if supported (Chrome 42+).
                chrome.runtime.openOptionsPage();
            } else {
                // Reasonable fallback.
                window.open(chrome.runtime.getURL('options.html'));
            }
        });
    };
    
    this.requestError = function(msg){
        rspText = jQuery.parseJSON(msg.responseText);
        document.body.innerHTML = '<div class="error-Request"><h2>Request error</h2>'+
        rspText.message;
        console.log("Error: " + msg.responseText);
    };

    this.idInvalid = function(){
        document.body.innerHTML = '<div class="error-Id">'+
        '<h2>ID is invalid</h2>';
    }
}

//hides input box and button, shows loader
function displayLoader(display){

    if(display){
        document.getElementById('workItemId').style.display='none';
        document.getElementById('goButton').style.display='none';
        document.getElementById('loader').style.display='block';
        }
    else{
        document.getElementById('workItemId').style.display='block';
        document.getElementById('goButton').style.display='block';
        document.getElementById('loader').style.display='none';
    }

}

function GetItem() {
    if(configIsValid())
    {
        var id=document.getElementById('workItemId').value;
        
        if(idIsValid(id))
        {

        //Google Analytics--------- user requested an item, and config and id was valid
        _gaq.push(['_trackEvent', 'GetItem', domain, id]);
  
            displayLoader(true);

            $.ajax({ 
                url:formVstsApiUrl(id),
                type: "GET",
                dataType: "json",
                headers: {
                    'Authorization': 'Basic ' + btoa("" + ":" + accesstoken)
                },      
                success: function(data){    
                    window.open(formWorkItemURL(data.fields["System.TeamProject"],id) , '_newtab');
                    displayLoader(false);
                },
                error: function (jqXHR, status, error) {
                    displayLoader(false);
                    err.requestError(jqXHR);
                }
            });
        }
        else{
            err.idInvalid();
        }
    }
    else{
        err.invalidConfiguration();
    }
}

//Load userconfig on pageload
document.addEventListener('DOMContentLoaded', loadConfig());
