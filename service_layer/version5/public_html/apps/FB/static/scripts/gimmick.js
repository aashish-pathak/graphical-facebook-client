var ENV,layoutContainer,debug;
var mainLayout;
var w = window.innerWidth,
    h = window.innerHeight;
var link,node;
var minLinkDistance=0,scale=1;
var margins = 10,padding = 20;
var ticker,counter,showingProfile = false;
var friends,me,nodes;
var strings = ["We Are Working.","Please wait while we fetch your closest friends","Working","Working.","Working..","Working...","Still Working",
               "We are really sorry!!","We will be faster next time","Almost done","really almost done","just a few more moments",
    	       "We will make sure, you don't regret the wait","Yep! It's that good","About to be done","Do let us know, how it is",
	           "We are building something really from scratch","Your likes","Your posts","Your messages","Your Tags",
	           "These things tell us who is close to you","It's all you","You'll see",":)",":D",":p",";)",";p","That was something","!!!",
               "We will be there","Don't worry","You can brew yourself a cup of coffee","We will keep track of thing while this is still working",
               "Its probably your first time","So we are building your profile from scratch",":D"];

function weAreWorkingAnimation(){
	counter =0 ;
	var anim = d3.select("body").append("div").attr("id","overlay").append("svg").attr("width",w).attr("height",h);
	console.log("Wait ticker initiated");
	anim = anim.append("text")
	      .attr("class", "tickers")
              .attr("dy", ".35em")
              .attr("text-anchor","middle")
              .attr("x", w/2)
              .style("fill-opacity", 0)
	      .style("font-size","0.5em")
	      .style("fill","#666666");
	
	function textUpdate(data){
	     	  
	  anim.attr("y",h/2 - 160)
		.text(data)
		.transition()
			.duration(750)
			.attr("y",h/2)
			.style("fill-opacity",1)
			.each("end",function() {
				anim.transition()
					.delay(1000)
					.duration(750)
					.attr("y",h/2+160)
					.style("fill-opacity",0);
				});
	}	
	
	console.log("Ticker rolling starts");
	
	textUpdate(strings[counter++]);
	   
	ticker = setInterval(function() {  textUpdate(strings[counter]); counter=(++counter)%strings.length;  }, 4000);

}

function initializeData(uid,accessToken,callback){
    console.log("Data fetching initialized");
    weAreWorkingAnimation();
    $.getJSON($SCRIPT_ROOT + '/_getProfile', { a: accessToken }, function(data) {
                console.log("User Id : " + data.id);
        me = data;
	me.userStatus = me.status || {"message" : " :( <p> FACEGRAPH : 404 <p> Something is terribly wrong. We Are Working on it. <p>Sorry!!  " , "updated_time" : ""};
        $.getJSON($SCRIPT_ROOT + '/_getCloseFriends', { a: accessToken, b: me.id }, function(response) {
	        console.log("data fetched");
		ticker = window.clearInterval(ticker);
		d3.selectAll("#overlay").remove();
		console.log("tickers terminated");
                friends = response;

	        for(var i=0; i <friends.length ; i++)
		      friends[i].userStatus = friends[i].status || {"message" : " :( <p> Some is terribly wrong. We Are Working on it. Sorry!!  " , "updated_time" : ""};

                init();
        });
    });
}

function NewsFeeds(person){                                             //News feeds Object
    var that=this;
    this.id = person.id;
    
    this.initiate = function(container){                                //Initiate news feeds
    
    }
}

function AboutMe(person,container){
    var that=this;
    this.id = person.id;
    this.me = new Object();
    this.infoAvailable = false;
    
    
    this.initiate = function(container){
            that.container = container.append("g")
                                    .attr("id","aboutMe");
                                    
            that.miniView();
        }

    this.fetchAboutMe = function(callback) {
        var fetchString = "birthday,cover,education,location,gender,hometown,interested_in,link,name,political,relationship_status,work,interests,mutualfriends";
        
        $.getJSON($SCRIPT_ROOT + '/_getData', { a: accessToken, b: that.id, c:fetchString }, function(response){
            that.me.birthday = response.birthday || undefined;
            if(response.cover)
                that.me.coverPic = {"source" : response.cover.source , "offsetY" : response.cover.offset_y} ;
            that.me.gender = response.gender  || undefined;
            if(response.hometown)
                that.me.hometown = response.hometown.name  || undefined;
                
            that.me.interestedIn = response.interested_in  || undefined;                            //Array
            that.me.profileLink = response.link;
            that.me.name = response.name  || undefined;
            that.me.politicalViews = response.political  || undefined;
            that.me.relationship_Status = response.relationship_status  || undefined;
            that.me.work = response.work  || undefined;                                             //[{employer : {id,name} , position : {id, name}}]
            if(response.interests)
                that.me.interests = response.interests.data  || undefined;                          //[(category,name,created_time,id}]
            if(response.mutualfriends)
                that.me.mutualFriends = response.mutualfriends.data  || undefined;                  //[{name,id}]
            if(response.education)
                that.me.education = response.education;
            if(response.location)    
                that.me.location = response.location.name || undefined;
            that.infoAvailable = true;
            callback();
        });
    }

    this.miniView = function(){
        if(!that.infoAvailable){
            console.log("About me : Info not available. Fetching Now.");
            that.fetchAboutMe(that.miniView);
        } else{
            var content = "<a href='" + that.me.profileLink + "'><h1>"+ that.me.name +"</h1></a><p><p>";
            
            if(typeof that.me.work != undefined && that.me.work){
                content += "Works";
                if(typeof that.me.work[0].position != undefined && that.me.work[0].position)
                    content += " as " + that.me.work[0].position.name;
                content += " at " + that.me.work[0].employer.name + "<p>";
            }
                
            if(typeof that.me.education != undefined && that.me.education){
                content += "Studied at ";
                var school,lastYear = 0;
                for(var i=0; i<that.me.education.length ; i++)
                    if(typeof that.me.education[i].year != undefined && that.me.education[i].year)
                        if(lastYear < parseInt(that.me.education[i].year.name)){
                            lastYear = parseInt(that.me.education[i].year.name);
                            school = that.me.education[i].school.name;
                        }
            
                content += school + " till " + lastYear + "<p>";
            }   
                
            if(typeof that.me.location != undefined && that.me.location) 
                content +="Lives in " + that.me.location + "<p>";
                
            if(typeof that.me.hometown != undefined && that.me.hometown)
                content += "And is from " + that.me.hometown;
                

            
            console.log("About Me, Content : " + content);
            
            console.log("About me : Layout generated");
            that.container.append("rect")
                .attr("x",w/2 - 632)
                .attr("y",50)
                .attr("width", 600)
                .attr("height", h - 190)
                .attr("mask","url(#spriteCardsOverlap)")
                .style("fill","#ffffff");
            
            that.container.append("text")
                .attr("x",w/2 - 468)
                .attr("y",150)
                .attr("width", 275)
                .style("fill","#373737")
                .style("font-size","91px")
                .text("About");
                
            var card = that.container.append("g");

            card.append("rect")
                .attr("x",w/2-550)
                .attr("y",220)
                .attr("width",437)
                .style("fill","#000000")
                .style("filter","url(#spriteFilterOuterCircleBlur)");
            
            card.append("rect")
                .attr("x",w/2-550)
                .attr("y",220)
                .attr("width",437)
                .style("fill","#ffffff");
                
            that.container.append("foreignObject")
                    .attr("id","aboutmeCardContent")
                    .attr("x",w/2-525)
                    .attr("y",250)
                    .attr("width",380)
                    .append("xhtml:div")
                        .attr("id","aboutmeCard")
                        .attr("width",380)
                        .style("color","#373737")
                        .html(content);
            
            card.selectAll("rect").attr("height",$("#aboutmeCard").height() + 50);
            d3.select("#aboutmeCardContent").attr("height",$("#aboutmeCard").height() + 50);
            
            that.container.append("text")
                    .attr("x",w/2-380)
                    .attr("y",h-150)
                    .style("fill","#373737")
                    .text("<<    Expand    >>");
        }
    }
    
    this.expandedView = function(container){
    
    }

}



function CameraRoll(person){                                            //Camera Roll Object
    var that=this;
    this.id = person.id;
    this.lastx;
    this.displayData;
    this.userImages = new Object();
    this.userImages.data = new Array();
    this.visibleImagesCount;
    this.container;
    this.showContainer;
    this.fetching = false;
    this.currentlyShowing = -1;
    
    this.slideShow = function(picIndex){
                
        var pic,index;
        
        that.displayData.forEach(function(d,i){ 
                    if(d.index == picIndex) { 
                        pic = d; 
                        index = i; 
                    }
               });
    
        if(pic !== undefined){
        
        that.currentlyShowing = picIndex;
        
      
        that.showContainer.select("#theater").remove();
        var show = that.showContainer.append("g")
                    .attr("id","theater");
        var width=0,height=0;
        
        if(pic.width >= pic.height){
            width = w >= 780 ? 720 : w - 60;
            height = pic.height/pic.width * width;
           
        } 
        
        if(pic.height > pic.width || height > h - 100){
            height = h-100;
            width = pic.width/pic.height * height;
        }
        
        show.append("rect")
            .attr("x",0)
            .attr("y",0)
            .attr("height",h)
            .attr("width",w)
            .style("fill","rgba(0,0,0,0.5)")
            .on("click",function() { 
                    that.currentlyShowing = -1;
                    show.remove(); 
             });
            
        show.append("rect")
            .attr("x", (w - width)/2 - 5)
            .attr("y", ((h - height - 100)/2) - 5)
            .attr("width",width + 5)
            .attr("height",height + 5)
            .style("fill","#000000")
            .style("filter","url(#spriteFilterOuterCircleBlur)");
            
        show.append("image")
            .attr("x", (w - width)/2)
            .attr("y", ((h - height - 100)/2))
            .attr("width",width)
            .attr("height",height)
            .attr("xlink:href",pic.full);
            
        show.append("rect")
            .attr("x", (w - width)/2)
            .attr("y", ((h - height - 100)/2))
            .attr("width",width/3)
            .attr("height",height)
            .style("fill","rgba(0,0,0,0)")
            .on("click",function(){
                    if(index > 0)
                        that.slideShow(that.displayData[index - 1].index);
                    else
                        that.reverseRoll();
            });
            
         show.append("rect")
            .attr("x", (w - width)/2 + width/3)
            .attr("y", ((h - height - 100)/2))
            .attr("width", 2*width/3)
            .attr("height",height)
            .style("fill","rgba(0,0,0,0)")
            .on("click",function(){
                    if(index < that.displayData.length - 1)
                        that.slideShow(that.displayData[index + 1].index);
                    else
                        that.forwardRoll();
            });
            
    }
    }
    
    this.forwardRoll = function(){

        if(that.lastx + 2 == that.userImages.data.length && that.fetching == false)
            that.fetchImages(null,that.userImages.next);

        if(that.lastx < that.userImages.data.length){
            var data = new Array();
               
            that.lastx++;
    
            for(var i=that.visibleImagesCount ; i>0 ; i--){
                data.push(that.userImages.data[that.lastx - i]);
            }
        
            that.displayData = data;
            
            that.redraw("forward");
            
            if(that.currentlyShowing != -1){
                var i;
                for(i=0; i<that.displayData.length ; i++)
                    if(that.displayData[i].index == that.currentlyShowing){
                        that.slideShow(that.displayData[i+1].index);
                        break;
                    }
                 
                 if(i>=that.displayData.length)   
                        that.slideShow(that.displayData[0].index);  
            }              
        }
    }
    
    this.reverseRoll = function(){
    
        if(that.lastx > that.visibleImagesCount){
            var data = new Array();
            that.lastx--;
            for(var i=that.visibleImagesCount ; i>0 ; i--){
                data.push(that.userImages.data[that.lastx - i]);
            }

            that.displayData = data;
        
            that.redraw("reverse");    
            
            if(that.currentlyShowing != -1){
                var i;
                for(i=0; i<that.displayData.length ; i++)
                    if(that.displayData[i].index == that.currentlyShowing){
                        that.slideShow(that.displayData[i-1].index);
                        break;
                    }
                 
                 if(i>=that.displayData.length)   
                        that.slideShow(that.displayData[that.displayData.length - 1].index);  
            }
        }
    }
    
    this.initializeDisplayData = function(){
        var data = new Array();
        console.log(that.visibleImagesCount + " < " + that.userImages.data.length + "?");
        if(that.visibleImagesCount < that.userImages.data.length){
            console.log("true");
            for(var i=0;i<that.visibleImagesCount ; i++)
                data.push(that.userImages.data[i]);
            that.lastx = Math.floor(w/110);    
            that.displayData = data;
            that.redraw();
        }
        else {
            console.log("false");
            that.fetchImages(that.initializeDisplayData)
        }
    }
    
    this.redraw = function(roll){
        var sign;
        var before;        

        if(roll == "forward" || roll === undefined){
            sign=1;
        } else {
            sign = -1;
            before = "image";
        }

        var clip = that.container.selectAll(".picClipper")
                        .data(that.displayData,function(d){ return d.index; });
            
        var images = that.container.selectAll(".rollImage")
                        .data(that.displayData,function(d){  return d.index; });
                            
        //enter

        clip.enter().insert("g",before)
                .attr("class","picClipper") 
                .append("clipPath")
                    .attr("id",function(d){ return "picClip" + d.id; })    
                    .append("rect")
                        .attr("x", function(d,i) { return ((i+sign)*110 + 25); })
                        .attr("y" , h-85)
                        .attr("width", 100)
                        .attr("height" , 75);

 
        images.enter().insert("image",before)
               .attr("class","rollImage")
               .attr("height", function(d) { return d.height;})
               .attr("width", function(d) { return d.width; })
               .attr("x", function(d,i) {return ((((i+sign) * 110) + 25) - (d.width - 100)/2); })
               .attr("y", h - 85)
               .attr("xlink:href", function(d) { return d.thumbnail; })
               .attr("preserveAspectRatio","none")	
               .attr("clip-path", function(d) { return "url(#picClip" + d.id + ")";})
               .on("click",function(d,i){ that.slideShow(d.index); });        

        //update
 
        clip.select("rect").transition()
                .attr("x", function(d,i) { return ((i)*110 + 25); });//;function(){ return "transition(" + (-110 * sign) + ",0)";});

        images.transition()
                .attr("x", function(d,i) {return (((i * 110) + 25) - (d.width - 100)/2); });


        //exit            
            
        clip.exit().transition()
                .attr("transform", "transition(-110,0)")//function(){ return "transition(" + (-220*sign) + ",0)";})
                .remove();
 
        images.exit().transition()
                .attr("x", function(d,i) {return ((((i-sign) * 110) + 25) - (d.width - 100)/2); })
                .remove();
    }
    
    
    this.fetchImages = function(callback,next){
        that.fetching = true;
        var fetchString = "photos.limit(25)";
        fetchString += next !== undefined ? ".until(" + next + ")" : "";
        
        $.getJSON($SCRIPT_ROOT + '/_getData', { a: accessToken, b: that.id, c:fetchString }, function(response){

                var arrayLength = response.photos.data.length;
                var height,width,next,i;
                var index = that.userImages.data.length;
                                
                for(i = 0 ; i < arrayLength ; i++){
                    var pic = new Object();
                    pic.id = response.photos.data[i].id;
                    pic.index = index + i;
                    pic.from = response.photos.data[i].from;
                    pic.thumbnail = response.photos.data[i].picture;
                    pic.full = response.photos.data[i].source;
                    pic.height = response.photos.data[i].height;
                    pic.width = response.photos.data[i].width;
                    pic.createdTime = response.photos.data[i].created_time;
                    pic.comments = response.photos.data[i].comments != undefined ? response.photos.data[i].comments.data : undefined;
                    if(pic.width >= pic.height){
                        height = 75;
                        width = pic.width/pic.height * height;
                        if(width < 100)                                //Not Optimized. Stretches out thumbnails(unwanted). To do : optimize to preserve aspect ratio
                            width = 100;
                    } else {
                        width = 100;
                        height = pic.height/pic.width * width;
                        if(height < 75)                                //Not Optimized. Stretches out thumbnails(unwanted). To do : optimize to preserve aspect ratio
                            height = 75;
                    }
                    pic.height = height;
                    pic.width = width;

                    that.userImages.data.push(pic);
                }
                
                next = response.photos.paging.next.split("&");
                
                for(i=0; i<next.length ; i++)
                    if(next[i].indexOf("until") != -1)
                        break;
                
                if(i<next.length)
                    that.userImages.next = next[i].split("=")[1];
                else
                    delete that.userImages.next;
                that.fetching = false;
                callback();
            });
       }
        
    this.initiate = function(container){                                //Initiate Camera Roll
        that.visibleImagesCount = Math.floor(w/110);
    
        var roll = container.append("g")
                        .attr("id","cameraRoll");
            
            that.showContainer = roll.append("g")
                    .attr("id","theater");
                
            roll.append("rect")
                .attr("x",0)
                .attr("y", h-87)
                .attr("height",79)
                .attr("width",w)
                .style("fill","rgb(255,255,255)")
                .style("filter","url(#spriteFilterOuterCircleBlur)");            
            
            roll.append("rect")
                .attr("x",0)
                .attr("y", h-87)
                .attr("height",79)
                .attr("width",w)
                .style("fill","rgb(0,0,0)");
            
            that.container = roll.append("g")
                .attr("id","picsContainer");

         
            roll.append("rect")
                .attr("x",0)
                .attr("y",h - 90)
                .attr("width",30)
                .attr("height",85)
                .style("fill","rgba(0,0,0,0.8)")
                .on("click",function() { that.reverseRoll(); });
                        
            roll.append("rect")
                 .attr("x", w - 30)
                 .attr("y",h - 90)
                 .attr("width",30)
                 .attr("height",85)
                 .style("fill","rgba(0,0,0,0.8)")
                 .on("click", function() { that.forwardRoll(); } );
                        
            roll.append("path")
                 .attr("d","M 5 " + (h-50) + " l 5 5 l 0 -10 Z")
                 .style("fill","rgba(255,255,255,0.8)")
                 .on("click",function() { that.reverseRoll(); });
                        
            roll.append("path")
                 .attr("d","M " + (w-5) + " " + (h-50) + " l -5 5 l 0 -10 Z")
                 .style("fill","rgba(255,255,255,0.8)")
                 .on("click", function() { that.forwardRoll(); } );              
                        
        that.initializeDisplayData();
    }
}

function User(person){
    var that=this;
    this.id = person.id;
    this.linkStats = person.score;
    this.fullName = person["name"];
    this.gender = person.gender;
    this.webLink = person.link;
    this.relationshipStatus = person.relationship_status;
    this.displayPic = person.picture;
    this.userStatus = person.userStatus;
    this.radius = 100;
    this.theater = new CameraRoll(this);
    this.newsFeeds = new NewsFeeds(this);
    this.aboutMe = new AboutMe(this);
    
    this.generateTheater = function(container) {
        that.theater.initiate(container);
    }
    
     
    this.generateProfileLayout = function(){
	
	that.removeStatus();	
	
	showingProfile = true;

	mainLayout.stop();

	d3.selectAll(".sprite" + that.id).transition().attr("opacity",1);

	layoutContainer.transition()
            .attr("transform","translate(" + (w/2 - that.x) + "," + (h/4 - that.y) + ")");
                
        var profileContainer = ENV.append("g")
                                .attr("id","profileLayout");
        
        profileContainer.append("rect")
            .attr("x",0)
            .attr("y",0)
            .attr("height",h)
            .attr("width",w)
            .attr("mask","url(#profileMask)")
            .style("fill","none")
            .transition()
                .style("fill","rgba(0,0,0,0.8)");
                
        profileContainer.append("rect")
            .attr("x",w/2-15)
            .attr("y",0)
            .attr("width",30)
            .attr("height",h/4)
            .attr("mask","url(#spriteCardsOverlap)")
            .style("fill","url(#profileCentralBarTop)");
        
        
        profileContainer.append("rect")
            .attr("x",w/2-15)
            .attr("y",h/4)
            .attr("width",30)
            .attr("height", 3*h/4 - 94 )
            .attr("mask","url(#spriteCardsOverlap)")
            .style("fill","url(#profileCentralBarBottom)");

        profileContainer.append("circle")
            .attr("cx",w/2)
            .attr("cy",h/4)
            .attr("r", 100*scale)
            .style("fill","rgba(0,0,0,0)")
            .on("click",function(){ that.destroyProfile(); });
            
        profileContainer.append("line")
            .attr("x1",w/2-15)
            .attr("y1",0)
            .attr("x2",w/2-15)
            .attr("y2",h/4)
            .attr("mask","url(#spriteCardsOverlap)")
            .style("stroke","url(#profileCentralBarTop)")
            .style("stroke-width",2);
            
        profileContainer.append("line")
            .attr("x1",w/2+15)
            .attr("y1",0)
            .attr("x2",w/2+15)
            .attr("y2",h/4)
            .attr("mask","url(#spriteCardsOverlap)")
            .style("stroke","url(#profileCentralBarTop)")
            .style("stroke-width",2);

        profileContainer.append("line")
            .attr("x1",w/2-15)
            .attr("y1",h/4)
            .attr("x2",w/2-15)
            .attr("y2",h - 94)
            .attr("mask","url(#spriteCardsOverlap)")
            .style("stroke","url(#profileCentralBarBottom)")
            .style("stroke-width",2);
            
        profileContainer.append("line")
            .attr("x1",w/2+15)
            .attr("y1",h/4)
            .attr("x2",w/2+15)
            .attr("y2",h - 94)
            .attr("mask","url(#spriteCardsOverlap)")
            .style("stroke","url(#profileCentralBarBottom)")
            .style("stroke-width",2);            

        profileContainer.append("line")
            .attr("x1",0)
            .attr("y1",h - 94)
            .attr("x2",w)
            .attr("y2",h - 94)
            .attr("mask","url(#spriteCardsOverlap)")
            .style("stroke","#00a2ff")
            .style("stroke-width",1);

        that.generateTheater(profileContainer);
        that.aboutMe.initiate(profileContainer);
        
    }
    
    this.destroyProfile = function(){
	    showingProfile = false;
        d3.selectAll(".sprite" + that.id).transition().attr("opacity",0); 
        d3.select("#profileLayout").remove();
        layoutContainer.transition()
            .attr("transform","");
            
        mainLayout.resume();
    }
    
    this.removeStatus = function(){
        d3.selectAll(".spriteUserStatus").remove();
    }
    
    this.showStatus = function(){
    	var width = 300;	
    	var height = width/2;
    	
    	var topSpaceAvailable = true;
    	var leftRightAlign = "middle";
    	
    	if((that.y - that.radius*scale) < height + 20)                              //Decides whether to generate bubble on top or bottom of sprite
    	    topSpaceAvailable = false;
    	    
    	if((that.x - that.radius*scale) < 200)                              //Decides bubble alignment. Default : middle. On space availability : left or right
    	    leftRightAlign = "right";
    	else if((w-that.x - that.radius * scale) < 200)
    	    leftRightAlign = "left";
    	    
	    var statusObject = ENV.append("g")
		    .attr("class","spriteUserStatus")
		    .attr("transform","translate(" + that.x + "," + (topSpaceAvailable ? (that.y - that.radius * scale) : (that.y + that.radius * scale)) + ")");
		    
		statusObject.append("path")
           .attr("class","spriteUserStatusBackground")
           .attr("d",function(){
                var rightSideLength,leftSideLength;
                if(leftRightAlign === "middle")
                    leftSideLength = rightSideLength = width/2 - 5;
                else if(leftRightAlign === "right")
                    leftSideLength = width - 10 - (rightSideLength = width - that.radius * scale - 5);
                else
                    leftSideLength = width - 10 - (rightSideLength = that.radius * scale - 5);  
                    
                if(topSpaceAvailable)
                    return  "M 0 0 l 5 -10 l " + rightSideLength + " 0 l 0 -" + height + " l -" + width + " 0 l 0 " + height + " l " + leftSideLength + " 0 Z";
                else
                    return  "M 0 0 l 5 10 l " + rightSideLength + " 0 l 0 " + height + " l -" + width + " 0 l 0 -" + height + " l " + leftSideLength + " 0 Z";
                })
           .style("fill","white");
    
         var statusContainer = statusObject
                .append("foreignObject")
                    .attr("x",function(){
                        if(leftRightAlign === "middle")
                            return -(width/2 - 5);
                        else if(leftRightAlign === "left")
                            return -(width - that.radius * scale - 5);
                        else
                            return -(that.radius * scale - 5);
                        })
                    .attr("y",topSpaceAvailable ? -(height - 5) : 15)
                    .attr("width","290")
		    .attr("height",height - 10);
                    
          statusContainer.append("xhtml:div")
                    .attr("class","spriteUserStatus")
                    .attr("id","status" + that.id)
                    .style("width","290px")
                        .html((that.userStatus.message != undefined ? that.userStatus.message : "NA") +
			                        "<p>" + 
			                  (that.userStatus.updated_time != undefined ? that.userStatus.updated_time : "NA"));


    }

    this.generateSprite = function (env,scale){
        scale = typeof scale !== 'undefined' ? scale : 1;
        var container = d3.select(env);
        var picMinAttr = this.displayPic.height <= this.displayPic.width ? "height" : "width";
        var picHeight,picWidth,minSize = 112*scale;
        picHeight = minSize;
        picWidth = this.displayPic.width/this.displayPic.height * minSize;
	picWidth = (picWidth >= minSize) ? picWidth : minSize;
  
        var thisSprite = container.append("g")
            .attr("id","spriteID" + that.id);	
			
        
        thisSprite.append("circle")
            .attr("class","spriteOuterCircle sprite" + that.id)
            .attr("cx",0)
            .attr("cy",0)
            .attr("r",that.radius*scale)
            .style("fill","none")
            .style("stroke","#3690ff")
            .style("stroke-width","10")
            .style("stroke-opacity",1)
            .style("filter","url(#spriteFilterOuterCircleBlur)");


        thisSprite.append("circle")
            .attr("class","spriteOuterCircle sprite" + that.id)
            .attr("cx",0)
            .attr("cy",0)
            .attr("r",(that.radius-2) * scale)
            .style("fill","none")
            .style("stroke","#3690ff")
            .style("stroke-width","5");

        thisSprite.append("circle")
            .attr("class","spriteBackgroundCircle")
            .attr("cx",0)
            .attr("cy",0)
            .attr("r",(that.radius-2) * scale)
            .style("fill","url(#spriteFilterBackgroundGradient)")
            .style("stroke","none")
            .style("fill-opacity","1");
 
        var infoPath = d3.svg.arc()
            .innerRadius((that.radius-36) * scale)
			.outerRadius((that.radius - 36) * scale)
		    .startAngle(-1.5)
		    .endAngle(1.5);
     
        thisSprite.append("path")
	    .attr("id","spriteInfoCircle" + that.id)
	    .style("fill", "brown")
	    .style("stroke","brown")
	    .style("stroke-width","2px")
	    .attr("d", infoPath)
	    .on("click",function() {
		    	that.generateProfileLayout();
	    	    });
			

        thisSprite.append("text")
            .attr("class","spriteUserName")
            .attr("dy","-4px")
            .style("stroke","#666666")
            .style("font-size","0.8em")
            .style("font-weight","normal")
            .style("letter-spacing","1px")
            .on("click",function() {
		    	that.generateProfileLayout();
	    	    })
            .append("textPath")
                .attr("text-anchor","middle")
                .attr("startOffset","25%")
                .attr("xlink:href","#spriteInfoCircle" + that.id)
                .text(function() { return that.fullName.length > 15 ? that.fullName.substring(0,13) + ".." : that.fullName; });
 
        thisSprite.append("circle")
            .attr("class","spritePhotoBackgroundCircle")
            .attr("cx",0)
            .attr("cy",0)
            .attr("r",(that.radius - 38) * scale)
            .style("fill","white")
            .on("click",function() {
		    	that.generateProfileLayout();
	    	    });

        thisSprite.append("clipPath")
            .attr("class","spriteUserPhotoClipper sprite" + that.id)
            .attr("id","clipCircle" + that.id)
            .append("circle")
                .attr("cx",0)
                .attr("cy",0)
                .attr("r",minSize/2)
                .attr("transform","translate(" + minSize/2 + "," + picHeight/2 + ")");

        thisSprite.append("image")
            .attr("class","spriteUserPhoto")
            .attr("x",0)
            .attr("y",0)
            .attr("xlink:href",that.displayPic.url)
            .attr("width",picWidth)
            .attr("height",picHeight)
	        .attr("preserveAspectRatio","none")	
            .attr("clip-path","url(#clipCircle" + that.id + ")")
            .attr("transform","translate(-" + minSize/2 + ",-" + picHeight/2 + ")")
	        .on("click",function() {
		    	that.generateProfileLayout();
	    	    })
	        .on("mouseover",function(){
                    d3.selectAll(".sprite" + that.id).transition().attr("opacity",1); 
                    d3.selectAll(".link.user" + that.id).transition().duration(1000).style("stroke","#47a1ff").style("stroke-width","5px");
 		            that.showStatus();
                })
            .on("mouseout",function(){
                    if(!showingProfile)
			            d3.selectAll(".sprite" + that.id).transition().attr("opacity",0);
                    d3.selectAll(".link.user" + that.id).transition().duration(1000).style("stroke","#9ecae1").style("stroke-width","1.5px");
                    that.removeStatus();
                });
        
        d3.selectAll(".sprite" + that.id).attr("opacity",0);
    };
}


var init = function(){
    var elements;
    scale = 0.6;

    nodes = new Array();

    ENV = d3.select("body")
		.append("div")
			.attr("id","svgContainer")
			.append("svg")
				.attr("height","100%")
				.attr("width","100%");
					
    layoutContainer = ENV.append("g");
						

    var defs = ENV.append("defs");
	
	defs.append("filter")
			.attr("id","spriteFilterOuterCircleBlur")
				.append("feGaussianBlur")
					.attr("stdDeviation","3.5");

    elements = defs
        		.append("radialGradient")
		        	.attr("id","spriteFilterBackgroundGradient")
		        	.attr("cx","50%")
		        	.attr("cy","50%")
		        	.attr("fx","50%")
		        	.attr("fy","50%")
		        	.attr("r","100%");

    elements.append("stop")
		.attr("stop-color","#e0e0e0")
		.attr("stop-opacity","1")
		.attr("offset","0%");

    elements.append("stop")
		.attr("stop-color","#ffffff")
		.attr("stop-opacity","1")
		.attr("offset","60%");    

    elements = defs.append("mask")
        .attr("id","profileMask")
        .attr("maskUnits","userSpaceOnUse")
        .attr("x","0%")
        .attr("y","0%")
        .attr("width","100%")
        .attr("height","100%");
        
    elements.append("rect")
        .attr("x","0%")
        .attr("y","0%")
        .attr("height","100%")
        .attr("width","100%")
        .style("fill","rgba(255,255,255,1)");
        
    elements.append("circle")
        .attr("cx",w/2)
        .attr("cy",h/4)
        .attr("r", (scale*100 + 10))
        .style("fill","rgba(0,0,0,1)");
    
     elements = defs.append("mask")
        .attr("id","spriteCardsOverlap")
        .attr("maskUnits","userSpaceOnUse")
        .attr("x","0%")
        .attr("y","0%")
        .attr("width","100%")
        .attr("height","100%");

    elements.append("rect")
        .attr("x","0%")
        .attr("y","0%")
        .attr("height","100%")
        .attr("width","100%")
        .style("fill","rgba(255,255,255,1)");
        
    elements.append("circle")
        .attr("cx",w/2)
        .attr("cy",h/4)
        .attr("r", (scale*100 + 20))
        .style("fill","rgba(0,0,0,1)");
    
    elements = defs.append("linearGradient")
        .attr("id","linearDarkToTransGradient");
        
    elements.append("stop")
        .attr("offset",0)
        .style("stop-color","#000000")
        .style("stop-opacity",0.9);
        
    elements.append("stop")
        .attr("offset",1)
        .style("stop-color","#000000")
        .style("stop-opacity",0);
        
    
    elements=defs.append("linearGradient")
        .attr("id","cameraRollLeftTabGradient")
        .attr("xlink:href","#linearDarkToTransGradient")
        .attr("x1",0)
        .attr("y1",0)
        .attr("x2",30)
        .attr("y2",0)
        .attr("gradientUnits","userSpaceOnUse");
   
    elements=defs.append("linearGradient")
        .attr("id","cameraRollRightTabGradient")
        .attr("xlink:href","#linearDarkToTransGradient")
        .attr("x1","100%")
        .attr("y1","0%")
        .attr("x2","0%")
        .attr("y2","0%")
        .attr("gradientUnits","userSpaceOnUse");
    
    elements = defs.append("linearGradient")
        .attr("id","linearBlueToTransGradient");
        
    elements.append("stop")
        .attr("offset",0)
        .style("stop-color","#00a2ff")
        .style("stop-opacity",0.9);
        
    elements.append("stop")
        .attr("offset",1)
        .style("stop-color","#00a2ff")
        .style("stop-opacity",0);
        
    elements=defs.append("linearGradient")
        .attr("id","profileCentralBarTop")
        .attr("xlink:href","#linearBlueToTransGradient")
        .attr("x1",0)
        .attr("y1",0)
        .attr("x2",0)
        .attr("y2",h/4 - 100 * scale - 50)
        .attr("gradientUnits","userSpaceOnUse");
        
    elements=defs.append("linearGradient")
        .attr("id","profileCentralBarBottom")
        .attr("xlink:href","#linearBlueToTransGradient")
        .attr("x1",0)
        .attr("y1",h - 90)
        .attr("x2",0)
        .attr("y2",h/4 + 100 * scale + 50)
        .attr("gradientUnits","userSpaceOnUse");                    
   
    me.userObject = new User(me);

    for(var i=0; i<friends.length ; i++){
        friends[i].userObject = new User(friends[i]);	
        nodes.push(friends[i]);            
    }
	
    me.children = friends;
    nodes.push(me);
    mainLayout = d3.layout.force()
        .on("tick", tick)
        .charge(-4000)
	.alpha(0.2)
	.gravity(0)
        .size([w, h]);    
    
    update(layoutContainer,nodes);
}

function update(env,nodes) {

    var links = d3.layout.tree().links(nodes);
    
    var linkScale = d3.scale.linear().domain([0,h/2]).range([220*scale,h/2]);

  // Restart the force layout.
  mainLayout
      .nodes(nodes)
      .links(links)
	  .linkDistance(function(d,i) { var dis = linkScale((h/2)*(1-i/nodes.length)) - (2 * margins);  return dis; } )
      .start();

  // Update the links
  link = env.selectAll("line.link")
      .data(links, function(d) { return d.target.id; });

  // Enter any new links.
  link.enter().insert("svg:line", ".node")
      .attr("class", function(d) { return "link user" + d.target.id + " user" + d.source.id;})
      .attr("x1", function(d) { return d.source.id == me.id ? w/2 : d.source.x; })
      .attr("y1", function(d) { return d.source.id == me.id ? h/2 : d.source.y; })
      .attr("x2", function(d) { return d.target.userObject.x = d.target.x = Math.max(100*scale,Math.min(w - (100*scale), d.target.x));})
      .attr("y2", function(d) { return d.target.userObject.x = d.target.y = Math.max(100*scale,Math.min(w - (100*scale), d.target.y));})
      .style("stroke","#9ecae1")
      .style("stroke-width","1.5px");

  // Exit any old links.
  link.exit().remove();


  // Update the nodes
  node = env.selectAll(".userSprite")
      .data(nodes, function(d) {return d.id; });

  // Enter any new nodes.
  node.enter().append("g")
      .attr("class","userSprite")
      .attr("transform", function(d) {
                d.userObject.generateSprite(this,scale);
                if( d.id == me.id){
                        d.userObject.x = d.x = w/2;
                        d.userObject.y = d.y = h/2;
		}

                return "translate(" + d.x + "," + d.y + ")";  
        })
      .call(mainLayout.drag);

  // Exit any old nodes.
  node.exit().remove();
 
  d3.selectAll(".sprite" + me.id).transition().duration(3000).attr("opacity",1).each("end",function(){
                                    d3.selectAll(".sprite" + me.id).transition().delay(5000).duration(3000).attr("opacity",0)});                
    
} 

function tick(e) {
  var q = d3.geom.quadtree(nodes),i=0,n = nodes.length;

  while (++i < n) {
    q.visit(collide(nodes[i]));
  }

  node.forEach(function(d){ 
		if(d.y < (h/2))
			d.y = (d.y + d.y*2/h * e.alpha*4);
		else
			d.y = (d.y - d.y*2/h * e.alpha*4);  
	});
	
  node
       .attr("transform", function(d) {
		if(d.id == me.id){
			d.userObject.x = d.x = w/2;
			d.userObject.y = d.y = h/2;
		} else {
			d.userObject.x = d.x = Math.max(100*scale,Math.min(w - (100*scale), d.x));
			d.userObject.y = d.y = Math.max(100*scale,Math.min(h - (100*scale), d.y));
		}
		return "translate(" + d.x + "," + d.y + ")"; 
	});

  link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });
}



function collide(inode) {
    var r = inode.userObject.radius * scale + padding,
        nx1 = inode.x - r,
        nx2 = inode.x + r,
        ny1 = inode.y - r,
        ny2 = inode.y + r;
    return function(quad, x1, y1, x2, y2) {
	
      if (quad.point != undefined && quad.point != null && (quad.point.id != inode.id)) {
	var x = inode.x - quad.point.x,
            y = inode.y - quad.point.y,
            l = Math.sqrt(x * x + y * y),
            r = 2 * inode.userObject.radius * scale;

        if (l < r) {

    	  l = ((l - r) / l) * 0.5;
          inode.x -= x *= l;
          inode.y -= y *= l;
          quad.point.x += x;
          quad.point.y += y;
	}
      }
      return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
   };
}

$(window).resize(function() {
  //resize just happened, pixels changed
  var newScale = h<w ? h/window.innerHeight : w/window.innerWidth;
  scale *= newScale;
  ENV.attr("transform","scale("+newScale+")");
  w = window.innerWidth;
  h = window.innerHeight;
  
  d3.select("#profileMask").select("circle").attr("cx",w/2).attr("cy",h/4);
  
  if(!showingProfile)
      mainLayout.resume(); 
});
