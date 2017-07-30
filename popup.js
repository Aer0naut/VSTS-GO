var accesstoken;
var domain;
var collection;
var vstsApiVersion = "?api-version=3.0";
var vstsApiUrl = "_apis/wit/workItems/";
var err = new errMsg();
var recentItems = [];


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
        'userAccessToken',
        'userRecentItems'
        ], 
        function(items) {
            domain = items.userDomain;
            collection = items.userCollection;
            accesstoken = items.userAccessToken;
            //if items where previously saved, assign them to local array
            if(items.userRecentItems){
                recentItems.length=0;
                recentItems = items.userRecentItems;
                console.log('previously saved items found');
            }

            if(configIsValid()){ 
                //set eventlisteners by script to avoid security issues
                document.querySelector('button').addEventListener('click', GetItem);
                document.getElementById("workItemId").addEventListener("keyup", function(event) {
                    event.preventDefault();
                    if (event.keyCode == 13) {
                        document.getElementById("goButton").click();
                    } 
                });

                if(recentItems.length>0){
                    showRecentItems();
                }else{console.log('no item history')};
                
                document.getElementById("workItemId").focus();

            }
            else{
                err.invalidConfiguration();
            }
        }   
    );
}

function showRecentItems(){
//appends li children to the ul list of the recent items, and then shows the ul list
   
    var divRecentItems = document.getElementById('recentItems');
    var ulRecentItems = document.createElement('ul');

    divRecentItems.appendChild(ulRecentItems);

     console.log('length:'+ recentItems.length);

    for(var i in recentItems){
        var li=document.createElement('li');
        li.className = 'listItem' + i;
        ulRecentItems.appendChild(li);

        li.innerHTML+= '<a href="'+
            recentItems[i][1]+'" target="_blank" title="'+recentItems[i][2]+'">'+
            recentItems[i][0]+': '+recentItems[i][2]+'</a>';

            console.log(i + ': '+recentItems[i][0]);
        }
        divRecentItems.style.display='block';  
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
        document.getElementById('container').style.display='none';
        document.getElementById('divLoader').style.display='block';
        }
    else{
        document.getElementById('divLoader').style.display='none';
        document.getElementById('container').style.display='block';
    }

}

function saveRecentItem(id,recentItemUrl,title){
    //insert url,id and title in the first (0) place of the array
    //then store the array

    recentItems.unshift([id,recentItemUrl,title]);
    
    //Make sure the number of saved items in the array is max 5
    if(recentItems.length>5){ 
    recentItems.length = 5;
    }

    chrome.storage.sync.set({
    'userRecentItems': recentItems
  }, function() {
    // Update 
   console.log('stored recent items');
  });
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

        //make VSTS API Call to retrieve item info
            $.ajax({ 
                url:formVstsApiUrl(id),
                type: "GET",
                dataType: "json",
                headers: {
                    'Authorization': 'Basic ' + btoa("" + ":" + accesstoken)
                },      
                success: function(data){
                    var goUrl = formWorkItemURL(data.fields["System.TeamProject"], id);  
                    saveRecentItem(id,goUrl,data.fields["System.Title"]);
                    console.log(data.fields["System.Title"]);
                    window.open(goUrl , '_newtab');
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
