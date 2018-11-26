/*
author: 朕
data: 2018-11-16
email: 3120376265@qq.com
*/
function Wipe(wipeConfig){
	this.conId = wipeConfig.id;
	this.color = wipeConfig.color || "gray";
	this.radius = wipeConfig.radius;
	this.coverType = wipeConfig.coverType;
	this.imgUrl = wipeConfig.imgUrl;
	this.width = wipeConfig.width;
	this.height = wipeConfig.height;
	this.cas = document.getElementById(this.conId);
	this.arr = wipeConfig.text;
	this.text = wipeConfig.text[randomNum(0, wipeConfig.text.length)];
	console.log(this.text);
	this.cas.style.background = "url(" + wipeConfig.imgUrl + ") center  0 no-repeat";
	this.cas.style.backgroundSize = "cover";
	this.context = cas.getContext("2d");
	this._w = this.width;
	this._h = this.height;
	this.radius = this.radius; //涂抹的半径
	this.posX = 0;
	this.posY = 0;
	this.isMouseDown = false;  //表示鼠标的状态，是否按下，默认为未按下false，按下true
// device 保存设备类型，如果是移动端则为true，PC端为false
	this.device = (/android | webos | iPhone | ipad | ipod | blackberry | iemobile | opera mini/i.test(navigator.userAgent.toLowerCase()));
	this.clickEvtName = this.device ? "touchstart" : "mousedown";
	this.moveEvtName = this.device ? "touchmove" : "mousemove";
	this.endEvtName = this.device ? "touchend" : "mouseup";
	this.wipedCallback = wipeConfig.wipedCallback;
	this.context.restore();
	this.drawMask();
	this.drawT();
	this.shijian();
	this.context.save();
}
// drawT画点和画线函数
// 参数：如果只传递两个参数x1,y1，函数功能画圆，x1,y1即圆的中心坐标
// 如果传递四个参数，函数功能画线，x1，y1为起始坐标，x2,y2为结束坐标
Wipe.prototype.drawT = function(x1,y1,x2,y2){
	var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
	var scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft;
	// console.log(scrollTop);
	if (arguments.length === 2) {
		// 调用的是画点功能
		this.context.save();
		this.context.beginPath();
		this.context.arc(x1 + scrollLeft,y1 + scrollTop,this.radius,0,2*Math.PI);
		this.context.fillStyle = "red";
		this.context.fill();
		this.context.restore();
	} else if (arguments.length === 4) {
		// 调用的是画线功能
		this.context.save();
		this.context.lineCap = "round";
		this.context.lineWidth = this.radius*2;
		this.context.beginPath();
		this.context.moveTo(x1 + scrollLeft,y1 + scrollTop);
		this.context.lineTo(x2 + scrollLeft,y2 + scrollTop);
		this.context.stroke();
		this.context.restore();
	} else {
		return false;
	}
}
// 清除画布
Wipe.prototype.clearRect = function(){
	this.context.clearRect(0,0,this._w,this._h);
	alert(this.text);
}
// 获取透明点百分比
Wipe.prototype.getTransparencyPercent = function(){
	var t = 0;
	var imgData = this.context.getImageData(0,0,this._w,this._h);
	for (var i = 0; i < imgData.data.length; i+=4) {
		var a = imgData.data[i + 3];
		if (a === 0) {
			t++;
		}
	}
	this.percent = t/(this._w * this._h) * 100;
	console.log("透明点的个数：" + t);
	// console.log("占总面积" + Math.round(this.percent) + "%");
	// return ((t / (_w * _h) )*100).toFixed(2);  //截取小数点两位
	return Math.round(this.percent);
}
Wipe.prototype.drawMask = function(){
	if (this.coverType === "color") {
		// console.log(this.color);
		this.context.fillStyle = this.color;
		this.context.fillRect(0,0,this._w,this._h);
		this.context.globalCompositeOperation = "destination-out";
	}else if(this.coverType === "images"){
		var img1 = new Image();
		var that = this;
		img1.src = that.imgUrl;
		img1.onload = function(){
			that.context.drawImage(img1,0,0,img1.width,img1.height,0,0,that._w,that._h);
			that.context.globalCompositeOperation = "destination-out";
		}
	}
}
Wipe.prototype.shijian = function(){
	var that = this;
	setTimeout(function(){
		that.getTransparencyPercent();
	},500);
	var that = this;
	// 在canvas画布上监听自定义事件"mousedown"，调用drawPoint函数
	that.cas.addEventListener(that.clickEvtName,function(evt){
		that.isMouseDown = true;
		var event = evt || window.event;
		// 获取鼠标在视口的坐标，传递参数到drawPoint
		that.posX = that.device ? event.touches[0].clientX : event.clientX;
		that.posY = that.device ? event.touches[0].clientY : event.clientY;
		that.drawT(that.posX - getAllLeft(that.cas),that.posY - getAllTop(that.cas));
	},false);
	that.cas.addEventListener(that.moveEvtName,function(evt){
		// 判断，当isMouseDown为true是，才能执行下面的操作
		if (!that.isMouseDown) {
			return false;
		} else {
			var event = evt || window.event;
			event.preventDefault();
			that.x2 = that.device ? event.touches[0].clientX : event.clientX;
			that.y2 = that.device ? event.touches[0].clientY : event.clientY;
			that.drawT(that.posX - getAllLeft(that.cas),that.posY - getAllTop(that.cas),that.x2 - getAllLeft(that.cas),that.y2 - getAllTop(that.cas));
			// 每次的就是点变成下次划线的开始点
			that.posX = that.x2;
			that.posY = that.y2;
		}
	},false);
	that.cas.addEventListener(that.endEvtName,function fn2(){
		// 还原isMouseDown 为false
		that.isMouseDown = false;
		var percent = that.getTransparencyPercent(that.context);
		// 调用同名的全局函数
		that.wipedCallback.call(null,percent);
		if (percent > 50) {
			// alert("超过了50%的面积");
			that.clearRect();
		}
	},false);
}
// 封装一个getAllLeft()函数,找到元素所有水平方向的偏移
function getAllLeft(element){
	var allLeft = 0;
	while(element){
		allLeft += element.offsetLeft;
		element = element.offsetParent;
	}
	return allLeft;
}
function getAllTop(element){
	var allTop = 0;
	while(element){
		allTop += element.offsetTop;
		element = element.offsetParent;
	}
	// console.log(allTop);
	return allTop;
}
// 封装随机数
function randomNum(max, min){
	return Math.floor( Math.random()*(max-min) + min );
}