$(function() {

    $(".user-menu").click(function(){
		if (!$(".modal-inside").is(":visible")) {
			$("#dimmer").fadeToggle();
			$(".sidebar-user").animate({width:'toggle'},350);
    	}
    });

});