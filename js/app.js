$(document).ready(onReady);


function onReady(){
  $("#submit-button").on("click",callFB);
}


/*Utility functions to manipulate DOM*/
function formatedDate(str){
  return new Date(str).toDateString().substring(4)
}

function showInstructions(){
  $(".instructions").show();
}

function showError(){
  $(".api-err").show();
}

function showLoader(){
  $(".loader-container").show();
}

function hideLoader(){
  $(".loader-container").hide();
}

function hideInstructions(){
  $(".instructions").hide();
}

function hideError(){
  $(".api-err").hide();
}
function showData(){
  $(".main-container").show();
}

function hideData(){
  $(".main-container").hide();
}

function displayError(title,text){
  $(".api-err h2").text(title);
  $(".api-err p").text(text);
  showInstructions();
  showError();
}

function getOptions(){
  var result ="fields=picture.type(large)";
  $("input[type=checkbox]:checked").each(function(index,obj){
    result+=","+obj.value;
  });
  return result;
}//get the options chosen by user and return a string

function checkAndSetNoData(jqObj){
  jqObj.next("p.missing").empty();
  if(jqObj.html()===""){
    jqObj.next("p.missing").text("No Data. Please check options/permissions.");
  }
}


function setPicture(img,gender){
  var url = "img/male.png";
  if(img){
    url=img;
  }else if(gender==="female"){
    url = "img/female.png";
  }
  $("img#profile-img").attr("src",url);
}//display profile/sample img.

function setProfileInfo(jqObj,title,text){
  if(text){
    jqObj.append(('<dt class="col-md-4 col-lg-2">'+title+'</dt>'+'<dd class="col-md-8 col-lg-4">'+text+'</dd>'));
  }
}

function setContactInfo(jqObj,title,text){
  if(text){
    jqObj.append(('<dt class="col-md-4 col-lg-2">'+title+'</dt>'+'<dd class="col-md-8 col-lg-10">'+text+'</dd>'));
  }
}

function setInfo(response){

  var basic = $("#basic-info").empty();
  var contact = $("#contact-info").empty();
  var about = $(".about-text").empty();

  setProfileInfo(basic,"Name",response.name); 
  setProfileInfo(basic,"Gender",response.gender);
  if(response.birthday) setProfileInfo(basic,"D.O.B.",formatedDate(response.birthday));
  if(response.hometown) setProfileInfo(basic,"Hometown",response.hometown.name);
  if(response.friends) setProfileInfo(basic,"Friends",response.friends.summary.total_count);
  if(response.religion) setProfileInfo(basic,"Religion",response.religion.slice(0,-3));
  if(response.political) setProfileInfo(basic,"Political",response.political.slice(0,-3));

  
  setContactInfo(contact,"Email",response.email);
  setContactInfo(contact,"Website",response.website);

  
  if(response.about){
    about.append(response.about);
  }

  checkAndSetNoData(basic);
  checkAndSetNoData(contact);
  checkAndSetNoData(about);
}//Removes old data and fills new data

function setEdu(dataArray){
  var list = $(".edu-list").empty();

  if (dataArray){
    dataArray.forEach(function(item){
    list.append("<li>Studied " + (item.concentration?item.concentration[0].name+" ":"") +"at "+ item.school.name+"</li>");
  });
  }  

  checkAndSetNoData(list);
}

function setWork(dataArray){
  var list = $(".work-list").empty();

  if (dataArray){
    dataArray.forEach(function(item){
    var html;
    if (item.end_date) {
      html="<li>Worked at "+item.employer.name+" as "+item.position.name+" from "+
        formatedDate(item.start_date)+" to "+ formatedDate(item.end_date)+".</li>";

    }else{
      html="<li>Working at "+item.employer.name+" as "+item.position.name+" since "+
        formatedDate(item.start_date) +".</li>";
    } 
    list.append(html);
  });
  }

  checkAndSetNoData(list);
}

function setRelation(status){
  var rel = $("p#rel-status").empty();
  if(status) rel.append(status);
  checkAndSetNoData(rel);
}

function createPost(jqObj,myPost){
  //only make html if the post has any data to show.
  if(myPost&&(myPost.full_picture||myPost.story||myPost.message)){
    var html = '<div class="post card col-md-5">';
    if(myPost.full_picture){
      html+='<a href="'+ myPost.full_picture +'" target="_blank"><img class="card-img-top" src="'+ myPost.full_picture +'"></a>';
    }
    html+='<div class="card-body">';
    if (myPost.story){
      html+='<p class="card-title">'+myPost.story+'</p>';
    }
    if(myPost.message){
      html+='<p class="card-text">'+myPost.message+'</p>';
    }
    html+='</div></div>';
    jqObj.append(html);
  }//card for post added to html.
}

function setPosts(postJSON){
  var postContainer= $(".post-container").empty();

  if (postJSON && postJSON.data) {
    postJSON.data.forEach(function(myPost){
      createPost(postContainer,myPost);
    });
  }

  checkAndSetNoData(postContainer);
}


/*Functions to handle Ajax events*/

function beforeStart(){
  //disable button to prevent parallel calls
  $("button#modal-toggle").attr("disabled","disabled");

  hideData();
  showLoader();  
}

function success(response){

  setPicture(response.picture.data.url,response.gender);
  setInfo(response);
  setEdu(response.education);
  setWork(response.work);
  setRelation(response.relationship_status);
  setPosts(response.posts);

  //data is now ready, lets show it!
  hideInstructions();
  hideError();
  showData();
}


function error(response,errorType,errorMessage){
  // console.log(response.responseJSON.error, errorType, errorMessage);
  //if error type is not null then process further
  if (errorType){
    //incase of timeout
    if (errorType==="timeout") {
      displayError("Uff!", "Facebook took too long to respond, they should totaly upgrade their servers. Try Again.");
    }
    //incase of invalid token
    else if(response.responseJSON.error.type==="OAuthException"){
      displayError("Wrong Token", response.responseJSON.error.message);
    }
    else{
      displayError("Oops!", "Looks like something went wrong. Try Again.");
    }
  }
  //if type is null due to some reason, display generic error message
  else{
      displayError("Oops!", "Looks like something went wrong. Try Again.");
  }
}

function complete(){
  $("button#modal-toggle").removeAttr("disabled");
  hideLoader();
}

/*Ajax call*/
function dataAjax(url){
  //handlers for ajax call
  var settings ={
      success: success,
      beforeSend: beforeStart,
      timeout: 3000,
      error: error,
      complete:complete
    };
  console.log(url);  
  $.ajax(url,settings);
}

/*Function to initiate ajax call*/
function callFB(){
  //read and set token as global variable
  var token = $("#access_token").val();

  //check if token is present
  if(token){
    var url = "https://graph.facebook.com/me?access_token=";
    hideError();
    url+= token + "&" + getOptions();
    dataAjax(url);
  }
  else{
    displayError("Huh?","Did you even read the steps? They are just up there. Please read step 2. Thank You.");
  }
}