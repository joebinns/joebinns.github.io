// Source: https://codepen.io/hi-im-si/pen/ALgzqos

var TxtType = function(el, toRotate, period, shouldLoop = false) {
    this.toRotate = toRotate;
    this.el = el;
    this.loopNum = 0;
    this.period = parseInt(period, 10) || 2000;
    this.shouldLoop = shouldLoop;
    this.txt = toRotate[0];
    this.tick();
    this.isDeleting = true;
};


TxtType.prototype.tick = function() {
    var i = this.loopNum % this.toRotate.length;
    var fullTxt = this.toRotate[i];

    if (this.isDeleting) {
        this.txt = fullTxt.substring(0, this.txt.length - 1);
    } else {
        this.txt = fullTxt.substring(0, this.txt.length + 1);
    }

    this.el.innerHTML = '<span class="wrap">'+this.txt+'</span>';

    var that = this;
    var delta = 150 - Math.random() * 75;

    if (this.isDeleting) { delta /= 2; }

    if (!this.isDeleting && this.txt === fullTxt) {
        delta = this.period;
        this.isDeleting = true;
        if (!this.shouldLoop) {
            if (this.loopNum >= this.toRotate.length - 1){
                return;
            }
        }
    } else if (this.isDeleting && this.txt === '') {
        this.isDeleting = false;
        this.loopNum++;
        delta = 187.5;
    }

    setTimeout(function() {
        that.tick();
    }, delta);
};

let titleTxtType;

window.onload = function() {
    /*
    var elements = document.getElementsByClassName('typewrite');
    for (var i=0; i<elements.length; i++) {
        var toRotate = elements[i].getAttribute('data-type');
        var period = elements[i].getAttribute('data-period');
        if (toRotate) {
            new TxtType(elements[i], JSON.parse(toRotate), period);
        }
    }
    */
    var element = document.getElementsByClassName('typewrite')[0];
    var toRotate = element.getAttribute('data-type');
    var period = element.getAttribute('data-period');
    titleTxtType = new TxtType(element, JSON.parse(toRotate), period);
    titleTxtType.loopNum = 2;

    // INJECT CSS (Caret)
    var css = document.createElement("style");
    css.type = "text/css";
    css.innerHTML = ".typewrite > .wrap { border-right: 0.08em solid #fff}"
    document.body.appendChild(css);
};

// TODO: Add a function for swapping text
window.SwapText = (target) => {
    var toRotate = [];
    toRotate.push(titleTxtType.txt, target);
    titleTxtType.toRotate = toRotate; //JSON.parse('[titleTxtType.txt, '+target+']');
    titleTxtType.loopNum = 0;
    titleTxtType.tick();

    console.log("swaptext");
};