'use strict';
//config
var Config={
	set:function(name,value){
		localStorage.setItem('NyapConfig:'+name,value);
	},
	get:function(name){
		localStorage.getItem('NyapConfig:'+name);
	},
	delete:function(name){
		localStorage.removeItem('NyapConfig:'+name);
	}
}
if(touchMode)window.NyaP=NyaPTouch;


//初始化播放器
var tmp,NP=new NyaP({
	volume:(tmp=Config.get('volume'))!=undefined?tmp:1,
	danmakuOption:{
		allowLines:true,
		screenLimit:0,
	},
	danmakuSend:function(d,callback){
		var data={
			vid:vid,
			content:d.text,
			mode:d.mode,
			time:d.time,
			color:d.color,
			size:d.size
		};
		console.log(d);
		var d2={_:'text',text:d.text,time:d.time,mode:d.mode,style:{fontSize:d.size},date:Date.now(),did:null};
		if(d.color)d2.style.color=d.color;
		callback(d2);
		SAPI.getAccess(function(access) {
			SAPI.get('danmaku',{opt:'add',value:data,access:access},function(err,r){
				console.log(err,r);
				if(err){
					console.error(err);
					return;
				}
				d2.did=Number(r);
			});
		});
	}
});
document.body.appendChild(NP.player);
NP.player.focus();

if(self != top){//在iframe中，向父窗口发送信号
	NP.globalHandle=function(e,arg){
		window.parent.postMessage({
			type:'playerEvent',
			name:e,
			arg:arg
		},'*');
	}
	window.addEventListener("message",function(msg){
		var data=msg.data;
		if(typeof data =='object'&&data!=null){
			switch(data.type){
				case 'playerControl':{
					playerControl(data.name,data.arg);
				}
			}
		}
	});
}
function playerControl(name,arg){
}


function getSearchArg(name){
	try{
		var reg=new RegExp(name+'=([^&]+)');
		var r=document.location.search.match(reg);
		return r[1];
	}catch(e){
		return undefined;
	}
}
var vid=getSearchArg('id'),
	danmakuLoaded=false;

SAPI.refreshAccess(accessCallback);

function accessCallback(r){
	if(!r){
		alert('请刷新重试');
		return;
	}
	getVideo();
	getDanmaku();
}

//获取视频信息
function getVideo(){
	NP.loadingInfo('获取视频地址');
	NP.video.addEventListener('error',function(e){
		console.log(e)
		NP.loadingInfo('视频错误');
	});
	SAPI.getAccess(function(access){
		SAPI.get('video',{opt:'video',vid:vid,access:access},function(err,r){
			if(err)return;
			document.title=r.title;
			var addresses=Object.keys(r.address);
			if(!addresses.length){
				NP.loadingInfo('无视频地址');
				return;
			}
			var addr=r.address[addresses[(addresses.length*Math.random()+0.5)|0]];
			if(danmakuLoaded){
				loadVideo(addr);
			}else{
				setTimeout(function(){
					loadVideo(addr);
				},600);
			}
		});
	});
}
function loadVideo(address){
	NP.loadingInfo('加载视频');
	NP.video.src=address;
}


//获取弹幕
function getDanmaku(){
	NP.loadingInfo('获取弹幕');
	SAPI.getAccess(function(access){
		SAPI.get('danmaku',{opt:'get',vid:vid,access:access},function(err,r){
			if(err)return;
			var list=[];
			r.forEach(function(d){
				list.push({
					_:'text',
					text:d.c,
					time:d.t,
					mode:d.m,
					style:{
						fontSize:d.s,
						color:(d.co||'fff')
					},
					date:d.d,
					did:d.did
				});
			});
			NP.Danmaku.loadList(list);
			NP.loadingInfo('弹幕已载入');
			danmakuLoaded=true;
		});	
	});
}


