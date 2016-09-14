

//Prevent more than one readio button from being selected


var ele = document.getElementsByName("bandmember");
   for(var i=0;i<ele.length;i++)
      ele[i].checked = false;
