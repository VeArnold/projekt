$(function() {
	$(".user-menu").click(function(){
		$("#dimmer").fadeToggle();
        $(".sidebar-user").animate({width:'toggle'},350);
    });	
});