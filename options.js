var formOptions = document.getElementById('optionsForm');
var inAccessToken = document.getElementById('inputAccessToken');
var inDomain = document.getElementById('inputDomain');
var inCollection = document.getElementById('inputCollection');
var txtStatus = document.getElementById('status');
var btnSave = document.getElementById('save');


// Saves options to chrome.storage.sync.
function save_options() {

  if (formOptions.checkValidity()) {
    chrome.storage.sync.set({
    userAccessToken: inAccessToken.value,
    userDomain: inDomain.value,
    userCollection: inCollection.value
  }, function() {
    // Update status to let user know options were saved.
    txtStatus.textContent = '> Options saved!';
    // reset status message
    setTimeout(function() {
    txtStatus.textContent = '';
    }, 2000
    );
  });

  }else{ 

    if(!inDomain.checkValidity()){
    txtStatus.textContent = inDomain.validationMessage;
    }
    if(!inCollection.checkValidity()){
    txtStatus.textContent = inCollection.validationMessage;
    }
    if(!inAccessToken.checkValidity()){
    txtStatus.textContent = inAccessToken.validationMessage;    

    }
  }
   event.preventDefault();
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions() {

  // Set defaults or store uservalues
  chrome.storage.sync.get({
    userAccessToken: '<insert>',
    userDomain: 'https://',
    userCollection: 'DefaultCollection'
  }, function(storedItems) {
    inAccessToken.value = storedItems.userAccessToken;
    inDomain.value = storedItems.userDomain;
    inCollection.value = storedItems.userCollection;
  });
}

function whenPageHasLoaded()
{
  btnSave.addEventListener('click', save_options);
  restoreOptions();
}


document.addEventListener('DOMContentLoaded', whenPageHasLoaded());
