function statusChangeCallback(loginResponse) {
	if (loginResponse.status === 'connected') {
		FB.api('/me/permissions/user_friends', function(response){
			if(response.data.length > 0){
				queryAPI();
			} else {
				window.location.replace('/?redirect_url='+location.URL);
			}
		});
	} else if (loginResponse.status === 'not_authorized') {
		window.location.replace('/?redirect_url='+location.URL);
	} else {
		window.location.replace('/?redirect_url='+location.URL);
	}
}
$(document).ready(function(){
	$("#logout-link").click(function(){
		$.post('/logout',function(){
			FB.logout(function(res){
				window.location.replace('/');
			});
		});
	});
});