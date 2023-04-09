function onOpen() {
  
  var menu = [     
    {name: "Configure", functionName: "checkLabel"},
    null,
    {name: "Start", functionName: "startscript"},
    {name: "Stop", functionName: "stop"},
    null,
    {name: "Set API Key", functionName: "checkKey"},
  ];  
  
  SpreadsheetApp.getActiveSpreadsheet().addMenu("UpNote Gmail API", menu);
  
}

function checkLabel() {
  var scriptProperties = PropertiesService.getScriptProperties();
  var labelName = scriptProperties.getProperty('labelName');
  if (labelName) {
    var replace = Browser.msgBox('A label named "' + labelName + '" is already stored. Do you want to replace it?', Browser.Buttons.YES_NO);
    if (replace == 'yes') {
      createNewLabel();
    } else {
      // Perform some other action if the user clicks "No"
      Logger.log('User chose not to replace the label');
    }
  } else {
    createNewLabel();
  }
}

function createNewLabel() {
  var labelName = Browser.inputBox('Enter the label name'); // Prompt the user for the label name
  if (labelName) { // Make sure the user entered a label name
    var label = GmailApp.createLabel(labelName);
    PropertiesService.getScriptProperties().setProperty('labelName', label.getName());
  }
}


function startscript() {
  var scriptProperties = PropertiesService.getScriptProperties();
  var labelName = scriptProperties.getProperty('labelName');
  if (labelName) {
      Browser.msgBox("The UpNote API GW is now active. You can apply the Gmail label " + labelName + " to any email and it'll be added to UpNote in 10 minutes. Please close this window."); 

      ScriptApp.newTrigger('upNoteAPI')
    .timeBased().everyMinutes(10).create();

  } else {
    Browser.msgBox("You need to create a label first, afterwards run this script again."); 
    createNewLabel();
  }
}


function stop() {
  
  var triggers = ScriptApp.getProjectTriggers();
  
  for(var i in triggers) {
    ScriptApp.deleteTrigger(triggers[i]);
    Browser.msgBox("The Upnote API has been disabled. You can restart it anytime later."); 
  } 
}



function upNoteAPI() {
  
  try {
    
    var scriptProperties = PropertiesService.getScriptProperties();
    var label = scriptProperties.getProperty('labelName');
    Logger.log(label);

    var threads = GmailApp.search("label:" + label);
    Logger.log(threads.entries());
    var gmail = createLabel_(label);
    
    var message, raw, body, formula, status;
    
    for (var t in threads)  {
      
      status = "Sent to Upnote";
      
      message = threads[t].getMessages()[0];
      Logger.log(message.getId);
      threads[t].removeLabel(gmail);
      
      
      formula = threads[t].getPermalink();
      
      log_( status, message.getSubject(), formula, message.getFrom(),raw);
      send(message.getSubject(),formula,message.getFrom());
      
    }
  } catch (e) {Logger.log(e.toString())}
  
}

function createLabel_(name) {
  
  var label = GmailApp.getUserLabelByName(name);
  
  if (!label) {
    label = GmailApp.createLabel(name);
  }
  
  return label;
  
}

function log_(status, subject, view, from, raw) {
  var ss = SpreadsheetApp.getActive();
  ss.getActiveSheet().appendRow([status, subject, view, from ,raw]);
}



function checkKey() {
  var scriptProperties = PropertiesService.getScriptProperties();
  var apiKey = scriptProperties.getProperty('apiKey');
  if (apiKey) {
    var replace = Browser.msgBox('An API key is already stored. Do you want to replace it?', Browser.Buttons.YES_NO);
    if (replace == 'yes') {
      setKey();
    } else {
      // Perform some other action if the user clicks "No"
      Logger.log('User chose not to replace the key');
    }
  } else {
    setKey();
  }
}

function setKey() {
  var apiKey = Browser.inputBox('Enter the API key'); // Prompt the user for the label name
  if (apiKey) { // Make sure the user entered a label name
    var key = GmailApp.createLabel(apiKey);
    PropertiesService.getScriptProperties().setProperty('apiKey', key.getName());
  }
}


function send(subject, view, from ) {
  var scriptProperties = PropertiesService.getScriptProperties();
  var apiUrl = "http://hcbille.se:3000/create_note"; // replace with the API endpoint URL
  var apiKey = scriptProperties.getProperty('apiKey'); // replace with your API key
  var title = encodeURIComponent("Shared From gmail: " + from); // replace with the note title
  var text = encodeURIComponent(from + " : " + subject + "\n \n Link: " + view); // replace with the note text
  var notebook = encodeURIComponent("0. Inbox"); // replace with the notebook name

  var payload = "&title=" + title + "&text=" + text + "&notebook=" + notebook;

  var response = UrlFetchApp.fetch(apiUrl + "?apiKey=" + apiKey + payload);
  Logger.log(response.getContentText());
  Logger.log(response.getResponseCode())
}


