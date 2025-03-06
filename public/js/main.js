(function($) {

	"use strict";

	var fullHeight = function() {

		$('.js-fullheight').css('height', $(window).height());
		$(window).resize(function(){
			$('.js-fullheight').css('height', $(window).height());
		});

	};
	fullHeight();

	$('#sidebarCollapse').on('click', function () {
      $('#sidebar').toggleClass('active');
  });

})(jQuery);

//--------------------------------------------start of implemennting groups in chatapp

function getCookie(name) {
	let matches = document.cookie.match(new RegExp(
		"(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
	));
	return matches ? decodeURIComponent(matches[1]) : undefined;
}



var userData = JSON.parse(getCookie('user'))
console.log("Cookie Data",userData)


var sender_id = userData._id
var receiver_id;
var global_group_id;
var socket = io('/user-namespace', {
	auth: {
		token: userData._id       //helps map between socket and user on database
	}
})


$(document).ready(function () {

	$('.user-list').click(function () {

		var user_id = $(this).attr('data-id');
		receiver_id = user_id;

		$('.start-head').hide(); // Hide the start heading
		$('.chat-section').show(); // Show the chat section
		
		socket.emit('exsistsChat',{sender_id: sender_id, receiver_id: receiver_id})
	});
});

// update user online status
socket.on('getOnlineUser', (data) => {
	$('#' + data.user_id + '-status').text('Online');
	$('#' + data.user_id + '-status').removeClass('offline-status');
	$('#' + data.user_id + '-status').addClass('online-status');
})

// update user offline status
socket.on('getOfflineUser', (data) => {
	$('#' + data.user_id + '-status').text('Offline');
	$('#' + data.user_id + '-status').removeClass('online-status');
	$('#' + data.user_id + '-status').addClass('offline-status');
})

//chat save of user
$('#chat-form').submit((e) => {
	e.preventDefault();
	var message = $('#message').val();

	jQuery.noConflict();
	$.ajax({
		url: '/save-chat',
		type: 'post',
		data: {
			sender_id: sender_id,
			receiver_id: receiver_id,
			message: message
		},
		success: (response) => {
			if (response.success) {
				$('#message').val('');
				let chat = response.data.message;
				let html = `
					<div class="current-user-chat" id='`+response.data._id+`'>
						<h5><span>`+chat+`</span> 
						<i class="fa fa-trash" aria-hidden="true" data-id="`+response.data._id+`" data-toggle="modal" data-target="#deleteChatModal"></i>
						<i class="fa fa-edit" aria-hidden="true" data-id="`+response.data._id+`" data-toggle="modal" data-msg='`+chat+`' data-target="#updateChatModal"></i>
						</h5>
					</div>
				`;
				$('#chat-container').append(html);
				socket.emit('newChat', response.data);
				scrollChat();
			}
			else {
				alert(data.msg)
			}
		}

	});
})

socket.on('loadNewChat',(data)=>{
	//not sure if data._id exsists
	console.log(sender_id,receiver_id)
	if((sender_id=="000000000000000000000000" )|| (receiver_id=="000000000000000000000000" )){
		let chat = data.message;
		let html = `
			<div class="distance-user-chat" id='`+data._id+`'> 
				<h5><span>`+chat+`</span></h5>
			</div>
		`;
		$('#chat-container').append(html);
		scrollChat();
	}
	if(sender_id == data.receiver_id && receiver_id == data.sender_id) {
		let chat = data.message;
		let html = `
			<div class="distance-user-chat" id='`+data._id+`'> 
				<h5><span>`+chat+`</span></h5>
			</div>
		`;
		$('#chat-container').append(html);
		scrollChat();
	}
})


socket.on('loadChats', (data) => {
	$('#chat-container').html(''); // Clear previous chats
	const chats = data.chats;
	let html = '';

	for (let x = 0; x < chats.length; x++) {
		let addClass = (chats[x]['sender_id'] == sender_id) ? 'current-user-chat' : 'distance-user-chat';

		html += `
			<div class='${addClass}' id='${chats[x]['_id']}'>
				<h5><span>${chats[x]['message']}</span>`;

		if (chats[x]['sender_id'] == sender_id) {
			html += `<i class="fa fa-trash" aria-hidden="true" data-id="${chats[x]['_id']}" data-toggle="modal" data-target="#deleteChatModal"></i>`;
			if(!chats[x]['message'].trim().toLowerCase().startsWith("<img")) html+=`<i class="fa fa-edit" aria-hidden="true" data-id="${chats[x]['_id']}" data-toggle="modal" data-msg="${chats[x]['message']}" data-target="#updateChatModal"></i>`;
		}
		
		html += `</h5>
			</div>`;
	}

	$('#chat-container').append(html);
	scrollChat(); // Ensure scrolling happens
});


function scrollChat() {
	jQuery.noConflict();
	let chatContainer = $('#chat-container');
	if(chatContainer[0]==undefined) chatContainer = $('#group-chat-container');
	chatContainer.animate({
		scrollTop: chatContainer[0].scrollHeight
	}, 'fast'); // Use 'fast' or adjust duration for smooth scrolling
}


$(document).on('click','.fa-trash',function(){
	jQuery.noConflict();
	let msg =  $(this).parent().text();
	$('#delete-message').text(msg)
	$('#delete-message-id').val($(this).attr('data-id'))
})

$('#delete-chat-form').submit(function(e){
	e.preventDefault();
	jQuery.noConflict();
	const id = $('#delete-message-id').val();
	$.ajax({
		url: '/delete-chat',
		type: 'post',
		data: {
			id: id
		},
		success: (response) => {
			if (response.success) {
				console.log("response")
				jQuery.noConflict();
				$('#'+id).remove();
				jQuery('#deleteChatModal').modal('hide');
				socket.emit('chatDeleted',id);
			}
			else {
				alert(response.msg)
			}
		}
	})
});

$('#update-chat-form').submit(function(e){
	e.preventDefault();
	jQuery.noConflict();
	const id = $('#update-message-id').val();
	const msg = $('#update-message').val();
	$.ajax({
		url: '/update-chat',
		type: 'post',
		data: {
			id: id,
			message: msg,
		},
		success: (response) => {
			if (response.success) {
				console.log("message updated")
				jQuery.noConflict();
				jQuery('#updateChatModal').modal('hide');
				console.log(jQuery('#'+id));
				jQuery('#'+id).find('span').text(msg);
				jQuery('#'+id).find('fa-edit').attr('data-msg',msg)
				socket.emit('chatUpdated',{id:id,message:msg});
			}
			else {
				alert(response.msg)
			}
		}
	})
});

socket.on('chatMessageDeleted',(id)=>{
	$('#'+id).remove();
})

socket.on('chatMessageUpdated',(data)=>{
	jQuery('#'+data.id).find('span').text(data.message);
})

jQuery(document).on('click','.fa-edit',(function(){
	//console.log(jQuery(this).attr('data-id'),jQuery(this).attr('data-msg'));
	$('#update-message-id').val(jQuery(this).attr('data-id'));
	$('#update-message').val(jQuery(this).attr('data-msg'));
}))

//add member
$('.addMember').click(function(){
	var id = $(this).attr('data-id')
	var limit = $(this).attr('data-limit')

	$('#group_id').val(id)
	$('#limit').val(limit)
	jQuery.noConflict();
	$.ajax({
		url: '/get-members',
        type: 'post',
        data: {
            group_id: id
        },
        success: (response) => {
            if (response.success) {
                let users = response.data;
				//console.log(members)
				console.log(response.data)
                let html = '';
                users.forEach(user => {
					let isMemberOfGroup = user['member'].length > 0 ? true : false
					console.log(isMemberOfGroup,user['member'])
                    html += `
							<tr>
								<td>
									<input type="checkbox"  name="members[]" value="`+user['_id']+`" ${isMemberOfGroup ? 'checked' : ''}/>
								</td>
								<td>
									`+user['name']+`
								</td>

							</tr>
					
					`
                });
                $('.addMembersinTable').html(html);
            }
            else {
                alert(response.msg)
            }
        }
	})

})

//add member form submit code
$('#add-member-form').submit(function(event){
	event.preventDefault();
	const formData = $(this).serialize();
	$.ajax({
		url: '/add-members',
        type: 'post',
        data: formData,
        success: (response) => {
            if (response.success) {
             
                jQuery.noConflict();
                jQuery('#memberModal').modal('hide');
				$('#add-member-form')[0].reset();
				alert(response.msg);
            }
            else {
				
                jQuery('#add-member-error').text(response.msg).show();
            }
        }
	})
});

//update group
$('.updateGroup').click(function(){
	var obj = JSON.parse($(this).attr('data-obj'));
	console.log("obj",obj);
	$('#update_group_id').val(obj._id)
	$('#group_name').val(obj.name)
	$('#last_limit').val(obj.limit)
	$('#group_limit').val(obj.limit)
})

$('#updateChatGroupForm').submit(function(event){
	event.preventDefault();
	
	$.ajax({
		url: '/update-chat-group',
		type: 'post',
		data: new FormData(this),
		contentType: false,
		cache: false,
        processData: false,
        success: (res) => {
			alert(res.msg)
			if(res.success){
				location.reload();
			}
		}
	});
})

//delete group
$('.deleteGroup').click(function(event){
	event.preventDefault();
	$('#delete_group_id').val($(this).attr('data-id'))
	$('#delete_group_name').text($(this).attr('data-name'))

})

$('#deleteChatGroupForm').submit(function(event){
	event.preventDefault();
	const formData = $(this).serialize();
	$.ajax({
		url: '/delete-chat-group',
        type: 'post',
        data: formData,
        success: (res) => {
            alert(res.msg)
            if(res.success){
                location.reload();
            }
        }
	})
})

//copy
$('.copy').click(function(event){
	event.preventDefault();

	$(this).prepend('<span class="copied_text">Copied</span>')

    const group_id = $(this).attr('data-id')
	const url = window.location.host+ '/share-group/'+group_id;

	let temp = $('<input>')
	$('body').append(temp)
	temp.val(url).select()
	document.execCommand('copy')
	temp.remove()
	setTimeout(()=>{
        $('.copied_text').remove()
    },2000)
})

$('.join-now').click(function(event){
	event.preventDefault();
	$(this).text('Joining...')
	$(this).attr('disabled','disabled')

    const group_id = $(this).attr('data-id')

    $.ajax({
		url: '/join-group',
        type: 'post',
        data: {group_id: group_id},
		success: function(res){
			alert(res.msg)
			if(res.success){
                location.reload();
            }
            else{
                
                $(this).text('Join Now')
                $(this).removeAttr('disabled')
            }
		}

	})
})

/*---------------------Group Chat Logic*/ 
$('.group-list').click(function(event){
	event.preventDefault();
    $('.group-chat-section').show()

	global_group_id = $(this).attr('data-id');

	loadGroupChats();
})

$('#group-chat-form').submit((e) => {
	e.preventDefault();
	console.log("Group Chat Submitted")
	var message = $('#group-message').val();

	jQuery.noConflict();
	$.ajax({
		url: '/group-chat-save',
		type: 'post',
		data: {
			sender_id: sender_id,
			group_id: global_group_id,
			message: message
		},
		success: (response) => {
			if (response.success) {
				$('#group-message').val('');
				console.log(response.chat)
				let message = response.chat.message;
				let html = `
					<div class="current-user-chat" id='`+response.chat._id+`'>
						<h5><span>`+message+`</span> 
						<i class="fa fa-trash deleteGroupChat" aria-hidden="true" data-id="`+response.chat._id+`" data-toggle="modal" data-target="#deleteGroupChatModal"></i>
						<i class="fa fa-edit updateGroupChat" aria-hidden="true" data-id="`+response.chat._id+`" data-toggle="modal" data-msg='`+message+`' data-target="#updateGroupChatModal"></i>
						</h5>
					</div>
				`;
				$('#group-chat-container').append(html);
				socket.emit('newGroupChat', response.chat);
				scrollChat();
			}
			else {
				alert(data.msg)
			}
		}

	});
})

socket.on('loadNewGroupChat', function(data){
	
	if(global_group_id == data.group_id){
		console.log("loading",data);
		let html = `
					<div class="distance-user-chat" id='`+data._id+`'>
						<h5><span>`+data.message+`</span> 
						</h5>
					</div>
				`;
		$('#group-chat-container').append(html);
		scrollChat();
	}
})

function loadGroupChats(){
	console.log("Loading Group Chats");
	$.ajax({
		url: '/load-group-chats',
        type: 'post',
        data: {
            group_id: global_group_id
        },
		success: (res) => {
			if(res.success){
				console.log(res.chats);
				const chats = res.chats;
				let html = '';
				for(let i=0;i<chats.length;i++){
					let className = 'distance-user-chat';
					if(chats[i]['sender_id'] == sender_id){
						className = 'current-user-chat';
					}
					let html = `
					<div class="${className}" id='`+chats[i]['_id']+`'>
							<h5><span>`+chats[i]['message']+`</span> 
					`;
					if(className == 'current-user-chat'){ 
					html+=`<i class="fa fa-trash deleteGroupChat" aria-hidden="true" data-id="`+chats[i]['_id']+`" data-toggle="modal" data-target="#deleteGroupChatModal"></i>`

					if(!chats[i]['message'].trim().toLowerCase().startsWith("<img")) html+=`<i class="fa fa-edit updateGroupChat" aria-hidden="true" data-id="`+chats[i]['_id']+`" data-toggle="modal" data-msg='`+chats[i]['message']+`' data-target="#updateGroupChatModal"></i>`;
					}
					html+=`</h5>
						</div>
					`;

					$('#group-chat-container').append(html);
					scrollChat();
				}
			}
			else{
				alert(res.msg);
			}
		}

	})
}

$(document).on('click','.deleteGroupChat',function(e){
	e.preventDefault();
    var msg = $(this).parent().find('span').text();
	console.log(msg);

	$('#delete-group-message').text(msg);
	$('#delete-group-message-id').val($(this).attr('data-id'));
})

$('#delete-group-chat-form').submit(function(e){
	e.preventDefault();
	const id = $('#delete-group-message-id').val();
	$.ajax({
		url: "/delete-group-chat",
		type: "POST",
        data: {id: id},
        success: function(res){
			if(res.success){
				$('#'+id).remove();
				
				jQuery('#deleteGroupChatModal').modal('hide');
				
				socket.emit('groupChatDeleted',id);
			}
			else{
				alert(res.msg);
			}
		}
	})
})

//listen for chat deleted using socket
socket.on('groupChatMessageDeleted',function(id){

	$('#'+id).remove();
})




$(document).on('click','.updateGroupChat',function(e){
	e.preventDefault();
    // var msg = $(this).parent().find('span').text();
	// console.log(msg);

	// $('#delete-group-message').text(msg);
	// $('#delete-group-message-id').val($(this).attr('data-id'));
	$('#update-group-message-id').val($(this).attr('data-id'))
	$('#update-group-message').val($(this).attr('data-msg'))
})

$('#update-group-chat-form').submit(function(e){
	e.preventDefault();
	const id  = $('#update-group-message-id').val()
	const msg = $('#update-group-message').val()
	$.ajax({
		url: "/update-group-chat",
		type: "POST", 
        data: {id: id,message:msg},
        success: function(res){
			if(res.success){
				jQuery('#updateGroupChatModal').modal('hide');
				$('#'+id).find('span').text(msg);
				$('#'+id).find('.updateGroupChat').attr('data-msg',msg);
				
				
				socket.emit('groupChatUpdated',{id: id,message:msg});
			}
			else{
				alert(res.msg);
			}
		}
	})
})

//listen for chat deleted using socket
socket.on('groupChatMessageUpdated',function(data){

	$('#'+data.id).find('span').text(data.message);
})